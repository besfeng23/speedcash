import { onRequest } from 'firebase-functions/v2/https';
import * as crypto from 'crypto';
import * as admin from 'firebase-admin';

// SpeedyPay Configuration
const SPEEDYPAY_CONFIG = {
  secretKey: process.env.SPEEDYPAY_SECRET_KEY || 'uck6lo8sdjaarqf3sohdoovdvvn0kdnk',
  merchantSeq: process.env.SPEEDYPAY_MERCHANT_SEQ || '300000064613',
};

// Transaction State Codes
const TRANSACTION_STATES = {
  '00': 'SUCCESS',
  '01': 'FAILED',
  '03': 'PARTIAL_REFUND',
  '04': 'FULL_REFUND',
  '05': 'FAILED_REFUND',
  '06': 'IN_PROCESS',
  '07': 'ORDER_TO_BE_PAID',
  '08': 'CANCELLED',
  '09': 'EXPIRED'
} as const;

// SpeedyPay Signature Verification
function verifySpeedyPaySignature(params: any, secretKey: string, receivedSignature: string): boolean {
  try {
    const filteredParams: { [key: string]: any } = {};
    for (const [key, value] of Object.entries(params)) {
      if (value !== null && value !== undefined && key !== 'sign') {
        filteredParams[key] = value;
      }
    }

    const sortedKeys = Object.keys(filteredParams).sort();
    const concatenatedString = sortedKeys
      .map(key => `${key}=${filteredParams[key]}`)
      .join('&');
    const finalString = concatenatedString + '&' + secretKey;
    const calculatedSignature = crypto.createHash('sha256').update(finalString).digest('hex');

    return calculatedSignature === receivedSignature;
  } catch (error) {
    console.error('Error verifying SpeedyPay signature:', error);
    return false;
  }
}

export const simpleTest = onRequest({ region: 'asia-southeast1' }, async (req, res) => {
  // Set CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    // Check if this is a SpeedyPay webhook request
    if (req.path.includes('/speedypay') || req.body?.sign) {
      // Handle SpeedyPay webhook
      console.log('SpeedyPay webhook received:', req.body);

      if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
      }

      const webhookData = req.body;
      const receivedSignature = webhookData.sign;

      if (!receivedSignature) {
        res.status(400).json({ error: 'Missing signature' });
        return;
      }

      // Verify signature
      const isSignatureValid = verifySpeedyPaySignature(
        webhookData,
        SPEEDYPAY_CONFIG.secretKey,
        receivedSignature
      );

      if (!isSignatureValid) {
        console.error('Invalid webhook signature');
        res.status(401).json({ error: 'Invalid signature' });
        return;
      }

      // Verify merchant ID
      if (webhookData.merchSeq !== SPEEDYPAY_CONFIG.merchantSeq) {
        console.error('Invalid merchant ID in webhook');
        res.status(401).json({ error: 'Invalid merchant ID' });
        return;
      }

      // Process transaction update
      const db = admin.firestore();
      const transactionUpdate = {
        orderSeq: webhookData.orderSeq,
        transSeq: webhookData.transSeq,
        transState: webhookData.transState,
        transStateDescription: TRANSACTION_STATES[webhookData.transState as keyof typeof TRANSACTION_STATES],
        amount: parseFloat(webhookData.amount || '0'),
        currency: webhookData.currency,
        procId: webhookData.procId,
        procDetail: webhookData.procDetail,
        respCode: webhookData.respCode,
        respMessage: webhookData.respMessage,
        updatedAt: new Date(),
        webhookReceivedAt: new Date()
      };

      // Find and update transaction
      const transactionRef = db.collection('transactions').where('orderSeq', '==', webhookData.orderSeq);
      const snapshot = await transactionRef.get();

      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        await doc.ref.update(transactionUpdate);
        console.log('Transaction updated successfully:', webhookData.orderSeq);
      } else {
        console.warn('Transaction not found in database:', webhookData.orderSeq);
      }

      res.status(200).json({
        success: true,
        message: 'SpeedyPay webhook processed successfully',
        timestamp: new Date().toISOString()
      });

      return;
    }

    // Default test response
    res.json({ 
      message: 'Simple test function working! Also handles SpeedyPay webhooks.',
      timestamp: new Date().toISOString(),
      note: 'Send SpeedyPay webhook data to this endpoint or use path containing /speedypay',
      endpoint: 'https://simpletest-n4f73lnkeq-as.a.run.app'
    });

  } catch (error) {
    console.error('Error in simple test/SpeedyPay webhook:', error);
    res.status(500).json({
      error: 'Internal server error',
      timestamp: new Date().toISOString(),
    });
  }
}); 