
import * as admin from 'firebase-admin';
admin.initializeApp();

// --- AUTH TRIGGERS ---
// export { onUserCreate } from './auth/triggers'; // TODO: Fix auth triggers

// --- MAIN DISPATCHER ---
// All callable functions are routed through this single entry point.
export { cpayDispatcher } from './dispatcher';

// Export auth triggers
// export { onUserCreate } from './auth/triggers'; // TODO: Fix auth triggers

// Export individual functions for direct access
export { 
  submitKycHandler, 
  adminUpdateKycStatusHandler, 
  addKycDocumentHandler, 
  adminDeleteKycDocumentHandler 
} from './kyc/handlers';

// --- SPEEDYPAY WEBHOOK HANDLERS ---
export { 
  speedypayWebhook,
  speedypayWebhookHealth,
  speedypayWebhookStats,
  speedypayWebhookTest
} from './partners/speedypay-webhook';
