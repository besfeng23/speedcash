import { 
  p2pTransferSchema, 
  cashInSchema, 
  cashOutSchema, 
  remittanceSchema, 
  buyLoadSchema, 
  billPaymentSchema,
  bankDetailsSchema 
} from '../schemas';

describe('Transaction Schemas', () => {
  describe('p2pTransferSchema', () => {
    it('should validate correct P2P transfer data', () => {
      const valid = {
        recipientMobileNumber: '09171234567',
        amount: 1000,
        currency: 'PHP',
      };
      expect(() => p2pTransferSchema.parse(valid)).not.toThrow();
    });

    it('should fail for invalid mobile number', () => {
      const invalid = {
        recipientMobileNumber: '123',
        amount: 1000,
        currency: 'PHP',
      };
      expect(() => p2pTransferSchema.parse(invalid)).toThrow();
    });

    it('should fail for negative amount', () => {
      const invalid = {
        recipientMobileNumber: '09171234567',
        amount: -1000,
        currency: 'PHP',
      };
      expect(() => p2pTransferSchema.parse(invalid)).toThrow();
    });

    it('should fail for invalid currency format', () => {
      const invalid = {
        recipientMobileNumber: '09171234567',
        amount: 1000,
        currency: 'PH',
      };
      expect(() => p2pTransferSchema.parse(invalid)).toThrow();
    });
  });

  describe('cashInSchema', () => {
    it('should validate correct cash-in data', () => {
      const valid = {
        amount: 5000,
        currency: 'PHP',
        method: 'bank_transfer',
        referenceId: 'REF123456',
      };
      expect(() => cashInSchema.parse(valid)).not.toThrow();
    });

    it('should fail for missing method', () => {
      const invalid = {
        amount: 5000,
        currency: 'PHP',
        referenceId: 'REF123456',
      };
      expect(() => cashInSchema.parse(invalid)).toThrow();
    });

    it('should fail for missing reference ID', () => {
      const invalid = {
        amount: 5000,
        currency: 'PHP',
        method: 'bank_transfer',
      };
      expect(() => cashInSchema.parse(invalid)).toThrow();
    });
  });

  describe('bankDetailsSchema', () => {
    it('should validate correct bank details', () => {
      const valid = {
        bankCode: 'BDO',
        accountNumber: '1234567890',
        accountName: 'John Doe',
      };
      expect(() => bankDetailsSchema.parse(valid)).not.toThrow();
    });

    it('should fail for missing bank code', () => {
      const invalid = {
        accountNumber: '1234567890',
        accountName: 'John Doe',
      };
      expect(() => bankDetailsSchema.parse(invalid)).toThrow();
    });
  });

  describe('cashOutSchema', () => {
    it('should validate correct cash-out data', () => {
      const valid = {
        amount: 3000,
        currency: 'PHP',
        bankDetails: {
          bankCode: 'BDO',
          accountNumber: '1234567890',
          accountName: 'John Doe',
        },
      };
      expect(() => cashOutSchema.parse(valid)).not.toThrow();
    });

    it('should fail for invalid bank details', () => {
      const invalid = {
        amount: 3000,
        currency: 'PHP',
        bankDetails: {
          bankCode: 'BDO',
          // Missing accountNumber and accountName
        },
      };
      expect(() => cashOutSchema.parse(invalid)).toThrow();
    });
  });

  describe('remittanceSchema', () => {
    it('should validate correct remittance data', () => {
      const valid = {
        amount: 10000,
        recipientDetails: {
          name: 'Jane Doe',
          mobileNumber: '09187654321',
          country: 'Korea',
        },
      };
      expect(() => remittanceSchema.parse(valid)).not.toThrow();
    });

    it('should fail for zero amount', () => {
      const invalid = {
        amount: 0,
        recipientDetails: {
          name: 'Jane Doe',
          mobileNumber: '09187654321',
        },
      };
      expect(() => remittanceSchema.parse(invalid)).toThrow();
    });
  });

  describe('buyLoadSchema', () => {
    it('should validate correct buy load data', () => {
      const valid = {
        mobileNumber: '09171234567',
        amount: 100,
      };
      expect(() => buyLoadSchema.parse(valid)).not.toThrow();
    });

    it('should fail for invalid mobile number', () => {
      const invalid = {
        mobileNumber: '123',
        amount: 100,
      };
      expect(() => buyLoadSchema.parse(invalid)).toThrow();
    });
  });

  describe('billPaymentSchema', () => {
    it('should validate correct bill payment data', () => {
      const valid = {
        billerName: 'Meralco',
        accountNumber: '123456789',
        amount: 2500,
      };
      expect(() => billPaymentSchema.parse(valid)).not.toThrow();
    });

    it('should fail for missing biller name', () => {
      const invalid = {
        accountNumber: '123456789',
        amount: 2500,
      };
      expect(() => billPaymentSchema.parse(invalid)).toThrow();
    });
  });
}); 