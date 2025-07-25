import * as functions from 'firebase-functions';
import * as crypto from 'crypto';
import * as admin from 'firebase-admin';
import { Logger } from '../utils/logger';
import { monitoring } from '../utils/monitoring';

// Initialize logger
const logger = new Logger('speedypay-webhook');

// 🔐 SpeedyPay Webhook Configuration
const SPEEDYPAY_CONFIG = {
  secretKey: process.env.SPEEDYPAY_SECRET_KEY || 'uck6lo8sdjaarqf3sohdoovdvvn0kdnk',
  merchantSeq: process.env.SPEEDYPAY_MERCHANT_SEQ || '300000064613',
  webhookPath: '/webhook/speedypay'
};

// 📊 Transaction State Codes
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

// 🔢 SpeedyPay Signature Verification
function verifySpeedyPaySignature(params: any, secretKey: string, receivedSignature: string): boolean {
  try {
    // 1. Filter out null values and the sign field
    const filteredParams: { [key: string]: any } = {};
    for (const [key, value] of Object.entries(params)) {
      if (value !== null && value !== undefined && key !== 'sign') {
        filteredParams[key] = value;
      }
    }

    // 2. Sort parameters alphabetically
    const sortedKeys = Object.keys(filteredParams).sort();
    
    // 3. Concatenate key-value pairs with &
    const concatenatedString = sortedKeys
      .map(key => `${key}=${filteredParams[key]}`)
      .join('&');

    // 4. Append secret key
    const finalString = concatenatedString + '&' + secretKey;

    // 5. Generate SHA256 hash
    const calculatedSignature = crypto.createHash('sha256').update(finalString).digest('hex');

    // 6. Compare signatures
    return calculatedSignature === receivedSignature;
  } catch (error) {
    logger.error('Error verifying SpeedyPay signature', { error: String(error) });
    return false;
  }
}

// 📝 SpeedyPay Webhook Data Interface
interface SpeedyPayWebhookData {
  signType: string;
  sign: string;
  timestamp: string;
  merchSeq: string;
  orderSeq: string;
  transSeq: string;
  transState: keyof typeof TRANSACTION_STATES;
  amount: string;
  currency: string;
  procId: string;
  procDetail: string;
  purposes: string;
  firstName: string;
  lastName?: string;
  mobilePhone?: string;
  createTime?: string;
  notifyTime?: string;
  respCode: string;
  respMessage: string;
}

// 🔄 Process Transaction Update
async function processTransactionUpdate(webhookData: SpeedyPayWebhookData) {
  try {
    const {
      orderSeq,
      transSeq,
      transState,
      amount,
      currency,
      procId,
      procDetail,
      respCode,
      respMessage,
      createTime,
      notifyTime
    } = webhookData;

    // 📊 Log transaction update
    logger.info('Processing SpeedyPay transaction update', {
      orderSeq,
      transSeq,
      transState,
      amount,
      currency,
      procId,
      respCode
    });

    // 🎯 Update transaction in database
    const transactionUpdate = {
      orderSeq,
      transSeq,
      transState,
      transStateDescription: TRANSACTION_STATES[transState],
      amount: parseFloat(amount),
      currency,
      procId,
      procDetail,
      respCode,
      respMessage,
      createTime,
      notifyTime,
      updatedAt: new Date(),
      webhookReceivedAt: new Date()
    };

    // 🔍 Find and update transaction in Firestore
    const db = admin.firestore();
    const transactionRef = db.collection('transactions').where('orderSeq', '==', orderSeq);
    const snapshot = await transactionRef.get();

    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      await doc.ref.update(transactionUpdate);
      
      logger.info('Transaction updated successfully', {
        transactionId: doc.id,
        orderSeq,
        transState
      });

      // 📊 Send monitoring metrics
      monitoring.logApiCall({}, 'speedypay_transaction_update', true);

      // 🔔 Send notifications based on transaction state
      await sendTransactionNotifications(transactionUpdate);

    } else {
      logger.warn('Transaction not found in database', { orderSeq });
    }

    return { success: true, message: 'Transaction processed successfully' };

  } catch (error) {
    logger.error('Error processing transaction update', { error: String(error) });
    throw error;
  }
}

