import { HttpsError } from 'firebase-functions/v2/https';
import { PaymentGatewayFactory, getPaymentGatewayConfig } from './payment-gateways';
import { KoreanMallIntegration } from './korean-mall-integration';
import { auditLog } from '../utils/audit';

// --- Integration Handlers ---

// Payment Gateway Handlers
export async function processInstaPayTransferHandler(data: any, context: any) {
  if (!context.auth) throw new HttpsError('unauthenticated', 'Authentication required.');
  
  try {
    const config = getPaymentGatewayConfig('instapay');
    const gateway = PaymentGatewayFactory.createGateway('instapay', config);
    
    const result = await gateway.initiateTransfer({
      amount: data.amount,
      currency: data.currency,
      referenceId: data.referenceId,
      description: data.description,
      recipientInfo: data.recipientInfo,
    });

    if (result.success) {
      await auditLog({ uid: context.auth.uid }, 'PAYMENT_GATEWAY_SUCCESS', {
        gateway: 'instapay',
        amount: data.amount,
        currency: data.currency,
        transactionId: result.transactionId,
      });
    }

    return result;
  } catch (error) {
    console.error('InstaPay transfer handler error:', error);
    throw new HttpsError('internal', 'InstaPay transfer failed.');
  }
}

export async function processGCashTransferHandler(data: any, context: any) {
  if (!context.auth) throw new HttpsError('unauthenticated', 'Authentication required.');
  
  try {
    const config = getPaymentGatewayConfig('gcash');
    const gateway = PaymentGatewayFactory.createGateway('gcash', config);
    
    const result = await gateway.initiateTransfer({
      amount: data.amount,
      currency: data.currency,
      referenceId: data.referenceId,
      description: data.description,
      recipientInfo: data.recipientInfo,
    });

    if (result.success) {
      await auditLog({ uid: context.auth.uid }, 'PAYMENT_GATEWAY_SUCCESS', {
        gateway: 'gcash',
        amount: data.amount,
        currency: data.currency,
        transactionId: result.transactionId,
      });
    }

    return result;
  } catch (error) {
    console.error('GCash transfer handler error:', error);
    throw new HttpsError('internal', 'GCash transfer failed.');
  }
}

export async function processMayaTransferHandler(data: any, context: any) {
  if (!context.auth) throw new HttpsError('unauthenticated', 'Authentication required.');
  
  try {
    const config = getPaymentGatewayConfig('maya');
    const gateway = PaymentGatewayFactory.createGateway('maya', config);
    
    const result = await gateway.initiateTransfer({
      amount: data.amount,
      currency: data.currency,
      referenceId: data.referenceId,
      description: data.description,
      recipientInfo: data.recipientInfo,
    });

    if (result.success) {
      await auditLog({ uid: context.auth.uid }, 'PAYMENT_GATEWAY_SUCCESS', {
        gateway: 'maya',
        amount: data.amount,
        currency: data.currency,
        transactionId: result.transactionId,
      });
    }

    return result;
  } catch (error) {
    console.error('Maya transfer handler error:', error);
    throw new HttpsError('internal', 'Maya transfer failed.');
  }
}

export async function processKoreanBankTransferHandler(data: any, context: any) {
  if (!context.auth) throw new HttpsError('unauthenticated', 'Authentication required.');
  
  try {
    const config = getPaymentGatewayConfig('korean-bank');
    const gateway = PaymentGatewayFactory.createGateway('korean-bank', config);
    
    const result = await gateway.initiateTransfer({
      amount: data.amount,
      currency: data.currency,
      referenceId: data.referenceId,
      description: data.description,
      recipientInfo: data.recipientInfo,
    });

    if (result.success) {
      await auditLog({ uid: context.auth.uid }, 'PAYMENT_GATEWAY_SUCCESS', {
        gateway: 'korean-bank',
        amount: data.amount,
        currency: data.currency,
        transactionId: result.transactionId,
      });
    }

    return result;
  } catch (error) {
    console.error('Korean bank transfer handler error:', error);
    throw new HttpsError('internal', 'Korean bank transfer failed.');
  }
}

