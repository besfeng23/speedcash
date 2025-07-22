
import { z } from 'zod';
import * as adminHandlers from './admin/handlers';
import * as kycHandlers from './kyc/handlers';
import * as transactionHandlers from './transactions/handlers';
import * as walletQueryHandlers from './wallet/queries';
import * as transactionQueryHandlers from './transactions/queries';
import * as kaiHandlers from './kai/handlers';
import * as partnerHandlers from './partners/handlers';
import * as integrationHandlers from './integrations/handlers';
import { onRequest } from 'firebase-functions/v2/https';
import { monitoring } from './utils/monitoring';

const dispatcherSchema = z.object({
  action: z.string(),
  payload: z.any(),
});

// CORS configuration
const allowedOrigins = [
  'https://cpay5--applez-dch9v.asia-east1.hosted.app',
  'https://cpay-admin--applez-dch9v.asia-east1.hosted.app',
  'http://localhost:3000', // For local development
  'http://localhost:3001'  // For local development
];

const setCorsHeaders = (res: any, origin: string | undefined) => {
  const allowedOrigin = origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  
  res.set('Access-Control-Allow-Origin', allowedOrigin);
  res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.set('Access-Control-Allow-Credentials', 'true');
  res.set('Access-Control-Max-Age', '3600');
  res.set('Vary', 'Origin');
};

