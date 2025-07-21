
'use server';

import { onCall, CallableRequest, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { z } from 'zod';

// Import handlers from other files
import * as adminHandlers from './admin/handlers';
import * as kycHandlers from './kyc/handlers';
import * as transactionHandlers from './transactions/handlers';
import * as walletQueryHandlers from './wallet/queries';
import * as transactionQueryHandlers from './transactions/queries';
// import * as ticketHandlers from './tickets/handlers'; // TODO: Create tickets handlers
import * as kaiHandlers from './kai/handlers';
import * as partnerHandlers from './partners/handlers';

const region = 'asia-southeast1';

const dispatcherOptions = {
    region,
    enforceAppCheck: process.env.NODE_ENV === 'production',
    concurrency: 80,
};

// Define a schema for the dispatcher input
const dispatcherSchema = z.object({
  action: z.string(),
  payload: z.any(),
});

/**
 * A single entry point for all callable functions.
 * This dispatcher routes requests to the appropriate handler based on the 'action' property.
 */
export const cpayDispatcher = onCall(dispatcherOptions, async (request) => {
    const { action, payload } = dispatcherSchema.parse(request.data);
    const context = request; // Pass the whole request as context

    console.log(`[Dispatcher] Received action: ${action}`);

    try {
        switch (action) {
            // Admin actions
            case 'adminApproveWithdrawal': return await adminHandlers.adminApproveWithdrawalHandler(payload, context);
            case 'adminRejectWithdrawal': return await adminHandlers.adminRejectWithdrawalHandler(payload, context);
            case 'adminSuspendUser': return await adminHandlers.adminSuspendUserHandler(payload, context);
            case 'adminGetUsers': return await adminHandlers.adminGetUsersHandler(payload, context);
            case 'adminGetUser': return await adminHandlers.adminGetUserHandler(payload, context);
            case 'adminGetPartners': return await adminHandlers.adminGetPartnersHandler(payload, context);
            case 'adminGetPartner': return await adminHandlers.adminGetPartnerHandler(payload, context);
            case 'adminGetKycQueue': return await adminHandlers.adminGetKycQueueHandler(payload, context);
            case 'adminGetWithdrawalQueue': return await adminHandlers.adminGetWithdrawalQueueHandler(payload, context);
            case 'adminGetDashboardStats': return await adminHandlers.adminGetDashboardStatsHandler(payload, context);
            case 'adminGetActivityLogs': return await adminHandlers.adminGetActivityLogsHandler(payload, context);
            case 'adminUpdatePlatformSettings': return await adminHandlers.adminUpdatePlatformSettingsHandler(payload, context);
            case 'adminUpdatePartnerStatus': return await adminHandlers.adminUpdatePartnerStatusHandler(payload, context);

            // KYC actions
            case 'submitKyc': return await kycHandlers.submitKycHandler(payload, context);
            case 'adminUpdateKycStatus': return await kycHandlers.adminUpdateKycStatusHandler(payload, context);
            case 'addKycDocument': return await kycHandlers.addKycDocumentHandler(payload, context);
            case 'adminDeleteKycDocument': return await kycHandlers.adminDeleteKycDocumentHandler(payload, context);

            // Transaction actions
            case 'initiateP2PTransfer': return await transactionHandlers.initiateP2PTransferHandler(payload, context);
            case 'initiateCashIn': return await transactionHandlers.initiateCashInHandler(payload, context);
            case 'initiateCashOut': return await transactionHandlers.initiateCashOutHandler(payload, context);
            case 'initiateInstaPayTransfer': return await transactionHandlers.initiateInstaPayTransferHandler(payload, context);
            case 'initiatePesoNetTransfer': return await transactionHandlers.initiatePesoNetTransferHandler(payload, context);
            case 'initiateRemittance': return await transactionHandlers.initiateRemittanceHandler(payload, context);
            case 'initiateBuyLoad': return await transactionHandlers.initiateBuyLoadHandler(payload, context);
            case 'initiateBillPayment': return await transactionHandlers.initiateBillPaymentHandler(payload, context);

            // Query actions
            case 'getWalletBalance': return await walletQueryHandlers.getWalletBalanceHandler(payload, context);
            case 'getUserProfile': return await walletQueryHandlers.getUserProfileHandler(payload, context);
            case 'getTransactionHistory': return await transactionQueryHandlers.getTransactionHistoryHandler(payload, context);
            
            // Ticket actions
            // case 'createSupportTicket': return await ticketHandlers.createSupportTicketHandler(payload, context);
            // case 'adminGetTickets': return await ticketHandlers.adminGetTicketsHandler(payload, context);
            // case 'adminUpdateSupportTicket': return await ticketHandlers.adminUpdateSupportTicketHandler(payload, context);
                
            // AI actions
            case 'askAuthenticatedKai': return await kaiHandlers.askAuthenticatedKaiHandler(payload, context);

            // Partner actions
            case 'createPartner': return await partnerHandlers.createPartnerHandler(payload, context);
            case 'partnerGetDashboardStats': return await partnerHandlers.partnerGetDashboardStatsHandler(payload, context);
            case 'partnerGetTeamMembers': return await partnerHandlers.partnerGetTeamMembersHandler(payload, context);
            case 'partnerInviteMember': return await partnerHandlers.partnerInviteMemberHandler(payload, context);
            case 'partnerInitiateTestPayout': return await partnerHandlers.partnerInitiateTestPayoutHandler(payload, context);
            case 'partnerSubmitKybDocument': return await partnerHandlers.partnerSubmitKybDocumentHandler(payload, context);
            case 'partnerRemoveMember': return await partnerHandlers.partnerRemoveMemberHandler(payload, context);

            // TODO: Implement ticket handlers
            // case 'adminGetTickets': return await ticketHandlers.adminGetTicketsHandler(payload, context);
            // case 'adminUpdateSupportTicket': return await ticketHandlers.adminUpdateSupportTicketHandler(payload, context);

            default:
                console.error(`[Dispatcher] Unknown action: ${action}`);
                throw new HttpsError("invalid-argument", "The function action is unknown.");
        }
    } catch (error) {
        if (error instanceof HttpsError) {
            console.error(`[Dispatcher] HttpsError for action '${action}':`, error.message);
            throw error;
        }
        console.error(`[Dispatcher] Internal error for action '${action}':`, error);
        throw new HttpsError('internal', `An internal error occurred while processing action: ${action}`);
    }
});
