
import { z } from 'zod';
import * as adminHandlers from './admin/handlers';
import * as kycHandlers from './kyc/handlers';
import * as transactionHandlers from './transactions/handlers';
import * as walletQueryHandlers from './wallet/queries';
import * as transactionQueryHandlers from './transactions/queries';
import * as kaiHandlers from './kai/handlers';
import * as partnerHandlers from './partners/handlers';
import { onRequest } from 'firebase-functions/v2/https';

const dispatcherSchema = z.object({
  action: z.string(),
  payload: z.any(),
});

export const cpayDispatcher = onRequest({ region: 'asia-southeast1' }, async (req, res) => {
  const allowedOrigin = 'https://cpay5--applez-dch9v.asia-east1.hosted.app'; // CORS fix deployed
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Origin', allowedOrigin);
    res.set('Vary', 'Origin');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.set('Access-Control-Allow-Credentials', 'true'); // Remove if not using credentials
    res.set('Access-Control-Max-Age', '3600');
    res.status(204).send('');
    return;
  }

  // Set CORS headers for all other requests
  res.set('Access-Control-Allow-Origin', allowedOrigin);
  res.set('Vary', 'Origin');
  res.set('Access-Control-Allow-Credentials', 'true'); // Remove if not using credentials

  try {
    const { action, payload } = dispatcherSchema.parse(req.body);
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
      default:
        res.status(400).json({ error: 'Unknown action' });
        return;
    }
    res.json({ data: result });
  } catch (error: any) {
    console.error('cpayDispatcher error:', error);
    res.status(500).json({ error: error.message || 'Internal error' });
  }
});
