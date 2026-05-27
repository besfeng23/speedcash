import { onRequest, Request } from 'firebase-functions/v2/https';
import { HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import * as adminHandlers from './admin/handlers';
import * as kycHandlers from './kyc/handlers';
import * as transactionHandlers from './transactions/handlers';
import * as transactionQueryHandlers from './transactions/queries';
import * as walletQueryHandlers from './wallet/queries';
import * as kaiHandlers from './kai/handlers';
import * as partnerHandlers from './partners/handlers';
import * as integrationHandlers from './integrations/handlers';

if (!admin.apps.length) {
  admin.initializeApp();
}

interface AuthenticatedRequest extends Request {
  auth?: admin.auth.DecodedIdToken;
}

type HeaderResponse = {
  set: (name: string, value: string) => void;
};

function getAllowedOrigins(): string[] {
  return (process.env.CORS_ALLOWED_ORIGINS || 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function getAllowedOrigin(origin?: string): string | null {
  if (!origin) return getAllowedOrigins()[0] || null;
  return getAllowedOrigins().includes(origin) ? origin : null;
}

function setCorsHeaders(res: HeaderResponse, origin?: string): boolean {
  const allowedOrigin = getAllowedOrigin(origin);
  if (!allowedOrigin) return false;

  res.set('Access-Control-Allow-Origin', allowedOrigin);
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.set('Access-Control-Allow-Credentials', 'true');
  res.set('Access-Control-Max-Age', '3600');
  res.set('Vary', 'Origin');
  return true;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error';
}

function isZodError(error: unknown): error is { name: string; errors: unknown } {
  return Boolean(error && typeof error === 'object' && 'name' in error && (error as { name?: string }).name === 'ZodError');
}

export const cpayDispatcher = onRequest({
  region: 'asia-southeast1',
  timeoutSeconds: 60,
  memory: '256MiB',
  minInstances: 0,
  maxInstances: 10,
}, async (req: AuthenticatedRequest, res) => {
  const startTime = Date.now();
  const origin = req.headers.origin;
  const corsAllowed = setCorsHeaders(res, origin);

  console.log(`[${new Date().toISOString()}] dispatcher request`, {
    method: req.method,
    origin: origin || 'no-origin',
    corsAllowed,
  });

  if (!corsAllowed && origin) {
    res.status(403).json({ error: 'Origin not allowed' });
    return;
  }

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log(`[${new Date().toISOString()}] dispatcher auth missing`);
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  try {
    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.auth = decodedToken;
  } catch (error: unknown) {
    console.log(`[${new Date().toISOString()}] dispatcher auth failed`, { message: getErrorMessage(error) });
    res.status(401).json({ error: 'Invalid authentication token' });
    return;
  }

  try {
    const { action, data: payload } = req.body;

    if (!action || typeof action !== 'string') {
      console.log(`[${new Date().toISOString()}] dispatcher missing action`);
      res.status(400).json({ error: 'Action is required' });
      return;
    }

    console.log(`[${new Date().toISOString()}] dispatcher action`, { action });

    let result: unknown;

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
      case 'processInstaPayTransfer': result = await integrationHandlers.processInstaPayTransferHandler(payload, req); break;
      case 'processGCashTransfer': result = await integrationHandlers.processGCashTransferHandler(payload, req); break;
      case 'processMayaTransfer': result = await integrationHandlers.processMayaTransferHandler(payload, req); break;
      case 'processKoreanBankTransfer': result = await integrationHandlers.processKoreanBankTransferHandler(payload, req); break;
      case 'processNewPartnerTransfer': result = await integrationHandlers.processNewPartnerTransferHandler(payload, req); break;
      case 'createKoreanMallStore': result = await integrationHandlers.createKoreanMallStoreHandler(payload, req); break;
      case 'processKoreanMallPayment': result = await integrationHandlers.processKoreanMallPaymentHandler(payload, req); break;
      case 'getKoreanMallStats': result = await integrationHandlers.getKoreanMallStatsHandler(payload, req); break;
      case 'handleInstaPayWebhook': result = await integrationHandlers.handleInstaPayWebhookHandler(payload, req); break;
      case 'handleGCashWebhook': result = await integrationHandlers.handleGCashWebhookHandler(payload, req); break;
      case 'handleMayaWebhook': result = await integrationHandlers.handleMayaWebhookHandler(payload, req); break;
      case 'handleKoreanBankWebhook': result = await integrationHandlers.handleKoreanBankWebhookHandler(payload, req); break;
      default:
        console.log(`[${new Date().toISOString()}] dispatcher unknown action`, { action });
        res.status(400).json({ error: 'Unknown action' });
        return;
    }

    const duration = Date.now() - startTime;
    console.log(`[${new Date().toISOString()}] dispatcher action complete`, { action, duration });
    res.json({ data: result });
  } catch (error: unknown) {
    const duration = Date.now() - startTime;
    const action = typeof req.body?.action === 'string' ? req.body.action : 'unknown';
    console.error(`[${new Date().toISOString()}] dispatcher action failed`, { action, duration, message: getErrorMessage(error) });
    setCorsHeaders(res, origin);

    if (error instanceof HttpsError) {
      const statusCode = getHttpStatusFromHttpsError(error);
      res.status(statusCode).json({ error: error.message });
    } else if (isZodError(error)) {
      res.status(400).json({ error: 'Invalid request format', details: error.errors });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

function getHttpStatusFromHttpsError(error: HttpsError): number {
  switch (error.code) {
    case 'ok': return 200;
    case 'cancelled': return 499;
    case 'unknown': return 500;
    case 'invalid-argument': return 400;
    case 'deadline-exceeded': return 504;
    case 'not-found': return 404;
    case 'already-exists': return 409;
    case 'permission-denied': return 403;
    case 'resource-exhausted': return 429;
    case 'failed-precondition': return 400;
    case 'aborted': return 409;
    case 'out-of-range': return 400;
    case 'unimplemented': return 501;
    case 'internal': return 500;
    case 'unavailable': return 503;
    case 'data-loss': return 500;
    case 'unauthenticated': return 401;
    default: return 500;
  }
}
