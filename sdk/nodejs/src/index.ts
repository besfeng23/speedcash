import axios, { AxiosInstance, AxiosResponse } from 'axios';
import * as crypto from 'crypto';

// Types
export interface CPayConfig {
  secretKey: string;
  environment?: 'test' | 'live';
  baseUrl?: string;
  timeout?: number;
}

export interface ApiRequest {
  action: string;
  data: Record<string, any>;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface WalletBalance {
  balances: Record<string, number>;
}

export interface Transaction {
  id: string;
  type: 'P2P' | 'CASH_IN' | 'CASH_OUT' | 'REMITTANCE' | 'BILL_PAYMENT' | 'BUY_LOAD';
  amount: number;
  currency: 'PHP' | 'KRW';
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  senderInfo?: UserInfo;
  receiverInfo?: UserInfo;
  timestamp: string;
  description?: string;
  fees?: number;
  exchangeRate?: number;
}

export interface UserInfo {
  uid: string;
  displayName: string;
  email: string;
  mobileNumber: string;
}

export interface PartnerStats {
  availableBalance: number;
  volume24h: number;
  volume7d: number;
  dailyVolumeLast7Days: Array<{
    date: string;
    volume: number;
  }>;
}

export interface KycSubmission {
  fullName: string;
  dateOfBirth: string;
  address: string;
  documentUrls: string[];
  status?: 'PENDING_REVIEW' | 'VERIFIED' | 'REJECTED';
}

export interface WebhookEvent {
  id: string;
  type: string;
  data: Record<string, any>;
  timestamp: string;
  signature: string;
}

// CPay SDK Class
export class CPaySDK {
  private client: AxiosInstance;
  private secretKey: string;
  private environment: 'test' | 'live';

