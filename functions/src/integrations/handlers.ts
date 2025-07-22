import { HttpsError } from 'firebase-functions/v2/https';
import { PaymentGatewayFactory, getPaymentGatewayConfig } from './payment-gateways';
import { KoreanMallIntegration } from './korean-mall-integration';
import { auditLog } from '../utils/audit';
import { verifyWebhook, WebhookPayload } from '../utils/webhook-verification';
import { checkRateLimit, recordRequest } from '../utils/rate-limiter';
import { sendTransactionNotification } from '../utils/email';
import { 
  ChannelAggregatorFactory, 
  getChannelAggregatorConfig,
  CHANNEL_TYPES 
} from './channel-aggregator';

// --- Integration Handlers ---

// Channel Aggregator Handlers
export async function processChannelAggregatorTransferHandler(data: any, context: any) {
  if (!context.auth) throw new HttpsError('unauthenticated', 'Authentication required.');
  
  try {
    // Rate limiting
    await checkRateLimit('transactions', context);
    
    const { amount, currency, referenceId, description, channel, recipientInfo } = data;
    
    // Validate channel
    if (!Object.values(CHANNEL_TYPES).includes(channel)) {
      throw new HttpsError('invalid-argument', 'Invalid channel specified');
    }
    
    const config = getChannelAggregatorConfig();
    const gateway = ChannelAggregatorFactory.createGateway(config);
    
    const result = await gateway.initiateTransfer({
      amount,
      currency,
      referenceId,
      description,
      channel,
      recipientInfo,
      metadata: {
        userId: context.auth.uid,
        userRole: context.auth.token.role,
        timestamp: new Date().toISOString()
      }
    });

    if (result.success) {
      // Record successful request
      await recordRequest('transactions', context, true);
      
      // Send email notification
      try {
        await sendTransactionNotification(
          context.auth.token.email || '',
          context.auth.token.name || 'User',
          `Channel Aggregator Transfer (${channel})`,
          amount.toString(),
          currency || 'PHP'
        );
      } catch (emailError) {
        console.warn('Failed to send transaction notification:', emailError);
      }
      
      await auditLog({ uid: context.auth.uid }, 'PAYMENT_GATEWAY_SUCCESS', {
        gateway: 'channel-aggregator',
        channel,
        amount,
        currency,
        transactionId: result.transactionId,
      });
    }

    return result;
  } catch (error) {
    // Record failed request
    await recordRequest('transactions', context, false);
    
    console.error('Channel aggregator transfer handler error:', error);
    throw new HttpsError('internal', 'Channel aggregator transfer failed.');
  }
}

export async function checkChannelAggregatorStatusHandler(data: any, context: any) {
  if (!context.auth) throw new HttpsError('unauthenticated', 'Authentication required.');
  
  try {
    const { transactionId } = data;
    
    if (!transactionId) {
      throw new HttpsError('invalid-argument', 'Transaction ID is required');
    }
    
    const config = getChannelAggregatorConfig();
    const gateway = ChannelAggregatorFactory.createGateway(config);
    
    const result = await gateway.checkTransactionStatus(transactionId);
    
    await auditLog({ uid: context.auth.uid }, 'PAYMENT_GATEWAY_STATUS_CHECK', {
      gateway: 'channel-aggregator',
      transactionId,
      status: result.status
    });
    
    return result;
  } catch (error) {
    console.error('Channel aggregator status check error:', error);
    throw new HttpsError('internal', 'Channel aggregator status check failed.');
  }
}

export async function getChannelAggregatorChannelsHandler(data: any, context: any) {
  if (!context.auth) throw new HttpsError('unauthenticated', 'Authentication required.');
  
  try {
    const config = getChannelAggregatorConfig();
    const gateway = ChannelAggregatorFactory.createGateway(config);
    
    const result = await gateway.getAvailableChannels();
    
    await auditLog({ uid: context.auth.uid }, 'PAYMENT_GATEWAY_CHANNELS_REQUEST', {
      gateway: 'channel-aggregator',
      channelsCount: result.channels?.length || 0
    });
    
    return result;
  } catch (error) {
    console.error('Channel aggregator get channels error:', error);
    throw new HttpsError('internal', 'Failed to get available channels.');
  }
}

// Payment Gateway Handlers (Now using Channel Aggregator)
export async function processInstaPayTransferHandler(data: any, context: any) {
  if (!context.auth) throw new HttpsError('unauthenticated', 'Authentication required.');
  
  try {
    // Rate limiting
    await checkRateLimit('transactions', context);
    
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
      // Record successful request
      await recordRequest('transactions', context, true);
      
      // Send email notification
      try {
        await sendTransactionNotification(
          context.auth.token.email || '',
          context.auth.token.name || 'User',
          'InstaPay Transfer',
          data.amount.toString(),
          data.currency || 'PHP'
        );
      } catch (emailError) {
        console.warn('Failed to send transaction notification:', emailError);
      }
      
      await auditLog({ uid: context.auth.uid }, 'PAYMENT_GATEWAY_SUCCESS', {
        gateway: 'instapay',
        amount: data.amount,
        currency: data.currency,
        transactionId: result.transactionId,
      });
    }

    return result;
  } catch (error) {
    // Record failed request
    await recordRequest('transactions', context, false);
    
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
    console.error('Korean Bank transfer handler error:', error);
    throw new HttpsError('internal', 'Korean Bank transfer failed.');
  }
}

