
import { HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { z } from 'zod';

const db = admin.firestore();

// --- Schemas ---
const getHistorySchema = z.object({
    uid: z.string().optional(),
    limit: z.number().int().positive().optional().default(50),
});

export async function getTransactionHistoryHandler(data: any, context: any) {
  if (!context.auth) throw new HttpsError('unauthenticated', 'Authentication required.');

  // An admin can request any user's history, but a user can only request their own.
  const { uid, limit } = getHistorySchema.parse(data);
  const targetUid = (context.auth.token.role === 'admin' || context.auth.token.role === 'superadmin') && uid ? uid : context.auth.uid;
  const isPartner = context.auth.token.role === 'partner';

  let query: admin.firestore.Query = db.collection('transactions');

  if (isPartner) {
    // Partners see incoming transactions only.
    query = query.where('receiverInfo.uid', '==', targetUid);
  } else {
    // Users and Admins see all transactions they are part of.
    query = query.where('userIds', 'array-contains', targetUid);
  }

  const transactionsSnapshot = await query
    .orderBy('timestamp', 'desc')
    .limit(limit)
    .get();

  const transactions = transactionsSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));

  return { transactions };
}
