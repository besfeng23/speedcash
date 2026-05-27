import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions/v1';

const db = admin.firestore();

export const onUserCreate = functions
  .region('asia-southeast1')
  .auth.user()
  .onCreate(async (user) => {
    const now = admin.firestore.FieldValue.serverTimestamp();
    const existingClaims = (user.customClaims || {}) as Record<string, unknown>;
    const role = typeof existingClaims.role === 'string' ? existingClaims.role : 'user';

    await admin.auth().setCustomUserClaims(user.uid, {
      ...existingClaims,
      role,
    });

    const batch = db.batch();

    batch.set(db.doc(`users/${user.uid}`), {
      uid: user.uid,
      email: user.email || null,
      displayName: user.displayName || null,
      mobileNumber: user.phoneNumber || null,
      role,
      kycStatus: 'BASIC',
      walletStatus: 'ACTIVE',
      createdAt: now,
      updatedAt: now,
    }, { merge: true });

    for (const currency of ['PHP', 'KRW']) {
      batch.set(db.doc(`users/${user.uid}/wallets/${currency}`), {
        currency,
        balance: 0,
        availableBalance: 0,
        holdBalance: 0,
        status: 'ACTIVE',
        createdAt: now,
        updatedAt: now,
      }, { merge: true });
    }

    await batch.commit();
  });
