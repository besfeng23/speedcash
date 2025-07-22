
import { HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { z } from 'zod';
import { auditLog } from '../utils/audit';

const db = admin.firestore();

const hasRole = (context: any, role: 'admin' | 'superadmin') => {
    const userRole = context.auth?.token.role;
    if (role === 'admin') {
        return userRole === 'admin' || userRole === 'superadmin';
    }
    return userRole === role;
}

const ensureIsAdmin = (context: any) => {
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

export async function adminApproveWithdrawalHandler(data: any, context: any) {
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

export async function adminRejectWithdrawalHandler(data: any, context: any) {
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

export async function adminSuspendUserHandler(data: any, context: any) {
    const adminUid = ensureIsAdmin(context);
    const { uid, suspend } = suspensionSchema.parse(data);
    await admin.auth().updateUser(uid, { disabled: suspend });
    await auditLog({ uid: adminUid }, 'ADMIN_ACTION', { action: suspend ? 'SUSPEND_USER' : 'UNSUSPEND_USER', targetUid: uid });
    return { success: true, message: `User ${uid} has been ${suspend ? 'suspended' : 'unsuspended'}.` };
}

export async function adminGetUsersHandler(data: any, context: any) {
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

export async function adminGetUserHandler(data: any, context: any) {
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

export async function adminGetPartnersHandler(_data: any, context: any) {
    ensureIsAdmin(context);
    const partnersSnapshot = await db.collection('partners').orderBy('businessName').get();
    const partners = partnersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { partners };
}

export async function adminGetPartnerHandler(data: any, context: any) {
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

export async function adminGetKycQueueHandler(data: any, context: any) {
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

export async function adminGetWithdrawalQueueHandler(data: any, context: any) {
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

export async function adminGetDashboardStatsHandler(_data: any, context: any) {
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

export async function adminGetActivityLogsHandler(data: any, context: any) {
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

export async function adminUpdatePlatformSettingsHandler(data: any, context: any) {
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

export async function adminUpdatePartnerStatusHandler(data: any, context: any) {
    const adminUid = ensureIsAdmin(context);
    const { partnerId, status, reason } = partnerStatusSchema.parse(data);

    const partnerRef = db.doc(`partners/${partnerId}`);
    const partnerDoc = await partnerRef.get();
    
    if (!partnerDoc.exists) {
        throw new HttpsError('not-found', 'Partner not found.');
    }

    await partnerRef.update({ 
        status, 
        statusReason: reason,
        statusUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
        statusUpdatedBy: adminUid
    });

    await auditLog({ uid: adminUid }, 'ADMIN_ACTION', { action: 'UPDATE_PARTNER_STATUS', partnerId, status, reason });
    return { success: true, message: 'Partner status updated successfully.' };
}

// --- Missing Admin Handlers ---

export async function adminGetTransactionsHandler(data: any, context: any) {
    const adminUid = ensureIsAdmin(context);
    const { limit = 50, offset = 0, status, type } = paginationSchema.extend({
        status: z.string().optional(),
        type: z.string().optional()
    }).parse(data);

    let query = db.collection('transactions').orderBy('timestamp', 'desc');
    
    if (status) {
        query = query.where('status', '==', status);
    }
    
    if (type) {
        query = query.where('type', '==', type);
    }

    const snapshot = await query.limit(limit).offset(offset).get();
    const transactions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));

    await auditLog({ uid: adminUid }, 'ADMIN_ACTION', { action: 'GET_TRANSACTIONS', limit, offset });
    return { transactions };
}

export async function adminGetTicketsHandler(data: any, context: any) {
    const adminUid = ensureIsAdmin(context);
    const { limit = 50, offset = 0, status } = paginationSchema.extend({
        status: z.string().optional()
    }).parse(data);

    let query = db.collection('support_tickets').orderBy('createdAt', 'desc');
    
    if (status && status !== 'ALL') {
        query = query.where('status', '==', status);
    }

    const snapshot = await query.limit(limit).offset(offset).get();
    const tickets = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));

    await auditLog({ uid: adminUid }, 'ADMIN_ACTION', { action: 'GET_TICKETS', limit, offset, status });
    return { tickets };
}

export async function adminUpdateSupportTicketHandler(data: any, context: any) {
    const adminUid = ensureIsAdmin(context);
    const { ticketId, status, resolutionNotes } = z.object({
        ticketId: z.string(),
        status: z.enum(['NEW', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).optional(),
        resolutionNotes: z.string().optional()
    }).parse(data);

    const ticketRef = db.doc(`support_tickets/${ticketId}`);
    const ticketDoc = await ticketRef.get();
    
    if (!ticketDoc.exists) {
        throw new HttpsError('not-found', 'Support ticket not found.');
    }

    const updateData: any = {
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: adminUid
    };

    if (status) {
        updateData.status = status;
    }

    if (resolutionNotes !== undefined) {
        updateData.resolutionNotes = resolutionNotes;
    }

    await ticketRef.update(updateData);

    await auditLog({ uid: adminUid }, 'ADMIN_ACTION', { 
        action: 'UPDATE_SUPPORT_TICKET', 
        ticketId, 
        status, 
        hasResolutionNotes: !!resolutionNotes 
    });
    
    return { success: true, message: 'Support ticket updated successfully.' };
}

export async function adminGetUserTransactionsHandler(data: any, context: any) {
    const adminUid = ensureIsAdmin(context);
    const { uid, limit = 50, offset = 0 } = userSchema.extend({
        limit: z.number().int().positive().optional().default(50),
        offset: z.number().int().nonnegative().optional().default(0)
    }).parse(data);

    // Verify user exists
    const userRef = db.doc(`users/${uid}`);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
        throw new HttpsError('not-found', 'User not found.');
    }

    const query = db.collection('transactions')
        .where('senderInfo.uid', '==', uid)
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .offset(offset);

    const snapshot = await query.get();
    const transactions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));

    await auditLog({ uid: adminUid }, 'ADMIN_ACTION', { action: 'GET_USER_TRANSACTIONS', targetUid: uid, limit, offset });
    return { transactions };
}
