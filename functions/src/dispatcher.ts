
import { onRequest } from 'firebase-functions/v2/https';
import { HttpsError } from 'firebase-functions/v2/https';
import { authenticateRequest } from './utils/auth-middleware';
import { checkRateLimit, recordRequest } from './utils/rate-limiter';
// import { auditLog } from './utils/audit';
import { monitoring } from './utils/monitoring';

// Import all handlers
import * as adminHandlers from './admin/handlers';
import * as partnerHandlers from './partners/handlers';
import * as kycHandlers from './kyc/handlers';
import * as transactionHandlers from './transactions/handlers';
import * as walletQueryHandlers from './wallet/queries';
import * as kaiHandlers from './kai/handlers';
import * as integrationHandlers from './integrations/handlers';
import * as twoFactorHandlers from './auth/two-factor-handlers';

// CORS headers - Updated for better compatibility
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept, Origin, X-API-Key',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age': '86400',
};

// Action handlers mapping
const actionHandlers: Record<string, Function> = {
  // Admin Handlers
  'adminGetPartners': adminHandlers.adminGetPartnersHandler,
  'adminGetDashboardStats': adminHandlers.adminGetDashboardStatsHandler,
  'adminUpdateKycStatus': kycHandlers.adminUpdateKycStatusHandler,
  'adminDeleteKycDocument': kycHandlers.adminDeleteKycDocumentHandler,

  // Partner Handlers
  'createPartner': partnerHandlers.createPartnerHandler,
  'partnerGetDashboardStats': partnerHandlers.partnerGetDashboardStatsHandler,
  'partnerGetTeamMembers': partnerHandlers.partnerGetTeamMembersHandler,
  'partnerGetProfile': partnerHandlers.partnerGetProfileHandler,

  // KYC Handlers
  'submitKyc': kycHandlers.submitKycHandler,
  'addKycDocument': kycHandlers.addKycDocumentHandler,

  // Transaction Handlers
  'initiateCashIn': transactionHandlers.initiateCashInHandler,
  'initiateCashOut': transactionHandlers.initiateCashOutHandler,
  'initiateP2PTransfer': transactionHandlers.initiateP2PTransferHandler,
  'getTransactionHistory': walletQueryHandlers.getWalletBalanceHandler,

  // Wallet Query Handlers
  'getWalletBalance': walletQueryHandlers.getWalletBalanceHandler,
  'getUserProfile': walletQueryHandlers.getUserProfileHandler,

  // KAI Handlers
  'askAuthenticatedKai': kaiHandlers.askAuthenticatedKaiHandler,

  // Payment Gateway Integration Handlers
  'processInstaPayTransfer': integrationHandlers.processInstaPayTransferHandler,
  'processGCashTransfer': integrationHandlers.processGCashTransferHandler,
  'processMayaTransfer': integrationHandlers.processMayaTransferHandler,
  'processKoreanBankTransfer': integrationHandlers.processKoreanBankTransferHandler,
  'processPesoNetTransfer': integrationHandlers.processPesoNetTransferHandler,
  'processNewPartnerTransfer': integrationHandlers.processNewPartnerTransferHandler,

  // Channel Aggregator Handlers
  'processChannelAggregatorTransfer': integrationHandlers.processChannelAggregatorTransferHandler,
  'checkChannelAggregatorStatus': integrationHandlers.checkChannelAggregatorStatusHandler,
  'getChannelAggregatorChannels': integrationHandlers.getChannelAggregatorChannelsHandler,

  // Korean Mall Integration Handlers
  'createKoreanMallStore': integrationHandlers.createKoreanMallStoreHandler,
  'processKoreanMallPayment': integrationHandlers.processKoreanMallPaymentHandler,
  'getKoreanMallStats': integrationHandlers.getKoreanMallStatsHandler,

  // Webhook Handlers
  'handleInstaPayWebhook': integrationHandlers.handleInstaPayWebhookHandler,
  'handleGCashWebhook': integrationHandlers.handleGCashWebhookHandler,
  'handleMayaWebhook': integrationHandlers.handleMayaWebhookHandler,
  'handleKoreanBankWebhook': integrationHandlers.handleKoreanBankWebhookHandler,

  // 2FA Handlers
  'setup2FA': twoFactorHandlers.setup2FAHandler,
  'verify2FA': twoFactorHandlers.verify2FAHandler,
  'disable2FA': twoFactorHandlers.disable2FAHandler,
  'regenerateBackupCodes': twoFactorHandlers.regenerateBackupCodesHandler,
};

// Main dispatcher function - Updated region to match deployment
export const cpayDispatcher = onRequest({ 
  region: 'us-central1',
  cors: true // Enable CORS at the function level
}, async (req, res) => {
  // Set CORS headers for all responses
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.set(key, value);
  });

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  // Validate request method
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // Validate request body
  if (!req.body) {
    res.status(400).json({ error: 'Request body is required' });
    return;
  }

  const { action, data } = req.body;

  if (!action) {
    res.status(400).json({ error: 'Action is required' });
    return;
  }

  try {
    // Log the incoming request
    console.log(`[Dispatcher] Received action: ${action}`, { 
      hasData: !!data, 
      method: req.method,
      userAgent: req.headers['user-agent'],
      origin: req.headers.origin
    });

    // Monitor the request
    monitoring.logApiCall(req, action, true);

    // Get the handler for this action
    const handler = actionHandlers[action];
    if (!handler) {
      console.error(`[Dispatcher] Unknown action: ${action}`);
      res.status(400).json({ error: 'Unknown action' });
      return;
    }

    // Authenticate the request
    const context = await authenticateRequest(req);
    if (!context.auth) {
      console.error(`[Dispatcher] Authentication failed for action: ${action}`);
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // Check rate limiting
    await checkRateLimit('api', context);

    // Execute the handler
    console.log(`[Dispatcher] Executing handler for action: ${action}`);
    const result = await handler(data || {}, context);

    // Record successful request
    await recordRequest('api', context, true);

    // Log success
    console.log(`[Dispatcher] Action ${action} completed successfully`);

    // Return the result
    res.status(200).json({ 
      success: true, 
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`[Dispatcher] Error in action ${action}:`, error);

    // Record failed request
    try {
      const context = await authenticateRequest(req);
      await recordRequest('api', context, false);
    } catch (authError) {
      console.warn('[Dispatcher] Could not record failed request due to auth error:', authError);
    }

    // Handle different types of errors
    if (error instanceof HttpsError) {
      res.status(error.httpErrorCode.status).json({ 
        error: error.message,
        code: error.code 
      });
    } else {
      res.status(500).json({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
});
