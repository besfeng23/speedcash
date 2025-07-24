// Firebase Admin SDK for server-side operations only
import { initializeApp as initializeAdminApp, getApps as getAdminApps, cert } from "firebase-admin/app";
import { getFirestore as getAdminFirestore, Firestore } from "firebase-admin/firestore";

// Initialize Firebase Admin SDK for server-side operations
let adminDb: Firestore | undefined;

if (typeof window === 'undefined') {
  // Server-side only
  let adminApp;
  if (!getAdminApps().length) {
    adminApp = initializeAdminApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  } else {
    adminApp = getAdminApps()[0];
  }
  adminDb = getAdminFirestore(adminApp);
}

export { adminDb }; 