// Example: Adding New Partner Handler (Plug-and-Play)
export async function processNewPartnerTransferHandler(data: any, context: any) {
  if (!context.auth) throw new HttpsError('unauthenticated', 'Authentication required.');
  
  try {
    const config = getPaymentGatewayConfig('new-partner');
    const gateway = PaymentGatewayFactory.createGateway('new-partner', config);
    
    const result = await gateway.initiateTransfer({
      amount: data.amount,
      currency: data.currency,
      referenceId: data.referenceId,
      description: data.description,
      recipientInfo: data.recipientInfo,
    });

    if (result.success) {
      await auditLog({ uid: context.auth.uid }, 'PAYMENT_GATEWAY_SUCCESS', {
        gateway: 'new-partner',
        amount: data.amount,
        currency: data.currency,
        transactionId: result.transactionId,
      });
    }

    return result;
  } catch (error) {
    console.error('New partner transfer handler error:', error);
    throw new HttpsError('internal', 'New partner transfer failed.');
  }
}

// Korean Mall Integration Handlers
export async function createKoreanMallStoreHandler(data: any, context: any) {
  const integration = new KoreanMallIntegration();
  return await integration.createKoreanMallStore(data, context);
}

export async function processKoreanMallPaymentHandler(data: any, context: any) {
  const integration = new KoreanMallIntegration();
  return await integration.processKoreanMallPayment(data, context);
}

export async function getKoreanMallStatsHandler(data: any, context: any) {
  if (!context.auth) throw new HttpsError('unauthenticated', 'Authentication required.');
  
  const { storeId } = data;
  if (!storeId) throw new HttpsError('invalid-argument', 'Store ID is required.');
  
  const integration = new KoreanMallIntegration();
  return await integration.getKoreanMallStats(storeId, context);
}

// Webhook Handlers for Payment Gateway Callbacks
export async function handleInstaPayWebhookHandler(data: any, context: any) {
  try {
    // Verify webhook signature
    // TODO: Implement webhook signature verification
    
    const { transaction_id, status, amount, currency } = data;
    
    // Update transaction status in database
    // TODO: Implement transaction status update logic
    
    await auditLog({ uid: 'system' }, 'WEBHOOK_RECEIVED', {
      gateway: 'instapay',
      transactionId: transaction_id,
      status,
      amount,
      currency,
    });

    return { success: true, message: 'Webhook processed successfully' };
  } catch (error) {
    console.error('InstaPay webhook handler error:', error);
    throw new HttpsError('internal', 'Webhook processing failed.');
  }
}

export async function handleGCashWebhookHandler(data: any, context: any) {
  try {
    // Verify webhook signature
    // TODO: Implement webhook signature verification
    
    const { transaction_id, status, amount, currency } = data;
    
    // Update transaction status in database
    // TODO: Implement transaction status update logic
    
    await auditLog({ uid: 'system' }, 'WEBHOOK_RECEIVED', {
      gateway: 'gcash',
      transactionId: transaction_id,
      status,
      amount,
      currency,
    });

    return { success: true, message: 'Webhook processed successfully' };
  } catch (error) {
    console.error('GCash webhook handler error:', error);
    throw new HttpsError('internal', 'Webhook processing failed.');
  }
}

export async function handleMayaWebhookHandler(data: any, context: any) {
  try {
    // Verify webhook signature
    // TODO: Implement webhook signature verification
    
    const { transaction_id, status, amount, currency } = data;
    
    // Update transaction status in database
    // TODO: Implement transaction status update logic
    
    await auditLog({ uid: 'system' }, 'WEBHOOK_RECEIVED', {
      gateway: 'maya',
      transactionId: transaction_id,
      status,
      amount,
      currency,
    });

    return { success: true, message: 'Webhook processed successfully' };
  } catch (error) {
    console.error('Maya webhook handler error:', error);
    throw new HttpsError('internal', 'Webhook processing failed.');
  }
}

export async function handleKoreanBankWebhookHandler(data: any, context: any) {
  try {
    // Verify webhook signature
    // TODO: Implement webhook signature verification
    
    const { transaction_id, status, amount, currency } = data;
    
    // Update transaction status in database
    // TODO: Implement transaction status update logic
    
    await auditLog({ uid: 'system' }, 'WEBHOOK_RECEIVED', {
      gateway: 'korean-bank',
      transactionId: transaction_id,
      status,
      amount,
      currency,
    });

    return { success: true, message: 'Webhook processed successfully' };
  } catch (error) {
    console.error('Korean bank webhook handler error:', error);
    throw new HttpsError('internal', 'Webhook processing failed.');
  }
} 