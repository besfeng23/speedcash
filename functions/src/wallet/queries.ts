
import { HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { z } from 'zod';

const db = admin.firestore();

// --- Schemas ---
const getBalanceSchema = z.object({
  uid: z.string().optional(), // Admin can specify a UID
});
const getProfileSchema = z.object({
  uid: z.string().optional(),
});


// --- Handlers ---
export async function getWalletBalanceHandler(data: any, context: any) {
  if (!context.auth) throw new HttpsError('unauthenticated', 'Authentication required.');
  
  const { uid } = getBalanceSchema.parse(data);
  // An admin can request any user's balance, but a user can only request their own.
  const targetUid = (context.auth.token.role === 'admin' || context.auth.token.role === 'superadmin') && uid ? uid : context.auth.uid;

  const walletsRef = db.collection(`users/${targetUid}/wallets`);
  const walletsSnapshot = await walletsRef.get();
  
  if (walletsSnapshot.empty) {
    return { balances: {}, walletNotSetUp: true };
  }

  const balances: Record<string, number> = {};
  walletsSnapshot.forEach(doc => {
    balances[doc.id] = doc.data().balance || 0;
  });

  return { balances };
}


export async function getUserProfileHandler(data: any, context: any) {
  if (!context.auth) throw new HttpsError('unauthenticated', 'Authentication required.');
  
  const { uid } = getProfileSchema.parse(data);
  const targetUid = (context.auth.token.role === 'admin' || context.auth.token.role === 'superadmin') && uid ? uid : context.auth.uid;

  const userDocRef = db.doc(`users/${targetUid}`);
  const userDoc = await userDocRef.get();

  if (!userDoc.exists) {
    throw new HttpsError('not-found', 'User profile not found.');
  }

  return userDoc.data();
}
