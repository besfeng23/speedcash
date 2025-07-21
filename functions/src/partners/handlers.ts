
import { onCall, CallableRequest, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { z } from 'zod';
import { auditLog } from '../utils/audit';

const db = admin.firestore();

// --- Schemas ---
const createPartnerSchema = z.object({
  uid: z.string(),
  businessName: z.string(),
  email: z.string().email(),
  mobileNumber: z.string(),
});

const inviteMemberSchema = z.object({
  email: z.string().email("A valid email is required."),
  name: z.string().min(1, "Name is required."),
  role: z.string().min(1, "Role is required."),
});

const removeMemberSchema = z.object({
    userId: z.string(),
});

const testPayoutSchema = z.object({
  partnerId: z.string(),
  amount: z.number().positive(),
  channel: z.enum(['instapay', 'pesonet']),
  accountNumber: z.string(),
  accountName: z.string(),
});

const kybDocSchema = z.object({
  docId: z.string(),
  docType: z.string(),
  url: z.string().url(),
});

// --- Authorization Helper ---
const ensureIsPartner = (context: CallableRequest): string => {
    if (!context.auth || context.auth.token.role !== 'partner' || !context.auth.token.partnerId) {
        throw new HttpsError('permission-denied', 'Only authenticated partners can perform this action.');
    }
    return context.auth.token.partnerId as string;
};


// --- Handler Implementations ---

export async function createPartnerHandler(data: any, context: CallableRequest) {
  const { uid, businessName, email, mobileNumber } = createPartnerSchema.parse(data);

  // Set custom claims for the new partner user
  await admin.auth().setCustomUserClaims(uid, {
    role: 'partner',
    partnerId: uid, // The user's UID is also their Partner ID
  });

  const userDocRef = db.doc(`users/${uid}`);
  const partnerDocRef = db.doc(`partners/${uid}`);

  const batch = db.batch();

  // Create the user document
  batch.set(userDocRef, {
    uid,
    email,
    displayName: businessName,
    mobileNumber,
    role: 'partner',
    partnerId: uid,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Create the partner document
  batch.set(partnerDocRef, {
    businessName,
    primaryContactUid: uid,
    status: 'Action Required', // Initial status
    kybStatus: 'ACTION_REQUIRED',
    dateJoined: admin.firestore.FieldValue.serverTimestamp(),
    apiKeys: {}, // To be generated later
    webhookConfig: {},
  });
  
  // Create wallets for the partner
  batch.set(userDocRef.collection('wallets').doc('PHP'), { balance: 0, currency: 'PHP', updatedAt: admin.firestore.FieldValue.serverTimestamp() });
  batch.set(userDocRef.collection('wallets').doc('KRW'), { balance: 0, currency: 'KRW', updatedAt: admin.firestore.FieldValue.serverTimestamp() });


  await batch.commit();

  console.log(`Successfully created partner account for UID: ${uid} with business name: ${businessName}`);
  return { success: true, message: 'Partner account created successfully.' };
}


export async function partnerGetDashboardStatsHandler(data: any, context: CallableRequest) {
  if (!context.auth) throw new HttpsError('unauthenticated', 'User must be authenticated.');

  const partnerUid = context.auth.uid;

  const walletRef = db.doc(`users/${partnerUid}/wallets/PHP`);
  const walletPromise = walletRef.get();
  
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));
  const volume24hPromise = db.collection('transactions')
    .where('receiverInfo.uid', '==', partnerUid)
    .where('timestamp', '>=', oneDayAgo)
    .orderBy('timestamp', 'desc')
    .get();
    
  const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
  const volume7dPromise = db.collection('transactions')
    .where('receiverInfo.uid', '==', partnerUid)
    .where('timestamp', '>=', sevenDaysAgo)
    .orderBy('timestamp', 'desc')
    .get();

  const [walletDoc, volume24hSnapshot, volume7dSnapshot] = await Promise.all([
      walletPromise, volume24hPromise, volume7dPromise
  ]);

  const availableBalance = walletDoc.exists ? walletDoc.data()?.balance || 0 : 0;
  
  const volume24h = volume24hSnapshot.docs.reduce((sum: number, doc: any) => sum + (doc.data().amount || 0), 0);

  const dailyVolumes: {[key: string]: number} = {};
  for (let i = 0; i < 7; i++) {
    const d = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
    dailyVolumes[d.toISOString().split('T')[0]] = 0;
  }

  volume7dSnapshot.forEach((doc: any) => {
      const txTimestamp = doc.data().timestamp.toDate();
      const dateString = txTimestamp.toISOString().split('T')[0];
      if (dailyVolumes[dateString] !== undefined) {
          dailyVolumes[dateString] += (doc.data().amount || 0);
      }
  });

  const dailyVolumeLast7Days = Object.entries(dailyVolumes)
    .map(([date, volume]) => ({ date, volume }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return { availableBalance, volume24h, dailyVolumeLast7Days };
}

export async function partnerGetTeamMembersHandler(data: any, context: CallableRequest) {
    const partnerId = ensureIsPartner(context);
    const teamMembersSnapshot = await db.collection('users').where('partnerId', '==', partnerId).get();

    if (teamMembersSnapshot.empty) {
        return { teamMembers: [] };
    }
    
    const uids = teamMembersSnapshot.docs.map(u => u.id);
    if (uids.length === 0) return { teamMembers: [] };
    
    const usersListResult = await admin.auth().getUsers(uids.map(uid => ({ uid })));

    const authUsersData = usersListResult.users.reduce((acc, user) => {
        acc[user.uid] = user;
        return acc;
    }, {} as {[key: string]: admin.auth.UserRecord});

    const teamMembers = teamMembersSnapshot.docs.map(doc => {
        const userData = doc.data();
        const userRecord = authUsersData[doc.id];

        return {
            id: doc.id,
            name: userRecord?.displayName || userData.displayName,
            email: userRecord?.email || userData.email,
            role: userRecord?.customClaims?.role || userData.role,
            status: userRecord?.disabled ? 'Disabled' : 'Active',
        };
    });

    return { teamMembers };
}

export async function partnerInviteMemberHandler(data: any, context: CallableRequest) {
    const partnerId = ensureIsPartner(context);
    const { email, name, role } = inviteMemberSchema.parse(data);

    try {
        // 1. Create the user in Firebase Auth
        const userRecord = await admin.auth().createUser({
            email,
            displayName: name,
            // In a real app, generate a secure random password and send it via email
            password: 'password123', 
        });

        // 2. Set custom claims for the new user
        await admin.auth().setCustomUserClaims(userRecord.uid, {
            role: role,
            partnerId: partnerId,
        });

        // 3. Create a user document in Firestore
        const userDocRef = db.doc(`users/${userRecord.uid}`);
        await userDocRef.set({
            uid: userRecord.uid,
            email,
            displayName: name,
            role,
            partnerId: partnerId,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        
        console.log(`Partner ${partnerId} invited and created user ${email} with role ${role}.`);

        return { success: true, message: `Invitation sent and account created for ${email}.` };

    } catch (error: any) {
        if (error.code === 'auth/email-already-exists') {
            throw new HttpsError('already-exists', 'This email is already registered on the platform.');
        }
        console.error("Error inviting member: ", error);
        throw new HttpsError('internal', 'An unexpected error occurred while inviting the member.');
    }
}

export async function partnerRemoveMemberHandler(data: any, context: CallableRequest) {
    const partnerId = ensureIsPartner(context);
    const { userId } = removeMemberSchema.parse(data);

    // Verify the user being removed belongs to the partner's team
    const userDocRef = db.doc(`users/${userId}`);
    const userDoc = await userDocRef.get();
    
    if (!userDoc.exists || userDoc.data()?.partnerId !== partnerId) {
        throw new HttpsError('permission-denied', 'You can only remove members from your own team.');
    }

    try {
        await admin.auth().deleteUser(userId);
        await userDocRef.delete();

        console.log(`Partner ${partnerId} removed team member ${userId}.`);
        return { success: true, message: "Team member successfully removed." };
    } catch (error) {
        console.error(`Failed to remove team member ${userId} for partner ${partnerId}:`, error);
        throw new HttpsError('internal', 'Failed to remove the team member.');
    }
}


export async function partnerInitiateTestPayoutHandler(data: any, context: CallableRequest) {
    const adminUid = context.auth?.uid;
    if (context.auth?.token.role !== 'admin' && context.auth?.token.role !== 'superadmin') {
        throw new HttpsError('permission-denied', 'Admin role required.');
    }
    const parsedData = testPayoutSchema.parse(data);

    // This is a simulation. In a real app, this would interact with a payment gateway's sandbox API.
    console.log(`Admin ${adminUid} is initiating a test payout for partner ${parsedData.partnerId}.`);
    
    // Simulate a short delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Simulate success or failure
    const isSuccess = Math.random() > 0.1; // 90% success rate

    await auditLog({ uid: adminUid! }, 'ADMIN_ACTION', {
        action: 'PARTNER_TEST_PAYOUT',
        partnerId: parsedData.partnerId,
        details: parsedData,
        success: isSuccess
    });
    
    if (isSuccess) {
        return { success: true, message: 'Test payout submitted successfully.', response: 'OK' };
    } else {
        throw new HttpsError('internal', 'Simulated gateway error: Insufficient test funds.');
    }
}

export async function partnerSubmitKybDocumentHandler(data: any, context: CallableRequest) {
    const partnerId = ensureIsPartner(context);
    const { docId, docType, url } = kybDocSchema.parse(data);

    const partnerRef = db.doc(`partners/${partnerId}`);
    const docRef = partnerRef.collection('kyb_documents').doc(docId);

    try {
        await docRef.set({
            docType,
            url,
            uploadedAt: admin.firestore.FieldValue.serverTimestamp(),
            status: 'UPLOADED'
        }, { merge: true });

        // Update partner status to pending review if it's not already verified
        await partnerRef.set({
            kybStatus: 'PENDING_REVIEW'
        }, { merge: true });
        
        return { success: true };
    } catch (error) {
        console.error(`Failed to submit KYB doc ${docId} for partner ${partnerId}:`, error);
        throw new HttpsError('internal', 'Failed to submit document.');
    }
}
