import { assertBalanced } from './entries';

describe('ledger entries', () => {
  it('accepts balanced entries by currency', () => {
    expect(() => assertBalanced([
      {
        transactionId: 'txn_1',
        accountId: 'wallet:a:PHP',
        walletOwnerUid: 'a',
        currency: 'PHP',
        debit: 100,
        credit: 0,
        createdBy: 'tester',
        type: 'P2P_DEBIT',
      },
      {
        transactionId: 'txn_1',
        accountId: 'wallet:b:PHP',
        walletOwnerUid: 'b',
        currency: 'PHP',
        debit: 0,
        credit: 100,
        createdBy: 'tester',
        type: 'P2P_CREDIT',
      },
    ])).not.toThrow();
  });

  it('rejects unbalanced entries', () => {
    expect(() => assertBalanced([
      {
        transactionId: 'txn_2',
        accountId: 'wallet:a:PHP',
        walletOwnerUid: 'a',
        currency: 'PHP',
        debit: 100,
        credit: 0,
        createdBy: 'tester',
        type: 'P2P_DEBIT',
      },
    ])).toThrow(/Ledger imbalance/);
  });
});
