
import { CallableRequest, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { z } from 'zod';
import { auditLog } from '../utils/audit';

const db = admin.firestore();

const hasRole = (context: CallableRequest, role: 'admin' | 'superadmin') => {
    const userRole = context.auth?.token.role;
    if (role === 'admin') {
        return userRole === 'admin' || userRole === 'superadmin';
    }
    return userRole === role;
}

const ensureIsAdmin = (context: CallableRequest) => {
    if (!context.auth || !hasRole(context, 'admin')) {
        throw new HttpsError('permission-denied', 'Admin role required.');
    }
    return context.auth.uid;
};

// --- Schemas ---
const approvalSchema = z.object({
  transactionId: z.string(),
});
const rejectWithdrawalSchema = z.object({
    transactionId: z.string(),
    reason: z.string().optional().default("Rejected by administrator."),
});
const suspensionSchema = z.object({
    uid: z.string(),
    suspend: z.boolean(),
});
const paginationSchema = z.object({
    limit: z.number().int().positive().optional().default(20),
    offset: z.number().int().nonnegative().optional().default(0),
});
const userSchema = z.object({
    uid: z.string(),
});
const partnerSchema = z.object({
    partnerId: z.string(),
});
const platformSettingsSchema = z.object({
  appName: z.string().optional(),
  logoUrl: z.string().url().optional(),
  primaryColor: z.string().optional(),
  accentColor: z.string().optional(),
});
const partnerStatusSchema = z.object({
    partnerId: z.string(),
    status: z.enum(['VERIFIED', 'ACTION_REQUIRED']),
    reason: z.string().optional(),
});


// --- Handler Implementations ---

export async function adminApproveWithdrawalHandler(data: any, context: CallableRequest) {
  const adminUid = ensureIsAdmin(context);
  const { transactionId } = approvalSchema.parse(data);

  const transactionRef = db.doc(`transactions/${transactionId}`);
  const cashoutRequestRef = db.doc(`cashout_requests/${transactionId}`);

  const transactionDoc = await transactionRef.get();
  if (!transactionDoc.exists || transactionDoc.data()?.type !== 'cash_out') {
    throw new HttpsError('not-found', 'Cash-out transaction not found.');
  }

  // --- Start Payment Gateway Simulation ---
  await transactionRef.update({ status: 'PROCESSING' });
  await new Promise(resolve => setTimeout(resolve, 2000));
  // --- End Payment Gateway Simulation ---

  await db.runTransaction(async (t) => {
    t.update(transactionRef, { status: 'COMPLETED' });
    t.update(cashoutRequestRef, { status: 'COMPLETED', reviewedBy: adminUid });
  });

  await auditLog({ uid: adminUid }, 'ADMIN_ACTION', { action: 'APPROVE_WITHDRAWAL', transactionId });
  return { success: true, message: 'Withdrawal approved and is being processed.' };
}

export async function adminRejectWithdrawalHandler(data: any, context: CallableRequest) {
    const adminUid = ensureIsAdmin(context);
    const { transactionId, reason } = rejectWithdrawalSchema.parse(data);

    const transactionRef = db.doc(`transactions/${transactionId}`);
    const cashoutRequestRef = db.doc(`cashout_requests/${transactionId}`);

    const transactionDoc = await transactionRef.get();
    if (!transactionDoc.exists || transactionDoc.data()?.type !== 'cash_out') {
        throw new HttpsError('not-found', 'Cash-out transaction not found.');
    }
    
    const uid = transactionDoc.data()?.senderInfo.uid;
    const amount = transactionDoc.data()?.amount;
    const currency = transactionDoc.data()?.currency;

    if (!uid || !amount || !currency) {
        throw new HttpsError('internal', 'Transaction data is missing required fields.');
    }

    const userWalletRef = db.doc(`users/${uid}/wallets/${currency}`);

    await db.runTransaction(async (t) => {
        t.update(userWalletRef, { balance: admin.firestore.FieldValue.increment(amount) });
        t.update(transactionRef, { status: 'REJECTED', rejectionReason: reason });
        t.update(cashoutRequestRef, { status: 'REJECTED', reviewedBy: adminUid });
    });

    await auditLog({ uid: adminUid }, 'ADMIN_ACTION', { action: 'REJECT_WITHDRAWAL', transactionId, reason });
    return { success: true, message: `Withdrawal ${transactionId} has been rejected and refunded.` };
}

export async function adminSuspendUserHandler(data: any, context: CallableRequest) {
    const adminUid = ensureIsAdmin(context);
    const { uid, suspend } = suspensionSchema.parse(data);
    await admin.auth().updateUser(uid, { disabled: suspend });
    await auditLog({ uid: adminUid }, 'ADMIN_ACTION', { action: suspend ? 'SUSPEND_USER' : 'UNSUSPEND_USER', targetUid: uid });
    return { success: true, message: `User ${uid} has been ${suspend ? 'suspended' : 'unsuspended'}.` };
}

export async function adminGetUsersHandler(data: any, context: CallableRequest) {
    ensureIsAdmin(context);
    const { limit } = paginationSchema.parse(data);
    
    // Auth user list doesn't support ordering, so we fetch from firestore first
    const usersSnapshot = await db.collection('users').orderBy('createdAt', 'desc').limit(limit).get();
    
    const uids = usersSnapshot.docs.map(u => u.id);

    if (uids.length === 0) return { users: [] };

    const usersListResult = await admin.auth().getUsers(uids.map(uid => ({ uid })));

    const authUsersData = usersListResult.users.reduce((acc, user) => {
        acc[user.uid] = user;
        return acc;
    }, {} as {[key: string]: admin.auth.UserRecord});
    
    const users = usersSnapshot.docs.map(doc => {
        const firestoreData = doc.data();
        const userRecord = authUsersData[doc.id];
        
        if (!userRecord) {
            // This can happen if a user was deleted from Auth but not Firestore
            return null;
        }

        return {
            id: userRecord.uid,
            email: userRecord.email,
            displayName: userRecord.displayName || firestoreData.displayName,
            disabled: userRecord.disabled,
            role: userRecord.customClaims?.role || 'user',
            kycStatus: firestoreData.kycStatus || 'BASIC',
            createdAt: userRecord.metadata.creationTime,
            lastSeen: userRecord.metadata.lastSignInTime,
        };
    }).filter(Boolean); // Filter out any nulls

    return { users };
}

export async function adminGetUserHandler(data: any, context: CallableRequest) {
    ensureIsAdmin(context);
    const { uid } = userSchema.parse(data);
    
    const userDocRef = db.doc(`users/${uid}`);
    const authUserPromise = admin.auth().getUser(uid);
    const [userSnapshot, authUser] = await Promise.all([userDocRef.get(), authUserPromise]);

    if (!userSnapshot.exists) {
        // This handles the case where a user exists in Auth but not in Firestore, preventing a crash.
        throw new HttpsError('not-found', 'User data not found in the database. The user may not have completed signup.');
    }
    
    const firestoreData = userSnapshot.data() || {};
    const authData = authUser || {};

    return { 
      id: userSnapshot.id, displayName: authData.displayName || firestoreData.displayName,
      email: authData.email, mobileNumber: authData.phoneNumber || firestoreData.mobileNumber,
      disabled: authData.disabled, role: authData.customClaims?.role || 'user',
      ...firestoreData,
    };
}

export async function adminGetPartnersHandler(data: any, context: CallableRequest) {
    ensureIsAdmin(context);
    const partnersSnapshot = await db.collection('partners').orderBy('businessName').get();
    const partners = partnersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { partners };
}

export async function adminGetPartnerHandler(data: any, context: CallableRequest) {
    ensureIsAdmin(context);
    const { partnerId } = partnerSchema.parse(data);
    const partnerDocRef = db.doc(`partners/${partnerId}`);
    
    const [partnerDoc, kybDocsSnapshot] = await Promise.all([
        partnerDocRef.get(),
        partnerDocRef.collection('kyb_documents').get()
    ]);

    if (!partnerDoc.exists) throw new HttpsError('not-found', 'Partner not found.');

    const kybDocs = kybDocsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const partnerData = partnerDoc.data() || {};

    return { 
        id: partnerDoc.id, 
        ...partnerData, 
        kybDocuments: kybDocs,
    };
}

export async function adminGetKycQueueHandler(data: any, context: CallableRequest) {
    ensureIsAdmin(context);
    const { limit } = paginationSchema.parse(data);

    const submissionsSnapshot = await db.collection('kyc_submissions')
        .where('status', '==', 'PENDING_REVIEW')
        .orderBy('submittedAt', 'asc').limit(limit || 20).get();
    
    const submissions = await Promise.all(submissionsSnapshot.docs.map(async (doc) => {
        const submissionData = doc.data();
        const userSnapshot = await db.doc(`users/${submissionData.uid}`).get();
        return {
            id: doc.id, ...submissionData,
            subjectName: userSnapshot.data()?.displayName || 'N/A', subjectId: submissionData.uid, type: 'User KYC'
        };
    }));
    return { submissions };
}

export async function adminGetWithdrawalQueueHandler(data: any, context: CallableRequest) {
    ensureIsAdmin(context);
    const { limit } = paginationSchema.parse(data);

    const snapshot = await db.collection('cashout_requests')
        .where('status', '==', 'PENDING_APPROVAL')
        .orderBy('createdAt', 'asc').limit(limit || 20).get();
    
    const requests = await Promise.all(snapshot.docs.map(async (doc) => {
        const docData = doc.data();
        const userDoc = await db.doc(`users/${docData.uid}`).get();
        return { id: doc.id, ...docData, userName: userDoc.data()?.displayName || 'N/A' };
    }));
    return { requests };
}

export async function adminGetDashboardStatsHandler(data: any, context: CallableRequest) {
    ensureIsAdmin(context);

    const pendingKycPromise = db.collection('kyc_submissions')
        .where('status', '==', 'PENDING_REVIEW')
        .get();
    
    const pendingWithdrawalsPromise = db.collection('transactions')
        .where('type', '==', 'cash_out')
        .where('status', '==', 'PENDING_APPROVAL')
        .get();
    
    const newUsersPromise = db.collection('users')
        .where('createdAt', '>=', new Date(Date.now() - 24 * 60 * 60 * 1000))
        .get();
    
    const txns24hPromise = db.collection('transactions')
        .where('timestamp', '>=', new Date(Date.now() - 24 * 60 * 60 * 1000))
        .get();

    const [ pendingKycSnapshot, pendingWithdrawalsSnapshot, newUsersSnapshot, txns24hSnapshot ] = await Promise.all([
        pendingKycPromise, pendingWithdrawalsPromise, newUsersPromise, txns24hPromise
    ]);

    const totalTxnVolume24h = txns24hSnapshot.docs.reduce((sum: number, doc: any) => {
        return sum + (doc.data().amount || 0);
    }, 0);

    return {
        pendingKycCount: pendingKycSnapshot.size,
        pendingWithdrawalsCount: pendingWithdrawalsSnapshot.size,
        newUsers24h: newUsersSnapshot.size,
        totalTxnVolume24h,
    };
}

export async function adminGetActivityLogsHandler(data: any, context: CallableRequest) {
    ensureIsAdmin(context);
    const { limit } = paginationSchema.parse(data);

    const logsSnapshot = await db.collection('logs')
        .where('event', '==', 'ADMIN_ACTION')
        .orderBy('timestamp', 'desc').limit(limit || 10).get();
        
    const logs = await Promise.all(logsSnapshot.docs.map(async (doc) => {
        const logData = doc.data();
        const adminUser = await admin.auth().getUser(logData.actor.uid);
        return { 
            id: doc.id,
            adminName: adminUser.displayName || 'System Admin', 
            ...logData,
            timestamp: {
                seconds: logData.timestamp.seconds,
                nanoseconds: logData.timestamp.nanoseconds,
            }
        };
    }));
    return { logs };
}

export async function adminUpdatePlatformSettingsHandler(data: any, context: CallableRequest) {
    const adminUid = ensureIsAdmin(context);
    const settings = platformSettingsSchema.parse(data);

    const updatePayload = Object.entries(settings).reduce((acc, [key, value]) => {
        if (value !== undefined) { (acc as any)[key] = value; }
        return acc;
    }, {});
    
    if (Object.keys(updatePayload).length === 0) {
        throw new HttpsError('invalid-argument', 'No settings were provided to update.');
    }

    const settingsRef = db.doc('platform_config/branding');
    await settingsRef.set(updatePayload, { merge: true });
    await auditLog({ uid: adminUid }, 'ADMIN_ACTION', { action: 'UPDATE_PLATFORM_SETTINGS', changes: updatePayload });
    return { success: true, message: 'Platform settings updated successfully.' };
}

export async function adminUpdatePartnerStatusHandler(data: any, context: CallableRequest) {
    const adminUid = ensureIsAdmin(context);
    const { partnerId, status, reason } = partnerStatusSchema.parse(data);

    const partnerRef = db.doc(`partners/${partnerId}`);
    
    const updatePayload: Record<string, any> = {
      kybStatus: status,
      status: status === 'VERIFIED' ? 'Active' : 'Action Required',
      [`statusUpdate_by`]: adminUid,
      [`statusUpdate_at`]: admin.firestore.FieldValue.serverTimestamp(),
      [`statusUpdate_reason`]: reason || null,
    };
    
    await partnerRef.update(updatePayload);

    await auditLog({ uid: adminUid }, 'ADMIN_ACTION', { 
        action: 'UPDATE_PARTNER_STATUS', 
        targetPartnerId: partnerId, 
        newStatus: status,
        reason: reason
    });
    
    return { success: true, message: `Partner ${partnerId} status updated to ${status}.` };
}
