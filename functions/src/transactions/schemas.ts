import { z } from 'zod';

export const p2pTransferSchema = z.object({
  recipientMobileNumber: z.string().min(10, "Recipient mobile number is invalid."),
  amount: z.number().positive("Amount must be positive."),
  currency: z.string().length(3, "Currency must be a 3-letter code."),
});

export const cashInSchema = z.object({
  amount: z.number().positive("Amount must be positive."),
  currency: z.string().length(3, "Currency must be a 3-letter code."),
  method: z.string().min(1, "Cash-in method is required."),
  referenceId: z.string().min(1, "Reference ID is required."),
});

export const bankDetailsSchema = z.object({
  bankCode: z.string().min(1, "Bank code is required."),
  accountNumber: z.string().min(1, "Account number is required."),
  accountName: z.string().min(1, "Account name is required."),
});

export const cashOutSchema = z.object({
  amount: z.number().positive("Amount must be positive."),
  currency: z.string().length(3, "Currency must be a 3-letter code."),
  bankDetails: bankDetailsSchema,
});

export const remittanceSchema = z.object({
  amount: z.number().positive("Amount must be positive."),
  recipientDetails: z.any(),
});

export const buyLoadSchema = z.object({
  mobileNumber: z.string().min(11, "A valid 11-digit mobile number is required."),
  amount: z.number().positive("Amount must be positive."),
});

export const billPaymentSchema = z.object({
  billerName: z.string().min(1, "Biller name is required."),
  accountNumber: z.string().min(1, "Account number is required."),
  amount: z.number().positive("Amount must be positive."),
}); 