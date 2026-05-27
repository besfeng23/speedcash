import * as admin from 'firebase-admin';

export type LedgerEntryType =
  | 'P2P_DEBIT'
  | 'P2P_CREDIT'
  | 'CASH_IN_PENDING'
  | 'CASH_OUT_HOLD'
  | 'CASH_OUT_RELEASE'
  | 'FEE'
  | 'REVERSAL';

export interface LedgerEntryInput {
  transactionId: string;
  accountId: string;
  walletOwnerUid?: string;
  currency: string;
  debit: number;
  credit: number;
  createdBy: string;
  type: LedgerEntryType;
  metadata?: Record<string, unknown>;
}

export function writeLedgerEntry(
  tx: FirebaseFirestore.Transaction,
  db: FirebaseFirestore.Firestore,
  entry: LedgerEntryInput
) {
  const entryRef = db.collection('ledger_entries').doc();
  tx.set(entryRef, {
    ...entry,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

export function assertBalanced(entries: LedgerEntryInput[]) {
  const totalsByCurrency = entries.reduce((acc, entry) => {
    const current = acc.get(entry.currency) || { debit: 0, credit: 0 };
    current.debit += entry.debit;
    current.credit += entry.credit;
    acc.set(entry.currency, current);
    return acc;
  }, new Map<string, { debit: number; credit: number }>());

  for (const [currency, totals] of totalsByCurrency.entries()) {
    if (totals.debit !== totals.credit) {
      throw new Error(`Ledger imbalance for ${currency}: debit ${totals.debit}, credit ${totals.credit}`);
    }
  }
}
