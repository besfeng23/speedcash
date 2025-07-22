import { getFirestore } from 'firebase-admin/firestore';

const db = getFirestore();

export type AuditEvent = 'USER_LOGIN' | 'P2P_TRANSFER_SUCCESS' | 'CASH_IN_SUCCESS' | 'CASHOUT_REQUEST' | 'KYC_APPROVED' | 'ADMIN_ACTION' | 'TRANSACTION_REQUEST' | 'PAYMENT_GATEWAY_SUCCESS' | 'PAYMENT_GATEWAY_STATUS_CHECK' | 'PAYMENT_GATEWAY_CHANNELS_REQUEST' | 'WEBHOOK_RECEIVED';

export async function auditLog(
  actor: { uid: string, ipAddress?: string },
  event: AuditEvent,
  details: Record<string, any>
) {
  try {
    await db.collection('logs').add({ actor, event, details, timestamp: new Date() });
  } catch (error) {
    console.error('CRITICAL AUDIT LOG FAILURE:', { error, event, actor });
  }
}
