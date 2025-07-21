import { p2pTransferSchema } from '../schemas';

describe('p2pTransferSchema', () => {
  it('should validate a correct payload', () => {
    const valid = {
      recipientMobileNumber: '09171234567',
      amount: 1000,
      currency: 'PHP',
    };
    expect(() => p2pTransferSchema.parse(valid)).not.toThrow();
  });

  it('should fail for negative amount', () => {
    const invalid = {
      recipientMobileNumber: '09171234567',
      amount: -1000,
      currency: 'PHP',
    };
    expect(() => p2pTransferSchema.parse(invalid)).toThrow();
  });

  it('should fail for invalid mobile number', () => {
    const invalid = {
      recipientMobileNumber: '123',
      amount: 1000,
      currency: 'PHP',
    };
    expect(() => p2pTransferSchema.parse(invalid)).toThrow();
  });
}); 