export const cpayDispatcher = onRequest({ region: 'asia-southeast1' }, async (req, res) => {
  const startTime = Date.now();
  const origin = req.headers.origin;
  
  // Log incoming request
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} from ${origin}`);
  
  // Set CORS headers for all requests
  setCorsHeaders(res, origin);
  
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    console.log(`[${new Date().toISOString()}] Handling OPTIONS preflight request`);
    await monitoring.logCorsRequest(req, res, true);
    res.status(204).send('');
    return;
  }

  try {
    // Validate request method
    if (req.method !== 'POST') {
      console.log(`[${new Date().toISOString()}] Method not allowed: ${req.method}`);
      await monitoring.logApiCall(req, 'INVALID_METHOD', false, `Method ${req.method} not allowed`);
      res.status(405).json({ error: 'Method not allowed. Only POST requests are accepted.' });
      return;
    }

    const { action, payload } = dispatcherSchema.parse(req.body);
    console.log(`[${new Date().toISOString()}] Processing action: ${action}`);
    
    let result;
    
    switch (action) {
      case 'adminApproveWithdrawal': result = await adminHandlers.adminApproveWithdrawalHandler(payload, req); break;
      case 'adminRejectWithdrawal': result = await adminHandlers.adminRejectWithdrawalHandler(payload, req); break;
      case 'adminSuspendUser': result = await adminHandlers.adminSuspendUserHandler(payload, req); break;
      case 'adminGetUsers': result = await adminHandlers.adminGetUsersHandler(payload, req); break;
      case 'adminGetUser': result = await adminHandlers.adminGetUserHandler(payload, req); break;
      case 'adminGetPartners': result = await adminHandlers.adminGetPartnersHandler(payload, req); break;
      case 'adminGetPartner': result = await adminHandlers.adminGetPartnerHandler(payload, req); break;
      case 'adminGetKycQueue': result = await adminHandlers.adminGetKycQueueHandler(payload, req); break;
      case 'adminGetWithdrawalQueue': result = await adminHandlers.adminGetWithdrawalQueueHandler(payload, req); break;
      case 'adminGetDashboardStats': result = await adminHandlers.adminGetDashboardStatsHandler(payload, req); break;
      case 'adminGetActivityLogs': result = await adminHandlers.adminGetActivityLogsHandler(payload, req); break;
      case 'adminUpdatePlatformSettings': result = await adminHandlers.adminUpdatePlatformSettingsHandler(payload, req); break;
      case 'adminUpdatePartnerStatus': result = await adminHandlers.adminUpdatePartnerStatusHandler(payload, req); break;
      case 'submitKyc': result = await kycHandlers.submitKycHandler(payload, req); break;
      case 'adminUpdateKycStatus': result = await kycHandlers.adminUpdateKycStatusHandler(payload, req); break;
      case 'addKycDocument': result = await kycHandlers.addKycDocumentHandler(payload, req); break;
      case 'adminDeleteKycDocument': result = await kycHandlers.adminDeleteKycDocumentHandler(payload, req); break;
      case 'initiateP2PTransfer': result = await transactionHandlers.initiateP2PTransferHandler(payload, req); break;
      case 'initiateCashIn': result = await transactionHandlers.initiateCashInHandler(payload, req); break;
      case 'initiateCashOut': result = await transactionHandlers.initiateCashOutHandler(payload, req); break;
      case 'initiateInstaPayTransfer': result = await transactionHandlers.initiateInstaPayTransferHandler(payload, req); break;
      case 'initiatePesoNetTransfer': result = await transactionHandlers.initiatePesoNetTransferHandler(payload, req); break;
      case 'initiateRemittance': result = await transactionHandlers.initiateRemittanceHandler(payload, req); break;
      case 'initiateBuyLoad': result = await transactionHandlers.initiateBuyLoadHandler(payload, req); break;
      case 'initiateBillPayment': result = await transactionHandlers.initiateBillPaymentHandler(payload, req); break;
      case 'getWalletBalance': result = await walletQueryHandlers.getWalletBalanceHandler(payload, req); break;
      case 'getUserProfile': result = await walletQueryHandlers.getUserProfileHandler(payload, req); break;
      case 'getTransactionHistory': result = await transactionQueryHandlers.getTransactionHistoryHandler(payload, req); break;
      case 'askAuthenticatedKai': result = await kaiHandlers.askAuthenticatedKaiHandler(payload, req); break;
      case 'createPartner': result = await partnerHandlers.createPartnerHandler(payload, req); break;
      case 'partnerGetDashboardStats': result = await partnerHandlers.partnerGetDashboardStatsHandler(payload, req); break;
      case 'partnerGetTeamMembers': result = await partnerHandlers.partnerGetTeamMembersHandler(payload, req); break;
      case 'partnerInviteMember': result = await partnerHandlers.partnerInviteMemberHandler(payload, req); break;
      case 'partnerInitiateTestPayout': result = await partnerHandlers.partnerInitiateTestPayoutHandler(payload, req); break;
      case 'partnerSubmitKybDocument': result = await partnerHandlers.partnerSubmitKybDocumentHandler(payload, req); break;
      case 'partnerRemoveMember': result = await partnerHandlers.partnerRemoveMemberHandler(payload, req); break;
      case 'adminGetTransactions': result = await adminHandlers.adminGetTransactionsHandler(payload, req); break;
      case 'adminGetTickets': result = await adminHandlers.adminGetTicketsHandler(payload, req); break;
      case 'adminUpdateSupportTicket': result = await adminHandlers.adminUpdateSupportTicketHandler(payload, req); break;
      case 'adminGetUserTransactions': result = await adminHandlers.adminGetUserTransactionsHandler(payload, req); break;
      case 'partnerGetProfile': result = await partnerHandlers.partnerGetProfileHandler(payload, req); break;
      case 'partnerUpdateProfile': result = await partnerHandlers.partnerUpdateProfileHandler(payload, req); break;
      case 'partnerGetTransactions': result = await partnerHandlers.partnerGetTransactionsHandler(payload, req); break;
      case 'partnerGetActivity': result = await partnerHandlers.partnerGetActivityHandler(payload, req); break;
      // Payment Gateway Integration Handlers
      case 'processInstaPayTransfer': result = await integrationHandlers.processInstaPayTransferHandler(payload, req); break;
      case 'processGCashTransfer': result = await integrationHandlers.processGCashTransferHandler(payload, req); break;
      case 'processMayaTransfer': result = await integrationHandlers.processMayaTransferHandler(payload, req); break;
      case 'processKoreanBankTransfer': result = await integrationHandlers.processKoreanBankTransferHandler(payload, req); break;
      case 'processNewPartnerTransfer': result = await integrationHandlers.processNewPartnerTransferHandler(payload, req); break;
      // Korean Mall Integration Handlers
      case 'createKoreanMallStore': result = await integrationHandlers.createKoreanMallStoreHandler(payload, req); break;
      case 'processKoreanMallPayment': result = await integrationHandlers.processKoreanMallPaymentHandler(payload, req); break;
      case 'getKoreanMallStats': result = await integrationHandlers.getKoreanMallStatsHandler(payload, req); break;
      // Webhook Handlers
      case 'handleInstaPayWebhook': result = await integrationHandlers.handleInstaPayWebhookHandler(payload, req); break;
      case 'handleGCashWebhook': result = await integrationHandlers.handleGCashWebhookHandler(payload, req); break;
      case 'handleMayaWebhook': result = await integrationHandlers.handleMayaWebhookHandler(payload, req); break;
      case 'handleKoreanBankWebhook': result = await integrationHandlers.handleKoreanBankWebhookHandler(payload, req); break;
      default:
        console.log(`[${new Date().toISOString()}] Unknown action: ${action}`);
        await monitoring.logApiCall(req, action, false, 'Unknown action');
        res.status(400).json({ error: 'Unknown action' });
        return;
    }
    
    const duration = Date.now() - startTime;
    console.log(`[${new Date().toISOString()}] Action ${action} completed successfully in ${duration}ms`);
    
    await monitoring.logApiCall(req, action, true);
    await monitoring.logPerformance(action, duration);
    
    res.json({ data: result });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`[${new Date().toISOString()}] cpayDispatcher error for action ${req.body?.action || 'unknown'}:`, error);
    
    // Ensure CORS headers are set even for errors
    setCorsHeaders(res, origin);
    
    // Log the error
    await monitoring.logError(error, {
      action: req.body?.action || 'unknown',
      method: req.method,
      origin,
      duration
    });
    
    if (error.name === 'ZodError') {
      console.log(`[${new Date().toISOString()}] Validation error:`, error.errors);
      await monitoring.logApiCall(req, req.body?.action || 'unknown', false, 'Validation error');
      res.status(400).json({ error: 'Invalid request format', details: error.errors });
    } else {
      await monitoring.logApiCall(req, req.body?.action || 'unknown', false, error.message);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }
});
