
import { onCall, CallableRequest, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
// import { auditLog } from '../utils/audit'; // TODO: Create audit utility
import { 
  p2pTransferSchema, 
  cashInSchema, 
  cashOutSchema, 
  remittanceSchema, 
  buyLoadSchema, 
  billPaymentSchema 
} from './schemas';

const db = admin.firestore();

const ensureKycVerified = async (uid: string) => {
    const userDoc = await db.doc(`users/${uid}`).get();
    if (!userDoc.exists || userDoc.data()?.kycStatus !== 'VERIFIED') {
        throw new HttpsError('failed-precondition', 'Full KYC verification is required for this transaction.');
    }
    return userDoc.data();
};

// --- Handler Implementations ---

export async function initiateP2PTransferHandler(data: any, context: CallableRequest) {
    if (!context.auth) throw new HttpsError('unauthenticated', 'Authentication required.');
    const senderUid = context.auth.uid;
    const { recipientMobileNumber, amount, currency } = p2pTransferSchema.parse(data);

    // Get sender and receiver user data
    const senderDoc = await db.doc(`users/${senderUid}`).get();
    if (!senderDoc.exists) throw new HttpsError('not-found', 'Sender profile not found.');

    const receiverQuery = await db.collection('users').where('mobileNumber', '==', recipientMobileNumber).limit(1).get();
    if (receiverQuery.empty) throw new HttpsError('not-found', 'Recipient not found.');

    const receiverDoc = receiverQuery.docs[0];
    const receiverUid = receiverDoc.id;
    const receiverName = receiverDoc.data()?.fullName || 'Unknown User';

    // Validate sender has sufficient balance
    const senderWalletRef = db.doc(`users/${senderUid}/wallets/${currency}`);
    const senderWalletDoc = await senderWalletRef.get();
    const senderBalance = senderWalletDoc.exists ? senderWalletDoc.data()?.balance || 0 : 0;

    if (senderBalance < amount) {
        throw new HttpsError('failed-precondition', 'Insufficient balance for transfer.');
    }

    // Execute transfer
    const receiverWalletRef = db.doc(`users/${receiverUid}/wallets/${currency}`);
    const now = admin.firestore.FieldValue.serverTimestamp();
    const txnRef = db.collection('transactions').doc();

    await db.runTransaction(async (tx) => {
        // Deduct from sender
        tx.update(senderWalletRef, {
            balance: admin.firestore.FieldValue.increment(-amount),
            updatedAt: now,
        });

        // Add to receiver
        tx.update(receiverWalletRef, {
            balance: admin.firestore.FieldValue.increment(amount),
            updatedAt: now,
        });

        // Record transaction
        tx.set(txnRef, {
            type: 'p2p_transfer',
            status: 'COMPLETED',
            amount,
            currency,
            senderInfo: { uid: senderUid, name: senderDoc.data()?.fullName || 'Unknown' },
            receiverInfo: { uid: receiverUid, name: receiverName },
            details: { senderName: senderDoc.data()?.fullName || 'Unknown', receiverName },
            timestamp: now,
            userIds: [senderUid, receiverUid],
        });
    });

    return { success: true, receiverName };
}

export async function initiateCashInHandler(data: any, context: CallableRequest) {
    if (!context.auth) throw new HttpsError('unauthenticated', 'Authentication required.');
    const { amount, currency, method, referenceId } = cashInSchema.parse(data);
    const uid = context.auth.uid;

    await db.doc(`users/${uid}/wallets/${currency}`).update({ balance: admin.firestore.FieldValue.increment(amount) });
    const transactionRef = db.collection('transactions').doc();
    await transactionRef.set({
        type: 'cash_in', status: 'COMPLETED', amount, currency,
        receiverInfo: { uid }, details: { method, referenceId },
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        userIds: [uid]
    });

    return { success: true, message: 'Cash-in credited successfully.', transactionId: transactionRef.id };
}

export async function initiateCashOutHandler(data: any, context: CallableRequest) {
    if (!context.auth) throw new HttpsError('unauthenticated', 'Authentication required.');
    const uid = context.auth.uid;
    await ensureKycVerified(uid);
    const { amount, currency, bankDetails } = cashOutSchema.parse(data);

    const userWalletRef = db.doc(`users/${uid}/wallets/${currency}`);
    const transactionRef = db.collection('transactions').doc();
    const cashoutRequestRef = db.collection('cashout_requests').doc(transactionRef.id);

    await db.runTransaction(async (t) => {
        const senderWallet = await t.get(userWalletRef);
        if (!senderWallet.exists || (senderWallet.data()?.balance || 0) < amount) {
            throw new HttpsError('failed-precondition', 'Insufficient funds.');
        }
        t.update(userWalletRef, { balance: admin.firestore.FieldValue.increment(-amount) });
        t.set(transactionRef, {
            type: 'cash_out', status: 'PENDING_APPROVAL', amount, currency,
            senderInfo: { uid }, details: { bankDetails },
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            userIds: [uid]
        });
        t.set(cashoutRequestRef, {
            uid, status: 'PENDING_APPROVAL', amount, currency, bankDetails, transactionId: transactionRef.id,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    });

    // await auditLog({ uid }, 'CASHOUT_REQUEST', { transactionId: transactionRef.id, amount, bank: bankDetails.bankCode });
    return { success: true, message: 'Cash-out request submitted for approval.' };
}

export async function initiateInstaPayTransferHandler(data: any, context: CallableRequest) {
    return initiateCashOutHandler(data, context);
}

export async function initiatePesoNetTransferHandler(data: any, context: CallableRequest) {
    return initiateCashOutHandler(data, context);
}

function getExchangeRatePHPtoKRW(): number {
  return 45.50; // mock value: 1 PHP = 45.50 KRW
}

export async function initiateRemittanceHandler(data: any, context: CallableRequest) {
    const uid = context.auth?.uid;
    if (!uid) throw new HttpsError("unauthenticated", "User not authenticated.");
    await ensureKycVerified(uid);

    const { amount: amountPHP, recipientDetails } = remittanceSchema.parse(data);

    if (amountPHP <= 0) throw new HttpsError("invalid-argument", "Amount must be positive.");

    // Use a fixed fee for now - can be made configurable later
    const fee = 150; // Fixed remittance fee

    const phpRef = db.doc(`users/${uid}/wallets/PHP`);
    const now = admin.firestore.FieldValue.serverTimestamp();
    const remitLogRef = db.collection(`transactions`).doc();

    await db.runTransaction(async (tx) => {
      const phpSnap = await tx.get(phpRef);
      const phpBal = phpSnap.data()?.balance || 0;
      
      const totalDeduction = amountPHP + fee;

      if (phpBal < totalDeduction) {
        throw new HttpsError("failed-precondition", "Insufficient PHP balance for amount + fee.");
      }

      tx.update(phpRef, {
        balance: admin.firestore.FieldValue.increment(-totalDeduction),
        updatedAt: now,
      });

      const exchangeRate = getExchangeRatePHPtoKRW();
      const amountKRW = amountPHP * exchangeRate;
      
      tx.set(remitLogRef, {
        type: 'remittance', status: 'PROCESSING', amount: amountPHP, currency: 'PHP',
        senderInfo: { uid: uid },
        details: { ...recipientDetails, amountPHP, amountKRW, exchangeRate, fee },
        timestamp: now, userIds: [uid],
      });

      // await auditLog({ uid }, 'TRANSACTION_REQUEST' as any, {
      //   transactionId: remitLogRef.id, amount: amountPHP, recipientBank: recipientDetails.recipientBankName,
      // });
    });

    return { success: true, message: 'Remittance request submitted successfully.' };
}

export async function initiateBuyLoadHandler(data: any, context: CallableRequest) {
    if (!context.auth) throw new HttpsError('unauthenticated', 'Authentication required.');
    const uid = context.auth.uid;
    const { mobileNumber, amount } = buyLoadSchema.parse(data);

    const userWalletRef = db.doc(`users/${uid}/wallets/PHP`);
    const transactionRef = db.collection('transactions').doc();

    await db.runTransaction(async (t) => {
        const walletDoc = await t.get(userWalletRef);
        if (!walletDoc.exists || (walletDoc.data()?.balance || 0) < amount) {
            throw new HttpsError('failed-precondition', 'Insufficient funds.');
        }

        t.update(userWalletRef, { balance: admin.firestore.FieldValue.increment(-amount) });
        t.set(transactionRef, {
            type: 'buy_load', status: 'COMPLETED', amount, currency: 'PHP',
            senderInfo: { uid }, details: { mobileNumber },
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            userIds: [uid]
        });
    });
    return { success: true };
}

export async function initiateBillPaymentHandler(data: any, context: CallableRequest) {
    if (!context.auth) throw new HttpsError('unauthenticated', 'Authentication required.');
    const uid = context.auth.uid;
    const { billerName, accountNumber, amount } = billPaymentSchema.parse(data);

    const userWalletRef = db.doc(`users/${uid}/wallets/PHP`);
    const transactionRef = db.collection('transactions').doc();

    await db.runTransaction(async (t) => {
        const walletDoc = await t.get(userWalletRef);
        if (!walletDoc.exists || (walletDoc.data()?.balance || 0) < amount) {
            throw new HttpsError('failed-precondition', 'Insufficient funds.');
        }

        t.update(userWalletRef, { balance: admin.firestore.FieldValue.increment(-amount) });
        t.set(transactionRef, {
            type: 'bill_payment', status: 'COMPLETED', amount, currency: 'PHP',
            senderInfo: { uid }, details: { billerName, accountNumber },
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            userIds: [uid]
        });
    });
    return { success: true };
}
