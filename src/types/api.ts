// API Response Types
export interface ApiResponse<T = unknown> {
  data: T;
  success: boolean;
  message?: string;
}

// User Types
export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  phoneNumber?: string;
  role: 'user' | 'admin' | 'superadmin' | 'partner';
  kycStatus: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

// Transaction Types
export interface Transaction {
  id: string;
  type: 'p2p_transfer' | 'remittance' | 'cash_in' | 'cash_out' | 'bill_payment';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  amount: number;
  currency: string;
  senderInfo?: { uid: string; displayName?: string };
  receiverInfo?: { uid: string; displayName?: string };
  timestamp: { seconds: number; nanoseconds: number };
  metadata?: Record<string, unknown>;
}

// Partner Types
export interface Partner {
  id: string;
  name: string;
  email: string;
  apiKey?: string;
  kycStatus: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export interface PartnerStats {
  totalTransactions: number;
  totalVolume: number;
  successRate: number;
  recentTransactions: Transaction[];
}

// Payout Types
export interface Payout {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  recipient: string;
  timestamp: string;
}

// KYC Types
export interface KycDocument {
  id: string;
  type: 'passport' | 'national_id' | 'drivers_license' | 'utility_bill';
  url: string;
  status: 'pending' | 'approved' | 'rejected';
  uploadedAt: string;
}

export interface KycApplication {
  userId: string;
  status: 'pending' | 'approved' | 'rejected';
  documents: KycDocument[];
  submittedAt: string;
  reviewedAt?: string;
}

// Admin Types
export interface AdminStats {
  totalUsers: number;
  totalTransactions: number;
  totalVolume: number;
  activePartners: number;
  pendingKyc: number;
}

export interface ActivityLog {
  id: string;
  action: string;
  userId: string;
  timestamp: string;
  details: Record<string, unknown>;
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  bankDetails: {
    accountNumber: string;
    accountName: string;
    bankName: string;
  };
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  processedAt?: string;
}

// Wallet Types
export interface WalletData {
  balances: Record<string, number>;
  walletNotSetUp?: boolean;
}

// Generic Types
export type ApiPayload = Record<string, unknown>;
export type ApiError = {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
};

// Form Types
export interface FormData {
  [key: string]: string | number | boolean | File | undefined;
}

// Event Types
export interface FormEvent {
  preventDefault: () => void;
  target: {
    value: string;
  };
}

// Component Props Types
export interface ComponentProps {
  children?: React.ReactNode;
  className?: string;
  [key: string]: unknown;
} 