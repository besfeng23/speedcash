
import { onCall, CallableRequest, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { z } from 'zod';
import { auditLog } from '../utils/audit';

const db = admin.firestore();
const storage = admin.storage();

// --- Schemas ---
const kycSubmissionSchema = z.object({
  fullName: z.string().min(1, "Full name is required."),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date of birth must be in YYYY-MM-DD format."),
  address: z.string().min(1, "Address is required."),
  documentUrls: z.array(z.string().url("A valid document URL is required.")).min(1, "At least one document is required."),
});
const kycStatusUpdateSchema = z.object({
    uid: z.string(),
    status: z.enum(['VERIFIED', 'REJECTED']),
    rejectionReason: z.string().optional(),
});
const docUrlSchema = z.object({
  userId: z.string(),
  docUrl: z.string().url(),
});

// --- Handler Implementations ---

export async function submitKycHandler(data: any, context: CallableRequest) {
  if (!context.auth) throw new HttpsError('unauthenticated', 'Authentication required.');
  const uid = context.auth.uid;
  const parsedData = kycSubmissionSchema.parse(data);

  const userRef = db.doc(`users/${uid}`);
  const submissionRef = db.collection('kyc_submissions').doc(uid);
  
  await db.runTransaction(async (t) => {
    const userDoc = await t.get(userRef);
    if (!userDoc.exists) {
        throw new HttpsError('not-found', 'User profile does not exist.');
    }
    
    t.set(submissionRef, {
        ...parsedData,
        uid,
        status: 'PENDING_REVIEW',
        submittedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    
    t.update(userRef, { kycStatus: 'PENDING_REVIEW' });
  });

  return { success: true, message: 'KYC submission received and is pending review.' };
}

export async function adminUpdateKycStatusHandler(data: any, context: CallableRequest) {
  const adminUid = context.auth?.uid;
  if (context.auth?.token.role !== 'admin' && context.auth?.token.role !== 'superadmin') {
    throw new HttpsError('permission-denied', 'Admin role required.');
  }

  const { uid, status, rejectionReason } = kycStatusUpdateSchema.parse(data);

  const userRef = db.doc(`users/${uid}`);
  const submissionRef = db.doc(`kyc_submissions/${uid}`);

  await db.runTransaction(async (t) => {
    const userDoc = await t.get(userRef);
    if (!userDoc.exists) throw new HttpsError('not-found', `User with UID ${uid} not found.`);
    
    t.update(userRef, { kycStatus: status });
    t.update(submissionRef, { 
        status: status, reviewedBy: adminUid, 
        reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
        rejectionReason: rejectionReason || null,
    });
  });

  await auditLog({ uid: adminUid! }, 'ADMIN_ACTION', { 
    action: 'UPDATE_KYC_STATUS', targetUser: uid, newStatus: status, rejectionReason 
  });

  return { success: true, message: `KYC status for ${uid} updated to ${status}.` };
}

export async function addKycDocumentHandler(data: any, context: CallableRequest) {
    if (context.auth?.token.role !== 'admin' && context.auth?.token.role !== 'superadmin') {
        throw new HttpsError('permission-denied', 'Admin role required.');
    }
    const { userId, docUrl } = docUrlSchema.parse(data);
    const submissionRef = db.doc(`kyc_submissions/${userId}`);
    await submissionRef.update({
        documentUrls: admin.firestore.FieldValue.arrayUnion(docUrl)
    });
    return { success: true };
}

export async function adminDeleteKycDocumentHandler(data: any, context: CallableRequest) {
    if (context.auth?.token.role !== 'admin' && context.auth?.token.role !== 'superadmin') {
        throw new HttpsError('permission-denied', 'Admin role required.');
    }
    const { userId, docUrl } = docUrlSchema.parse(data);

    const submissionRef = db.doc(`kyc_submissions/${userId}`);
    await submissionRef.update({
        documentUrls: admin.firestore.FieldValue.arrayRemove(docUrl)
    });

    try {
        const fileRef = storage.bucket().file(decodeURIComponent(docUrl.split('/o/')[1].split('?')[0]));
        await fileRef.delete();
    } catch (error) {
        console.error("Error deleting file from storage, it might have already been deleted:", error);
    }
    return { success: true, message: "Document deleted." };
}