// 🔔 Send Transaction Notifications
async function sendTransactionNotifications(transaction: any) {
  try {
    const { transState } = transaction;

    // 📧 Email notifications
    if (transState === 'SUCCESS') {
      await sendSuccessNotification(transaction);
    } else if (transState === 'FAILED') {
      await sendFailureNotification(transaction);
    }

    // 📱 Push notifications (if implemented)
    await sendPushNotification(transaction);

    // 💬 Admin notifications for critical states
    if (['FAILED', 'CANCELLED', 'EXPIRED'].includes(transState)) {
      await sendAdminAlert(transaction);
    }

  } catch (error) {
    logger.error('Error sending transaction notifications', { error: String(error) });
  }
}

// 📧 Send Success Notification
async function sendSuccessNotification(transaction: any) {
  // Implementation for success email notification
  logger.info('Sending success notification', {
    orderSeq: transaction.orderSeq,
    amount: transaction.amount,
    currency: transaction.currency
  });
}

// 📧 Send Failure Notification
async function sendFailureNotification(transaction: any) {
  // Implementation for failure email notification
  logger.info('Sending failure notification', {
    orderSeq: transaction.orderSeq,
    respMessage: transaction.respMessage
  });
}

// 📱 Send Push Notification
async function sendPushNotification(transaction: any) {
  // Implementation for push notification
  logger.info('Sending push notification', {
    orderSeq: transaction.orderSeq,
    transState: transaction.transState
  });
}

// 🚨 Send Admin Alert
async function sendAdminAlert(transaction: any) {
  // Implementation for admin alert
  logger.info('Sending admin alert', {
    orderSeq: transaction.orderSeq,
    transState: transaction.transState,
    respMessage: transaction.respMessage
  });
}

