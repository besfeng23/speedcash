
import { onCall, CallableRequest, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { z } from 'zod';

const db = admin.firestore();
const storage = admin.storage();
const region = 'asia-southeast1';

const functionOptions = {
  region,
  enforceAppCheck: process.env.NODE_ENV === 'production',
};

// Basic audit logging utility
const auditLog = async (action: string, userId: string, details: any) => {
  try {
    await db.collection('audit_logs').add({
      action,
      userId,
      details,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      ip: 'server-side', // Could be enhanced with actual IP tracking
    });
  } catch (error) {
    console.error('Audit logging failed:', error);
    // Don't fail the main operation if audit logging fails
  }
};

// Schema for submitting KYC data
const kycSubmissionSchema = z.object({
  fullName: z.string().min(1, "Full name is required."),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date of birth must be in YYYY-MM-DD format."),
  address: z.string().min(1, "Address is required."),
  documentUrls: z.array(z.string().url("A valid document URL is required.")).min(1, "At least one document is required."),
});

export const submitKyc = onCall(functionOptions, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Authentication required.');
  const uid = request.auth.uid;
  const data = kycSubmissionSchema.parse(request.data);

  const userRef = db.doc(`users/${uid}`);
  const submissionRef = db.collection(`users/${uid}/kyc_submissions`).doc(uid);
  
  await db.runTransaction(async (t) => {
    const userDoc = await t.get(userRef);
    if (!userDoc.exists) {
        throw new HttpsError('not-found', 'User profile does not exist.');
    }
    
    t.set(submissionRef, {
        ...data,
        uid,
        status: 'PENDING_REVIEW',
        submittedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    
    t.update(userRef, { kycStatus: 'PENDING_REVIEW' });
  });

  // Add audit logging
  await auditLog('KYC_SUBMISSION', uid, {
    fullName: data.fullName,
    dateOfBirth: data.dateOfBirth,
    documentCount: data.documentUrls.length,
    status: 'PENDING_REVIEW'
  });

  return { success: true, message: 'KYC submission received and is pending review.' };
});

const kycStatusUpdateSchema = z.object({
    uid: z.string(),
    status: z.enum(['VERIFIED', 'REJECTED']),
    rejectionReason: z.string().optional(),
});

export const adminUpdateKycStatus = onCall(functionOptions, async (request) => {
  const adminUid = request.auth?.uid;
  // This check ensures only users with the 'admin' custom claim can proceed.
  if (request.auth?.token.role !== 'admin' && request.auth?.token.role !== 'superadmin') {
    throw new HttpsError('permission-denied', 'Admin role required.');
  }

  const { uid, status, rejectionReason } = kycStatusUpdateSchema.parse(request.data);

  const userRef = db.doc(`users/${uid}`);
  const submissionRef = db.doc(`kyc_submissions/${uid}`);

  await db.runTransaction(async (t) => {
    const userDoc = await t.get(userRef);
    if (!userDoc.exists) {
      throw new HttpsError('not-found', `User with UID ${uid} not found.`);
    }
    t.update(userRef, { kycStatus: status });
    t.update(submissionRef, { 
        status: status, 
        reviewedBy: adminUid, 
        reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
        rejectionReason: rejectionReason || null,
    });
  });

  // TODO: Add audit logging
  // await auditLog({ uid: adminUid! }, 'ADMIN_ACTION', { 
  //   action: 'UPDATE_KYC_STATUS', 
  //   targetUser: uid, 
  //   newStatus: status, 
  //   rejectionReason 
  // });

  return { success: true, message: `KYC status for ${uid} updated to ${status}.` };
});

const docUrlSchema = z.object({
  userId: z.string(),
  docUrl: z.string().url(),
});

export const addKycDocument = onCall(functionOptions, async (request) => {
    if (request.auth?.token.role !== 'admin' && request.auth?.token.role !== 'superadmin') {
        throw new HttpsError('permission-denied', 'Admin role required.');
    }
    const { userId, docUrl } = docUrlSchema.parse(request.data);
    const submissionRef = db.doc(`kyc_submissions/${userId}`);
    await submissionRef.update({
        documentUrls: admin.firestore.FieldValue.arrayUnion(docUrl)
    });
    return { success: true };
});

export const adminDeleteKycDocument = onCall(functionOptions, async (request) => {
    if (request.auth?.token.role !== 'admin' && request.auth?.token.role !== 'superadmin') {
        throw new HttpsError('permission-denied', 'Admin role required.');
    }
    const { userId, docUrl } = docUrlSchema.parse(request.data);

    // 1. Delete from Firestore array
    const submissionRef = db.doc(`kyc_submissions/${userId}`);
    await submissionRef.update({
        documentUrls: admin.firestore.FieldValue.arrayRemove(docUrl)
    });

    // 2. Delete from Cloud Storage
    try {
        // Extract the file path from the URL.
        // It's the string between '/o/' and '?alt=media'.
        const decodedUrl = decodeURIComponent(docUrl);
        const filePath = decodedUrl.substring(decodedUrl.indexOf('/o/') + 3, decodedUrl.indexOf('?alt=media'));
        
        const bucket = storage.bucket();
        const file = bucket.file(filePath);
        await file.delete();
        
        console.log(`Successfully deleted ${filePath} from Storage.`);
    } catch (error) {
        console.error("Error deleting file from storage, it might have already been deleted or URL was malformed:", error);
        // We don't throw an error here to allow admins to clean up broken links in Firestore.
    }

    return { success: true, message: "Document deleted." };
});