export async function processPesoNetTransferHandler(data: any, context: any) {
  if (!context.auth) throw new HttpsError('unauthenticated', 'Authentication required.');
  
  try {
    const config = getPaymentGatewayConfig('pesonet');
    const gateway = PaymentGatewayFactory.createGateway('pesonet', config);
    
    const result = await gateway.initiateTransfer({
      amount: data.amount,
      currency: data.currency,
      referenceId: data.referenceId,
      description: data.description,
      recipientInfo: data.recipientInfo,
    });

    if (result.success) {
      await auditLog({ uid: context.auth.uid }, 'PAYMENT_GATEWAY_SUCCESS', {
        gateway: 'pesonet',
        amount: data.amount,
        currency: data.currency,
        transactionId: result.transactionId,
      });
    }

    return result;
  } catch (error) {
    console.error('PesoNet transfer handler error:', error);
    throw new HttpsError('internal', 'PesoNet transfer failed.');
  }
}

export async function processNewPartnerTransferHandler(data: any, context: any) {
  if (!context.auth) throw new HttpsError('unauthenticated', 'Authentication required.');
  
  try {
    const gateway = PaymentGatewayFactory.createUnifiedGateway();
    
    const result = await gateway.initiateTransfer({
      amount: data.amount,
      currency: data.currency,
      referenceId: data.referenceId,
      description: data.description,
      recipientInfo: data.recipientInfo,
    }, data.channel || 'other');

    if (result.success) {
      await auditLog({ uid: context.auth.uid }, 'PAYMENT_GATEWAY_SUCCESS', {
        gateway: 'new-partner',
        channel: data.channel,
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
  const koreanMall = new KoreanMallIntegration();
  return koreanMall.createKoreanMallStore(data, context);
}

export async function processKoreanMallPaymentHandler(data: any, context: any) {
  const koreanMall = new KoreanMallIntegration();
  return koreanMall.processKoreanMallPayment(data, context);
}

export async function getKoreanMallStatsHandler(data: any, context: any) {
  const koreanMall = new KoreanMallIntegration();
  return koreanMall.getKoreanMallStats(data.storeId, context);
}

// Webhook Handlers
export async function handleInstaPayWebhookHandler(data: any, context: any) {
  try {
    // Verify webhook signature
    const payload: WebhookPayload = {
      body: JSON.stringify(data),
      headers: context.headers || {},
      timestamp: Date.now(),
      signature: context.headers?.['x-signature'] || context.headers?.['x-instapay-signature']
    };

    if (!verifyWebhook('instapay', payload)) {
      throw new HttpsError('unauthenticated', 'Invalid webhook signature');
    }

    console.log('[Webhook] InstaPay webhook received:', data);
    
    // Process the webhook data
    await auditLog({ uid: 'system' }, 'WEBHOOK_RECEIVED', {
      gateway: 'instapay',
      transactionId: data.transaction_id,
      status: data.status,
      data
    });

    return { success: true, message: 'Webhook processed successfully' };
  } catch (error) {
    console.error('[Webhook] InstaPay webhook error:', error);
    throw new HttpsError('internal', 'Webhook processing failed');
  }
}

export async function handleGCashWebhookHandler(data: any, _context: any) {
  try {
    // Verify webhook signature
    const payload: WebhookPayload = {
      body: JSON.stringify(data),
      headers: _context.headers || {},
      timestamp: Date.now(),
      signature: _context.headers?.['x-signature'] || _context.headers?.['x-gcash-signature']
    };

    if (!verifyWebhook('gcash', payload)) {
      throw new HttpsError('unauthenticated', 'Invalid webhook signature');
    }

    console.log('[Webhook] GCash webhook received:', data);
    
    await auditLog({ uid: 'system' }, 'WEBHOOK_RECEIVED', {
      gateway: 'gcash',
      transactionId: data.transaction_id,
      status: data.status,
      data
    });

    return { success: true, message: 'Webhook processed successfully' };
  } catch (error) {
    console.error('[Webhook] GCash webhook error:', error);
    throw new HttpsError('internal', 'Webhook processing failed');
  }
}

export async function handleMayaWebhookHandler(data: any, _context: any) {
  try {
    // Verify webhook signature
    const payload: WebhookPayload = {
      body: JSON.stringify(data),
      headers: _context.headers || {},
      timestamp: Date.now(),
      signature: _context.headers?.['x-signature'] || _context.headers?.['x-maya-signature']
    };

    if (!verifyWebhook('maya', payload)) {
      throw new HttpsError('unauthenticated', 'Invalid webhook signature');
    }

    console.log('[Webhook] Maya webhook received:', data);
    
    await auditLog({ uid: 'system' }, 'WEBHOOK_RECEIVED', {
      gateway: 'maya',
      transactionId: data.transaction_id,
      status: data.status,
      data
    });

    return { success: true, message: 'Webhook processed successfully' };
  } catch (error) {
    console.error('[Webhook] Maya webhook error:', error);
    throw new HttpsError('internal', 'Webhook processing failed');
  }
}

export async function handleKoreanBankWebhookHandler(data: any, _context: any) {
  try {
    // Verify webhook signature
    const payload: WebhookPayload = {
      body: JSON.stringify(data),
      headers: _context.headers || {},
      timestamp: Date.now(),
      signature: _context.headers?.['x-signature'] || _context.headers?.['x-korean-bank-signature']
    };

    if (!verifyWebhook('koreanBank', payload)) {
      throw new HttpsError('unauthenticated', 'Invalid webhook signature');
    }

    console.log('[Webhook] Korean Bank webhook received:', data);
    
    await auditLog({ uid: 'system' }, 'WEBHOOK_RECEIVED', {
      gateway: 'korean-bank',
      transactionId: data.transaction_id,
      status: data.status,
      data
    });

    return { success: true, message: 'Webhook processed successfully' };
  } catch (error) {
    console.error('[Webhook] Korean Bank webhook error:', error);
    throw new HttpsError('internal', 'Webhook processing failed');
  }
} 