// 🌐 SpeedyPay Webhook Handler
export const speedypayWebhook = functions.https.onRequest({ 
  region: 'asia-southeast1',
  cors: true 
}, async (req, res) => {
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
    // 📊 Start monitoring
    const startTime = Date.now();
    monitoring.logApiCall(req, 'speedypay_webhook_received', true);

    // 🔍 Validate request method
    if (req.method !== 'POST') {
      logger.warn('Invalid webhook request method', { method: req.method });
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    // 📝 Log incoming webhook
    logger.info('SpeedyPay webhook received', {
      headers: req.headers,
      body: req.body,
      timestamp: new Date().toISOString()
    });

    // 🔐 Extract and verify signature
    const webhookData: SpeedyPayWebhookData = req.body;
    const receivedSignature = webhookData.sign;

    if (!receivedSignature) {
      logger.error('Missing signature in webhook');
      res.status(400).json({ error: 'Missing signature' });
      return;
    }

    // ✅ Verify signature
    const isSignatureValid = verifySpeedyPaySignature(
      webhookData,
      SPEEDYPAY_CONFIG.secretKey,
      receivedSignature
    );

    if (!isSignatureValid) {
      logger.error('Invalid webhook signature', {
        receivedSignature,
        webhookData
      });

      res.status(401).json({ error: 'Invalid signature' });
      return;
    }

    // ✅ Verify merchant ID
    if (webhookData.merchSeq !== SPEEDYPAY_CONFIG.merchantSeq) {
      logger.error('Invalid merchant ID in webhook', {
        received: webhookData.merchSeq,
        expected: SPEEDYPAY_CONFIG.merchantSeq
      });
      res.status(401).json({ error: 'Invalid merchant ID' });
      return;
    }

    // 🔄 Process transaction update
    await processTransactionUpdate(webhookData);

    // 📊 Record success metrics
    const processingTime = Date.now() - startTime;
    monitoring.logApiCall(req, 'speedypay_webhook_processing_time', true);

    // ✅ Send success response
    res.status(200).json({
      success: true,
      message: 'Webhook processed successfully',
      timestamp: new Date().toISOString(),
      processingTime
    });

    logger.info('SpeedyPay webhook processed successfully', {
      orderSeq: webhookData.orderSeq,
      transState: webhookData.transState,
      processingTime
    });

  } catch (error: any) {
    logger.error('Error processing SpeedyPay webhook', { error: String(error) });
    
    // 📊 Record error metrics
    monitoring.logApiCall(req, 'speedypay_webhook_error', false, error);

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

// 🔍 Webhook Health Check
export const speedypayWebhookHealth = functions.https.onRequest({ 
  region: 'asia-southeast1',
  cors: true 
}, async (req, res) => {
  // Set CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    const healthCheck = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      config: {
        merchantSeq: SPEEDYPAY_CONFIG.merchantSeq,
        webhookPath: SPEEDYPAY_CONFIG.webhookPath
      },
      transactionStates: Object.keys(TRANSACTION_STATES).length,
      signatureAlgorithm: 'SHA256'
    };

    res.status(200).json(healthCheck);
  } catch (error: any) {
    logger.error('Webhook health check failed', { error: String(error) });
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 📊 Webhook Statistics
export const speedypayWebhookStats = functions.https.onRequest({ 
  region: 'asia-southeast1',
  cors: true 
}, async (req, res) => {
  // Set CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    const db = admin.firestore();
    const stats = {
      totalWebhooks: 0,
      successfulTransactions: 0,
      failedTransactions: 0,
      pendingTransactions: 0,
      last24Hours: {
        total: 0,
        success: 0,
        failed: 0
      }
    };

    // Get statistics from Firestore
    const transactionsRef = db.collection('transactions');
    const snapshot = await transactionsRef.get();

    snapshot.forEach(doc => {
      const data = doc.data();
      stats.totalWebhooks++;

      if (data.transState === 'SUCCESS') {
        stats.successfulTransactions++;
      } else if (data.transState === 'FAILED') {
        stats.failedTransactions++;
      } else {
        stats.pendingTransactions++;
      }

      // Last 24 hours
      const webhookTime = data.webhookReceivedAt?.toDate();
      if (webhookTime && webhookTime > new Date(Date.now() - 24 * 60 * 60 * 1000)) {
        stats.last24Hours.total++;
        if (data.transState === 'SUCCESS') {
          stats.last24Hours.success++;
        } else if (data.transState === 'FAILED') {
          stats.last24Hours.failed++;
        }
      }
    });

    res.status(200).json({
      success: true,
      stats,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    logger.error('Error getting webhook statistics', { error: String(error) });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 🔧 Webhook Test Endpoint
export const speedypayWebhookTest = functions.https.onRequest({ 
  region: 'asia-southeast1',
  cors: true 
}, async (req, res) => {
  // Set CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    // Create test webhook data
    const testWebhookData: SpeedyPayWebhookData = {
      signType: 'SHA256',
      sign: '', // Will be generated
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      merchSeq: SPEEDYPAY_CONFIG.merchantSeq,
      orderSeq: 'TEST_' + Date.now(),
      transSeq: 'TRANS_' + Date.now(),
      transState: '06', // IN_PROCESS
      amount: '100.00',
      currency: 'PHP',
      procId: 'GXCHPHM2XXX',
      procDetail: '09123456789',
      purposes: 'Test Payout',
      firstName: 'John',
      lastName: 'Doe',
      mobilePhone: '09123456789',
      createTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
      notifyTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
      respCode: '00000000',
      respMessage: 'Success'
    };

    // Generate signature
    const signature = verifySpeedyPaySignature(
      testWebhookData,
      SPEEDYPAY_CONFIG.secretKey,
      ''
    );

    testWebhookData.sign = signature ? 'valid_signature' : 'invalid_signature';

    res.status(200).json({
      success: true,
      message: 'Test webhook data generated',
      webhookData: testWebhookData,
      instructions: 'Use this data to test the webhook endpoint',
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    logger.error('Error generating test webhook data', { error: String(error) });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default {
  speedypayWebhook,
  speedypayWebhookHealth,
  speedypayWebhookStats,
  speedypayWebhookTest
}; 