  constructor(config: CPayConfig) {
    this.secretKey = config.secretKey;
    this.environment = config.environment || 'test';
    
    const baseUrl = config.baseUrl || 'https://asia-southeast1-applez-dch9v.cloudfunctions.net';
    
    this.client = axios.create({
      baseURL: baseUrl,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.secretKey}`,
        'User-Agent': 'CPay-NodeJS-SDK/1.0.0'
      }
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error) => {
        if (error.response) {
          throw new CPayError(
            error.response.data?.message || 'API request failed',
            error.response.status,
            error.response.data
          );
        }
        throw new CPayError('Network error', 0, error.message);
      }
    );
  }

  /**
   * Make a generic API request
   */
  private async request<T>(action: string, data: Record<string, any> = {}): Promise<T> {
    const payload: ApiRequest = { action, data };
    
    try {
      const response = await this.client.post<ApiResponse<T>>('/cpayDispatcher', payload);
      
      if (!response.data.success) {
        throw new CPayError(
          response.data.message || 'API request failed',
          400,
          response.data
        );
      }
      
      return response.data.data as T;
    } catch (error) {
      if (error instanceof CPayError) {
        throw error;
      }
      throw new CPayError('Unknown error occurred', 0, error);
    }
  }

  // Wallet Methods
  /**
   * Get wallet balance for a user
   */
  async getWalletBalance(uid: string): Promise<WalletBalance> {
    return this.request<WalletBalance>('getWalletBalance', { uid });
  }

  /**
   * Get user profile information
   */
  async getUserProfile(uid: string): Promise<UserInfo> {
    return this.request<UserInfo>('getUserProfile', { uid });
  }

  // Transaction Methods
  /**
   * Initiate P2P transfer
   */
  async initiateP2PTransfer(params: {
    senderUid: string;
    receiverMobileNumber: string;
    amount: number;
    currency: 'PHP' | 'KRW';
    description?: string;
  }): Promise<Transaction> {
    return this.request<Transaction>('initiateP2PTransfer', params);
  }

  /**
   * Initiate cash-in transaction
   */
  async initiateCashIn(params: {
    uid: string;
    amount: number;
    currency: 'PHP' | 'KRW';
    method: string;
    bankCode?: string;
    accountNumber?: string;
  }): Promise<Transaction> {
    return this.request<Transaction>('initiateCashIn', params);
  }

  /**
   * Initiate cash-out transaction
   */
  async initiateCashOut(params: {
    uid: string;
    amount: number;
    currency: 'PHP' | 'KRW';
    method: string;
    bankCode: string;
    accountNumber: string;
    accountName: string;
  }): Promise<Transaction> {
    return this.request<Transaction>('initiateCashOut', params);
  }

  /**
   * Initiate InstaPay transfer
   */
  async initiateInstaPayTransfer(params: {
    uid: string;
    amount: number;
    currency: 'PHP' | 'KRW';
    bankCode: string;
    accountNumber: string;
    accountName: string;
    description?: string;
  }): Promise<Transaction> {
    return this.request<Transaction>('initiateInstaPayTransfer', params);
  }

  /**
   * Initiate PesoNet transfer
   */
  async initiatePesoNetTransfer(params: {
    uid: string;
    amount: number;
    currency: 'PHP' | 'KRW';
    bankCode: string;
    accountNumber: string;
    accountName: string;
    description?: string;
  }): Promise<Transaction> {
    return this.request<Transaction>('initiatePesoNetTransfer', params);
  }

  /**
   * Initiate international remittance
   */
  async initiateRemittance(params: {
    uid: string;
    amount: number;
    currency: 'PHP' | 'KRW';
    recipientName: string;
    recipientPhone: string;
    recipientAddress: string;
    recipientBank: string;
    recipientAccount: string;
    purpose: string;
    description?: string;
  }): Promise<Transaction> {
    return this.request<Transaction>('initiateRemittance', params);
  }

  /**
   * Buy mobile load
   */
  async initiateBuyLoad(params: {
    uid: string;
    amount: number;
    currency: 'PHP' | 'KRW';
    mobileNumber: string;
    provider: string;
    loadType: string;
  }): Promise<Transaction> {
    return this.request<Transaction>('initiateBuyLoad', params);
  }

  /**
   * Pay utility bills
   */
  async initiateBillPayment(params: {
    uid: string;
    amount: number;
    currency: 'PHP' | 'KRW';
    billType: string;
    provider: string;
    accountNumber: string;
    customerName: string;
    dueDate: string;
  }): Promise<Transaction> {
    return this.request<Transaction>('initiateBillPayment', params);
  }

  /**
   * Get transaction history
   */
  async getTransactionHistory(params: {
    uid: string;
    limit?: number;
    offset?: number;
    type?: string;
  }): Promise<{ transactions: Transaction[] }> {
    return this.request<{ transactions: Transaction[] }>('getTransactionHistory', params);
  }

  // KYC Methods
  /**
   * Submit KYC documents
   */
  async submitKyc(params: {
    fullName: string;
    dateOfBirth: string;
    address: string;
    documentUrls: string[];
  }): Promise<KycSubmission> {
    return this.request<KycSubmission>('submitKyc', params);
  }

  // Partner Methods
  /**
   * Get partner dashboard statistics
   */
  async getPartnerDashboardStats(): Promise<PartnerStats> {
    return this.request<PartnerStats>('partnerGetDashboardStats');
  }

  /**
   * Initiate test payout
   */
  async initiateTestPayout(params: {
    partnerId: string;
    amount: number;
    channel: string;
    accountNumber: string;
    accountName: string;
  }): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>('partnerInitiateTestPayout', params);
  }

  // Webhook Methods
  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload, 'utf8')
      .digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  }

  /**
   * Parse webhook event
   */
  parseWebhookEvent(payload: string, signature: string, secret: string): WebhookEvent {
    if (!this.verifyWebhookSignature(payload, signature, secret)) {
      throw new CPayError('Invalid webhook signature', 400);
    }
    
    return JSON.parse(payload) as WebhookEvent;
  }

  // Utility Methods
  /**
   * Get SDK configuration
   */
  getConfig(): CPayConfig {
    return {
      secretKey: this.secretKey,
      environment: this.environment,
      baseUrl: this.client.defaults.baseURL,
      timeout: this.client.defaults.timeout
    };
  }

  /**
   * Test API connection
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.getWalletBalance('test_user');
      return true;
    } catch (error) {
      return false;
    }
  }
}

// Error Class
export class CPayError extends Error {
  public statusCode: number;
  public details: any;

  constructor(message: string, statusCode: number = 0, details?: any) {
    super(message);
    this.name = 'CPayError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

// Export default instance creator
export default function createCPaySDK(config: CPayConfig): CPaySDK {
  return new CPaySDK(config);
} 