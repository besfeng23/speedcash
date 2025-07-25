
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

// --- TEST FUNCTION ---
// Temporarily commented out due to build service account issues
// export { function3 } from './test-function';
export { simpleTest } from './simple-test';
export { basicTest } from './basic-test';
export { standaloneTest } from './standalone-test';
export { expressTest } from './express-test';
// export { v1Test } from './v1-test';

// --- SPEEDYPAY WEBHOOK HANDLERS ---
// Temporarily commented out due to build service account issues
// export { 
//   speedypayWebhook,
//   speedypayWebhookHealth,
//   speedypayWebhookStats,
//   speedypayWebhookTest
// } from './partners/speedypay-webhook';
