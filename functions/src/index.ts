import * as admin from 'firebase-admin';

admin.initializeApp();

// --- AUTH TRIGGERS ---
export { onUserCreate } from './auth/triggers';

// --- MAIN DISPATCHER ---
// All callable functions are routed through this single entry point.
export { cpayDispatcher } from './dispatcher';

// Export individual functions for direct access
export {
  submitKycHandler,
  adminUpdateKycStatusHandler,
  addKycDocumentHandler,
  adminDeleteKycDocumentHandler,
} from './kyc/handlers';

// --- TEST FUNCTION ---
// Temporarily commented out due to build service account issues
// export { function3 } from './test-function';
export { simpleTest } from './simple-test';
export { basicTest } from './basic-test';
export { standaloneTest } from './standalone-test';
export { expressTest } from './express-test';
// export { v1Test } from './v1-test';

// --- SPEEDYPAY WEBHOOK HANDLERS ---
// SpeedyPay webhook functionality integrated into simpleTest function
// Original standalone webhooks temporarily commented out due to org policy build service account issues
// export {
//   speedypayWebhook
// } from './partners/speedypay-webhook';
// export {
//   speedypayWebhookHealth,
//   speedypayWebhookStats,
//   speedypayWebhookTest
// } from './partners/speedypay-webhook';
