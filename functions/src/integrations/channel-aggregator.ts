import * as crypto from 'crypto';

// --- Channel Aggregator Configuration ---
export interface ChannelAggregatorConfig {
  merchantName: string;
  merchantNo: string;
  sha256Key: string;
  endpoint: string;
  environment: 'sandbox' | 'production';
}

export interface ChannelAggregatorRequest {
  amount: number;
  currency: string;
  referenceId: string;
  description: string;
  channel: 'instapay' | 'gcash' | 'maya' | 'pesonet' | 'korean-bank' | 'other';
  recipientInfo: {
    accountNumber?: string;
    accountName?: string;
    bankCode?: string;
    mobileNumber?: string;
    email?: string;
  };
  metadata?: Record<string, any>;
}

export interface ChannelAggregatorResponse {
  success: boolean;
  transactionId?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  message: string;
  channelResponse?: any;
  timestamp?: string;
}

// --- Channel Aggregator Gateway ---
export class ChannelAggregatorGateway {
  private config: ChannelAggregatorConfig;

  constructor(config: ChannelAggregatorConfig) {
    this.config = config;
  }

  /**
   * Initiate a transfer through the channel aggregator
   */
  async initiateTransfer(request: ChannelAggregatorRequest): Promise<ChannelAggregatorResponse> {
    try {
      console.log(`[Channel Aggregator] Initiating transfer for channel: ${request.channel}`);
      
      // Prepare the request payload
      const payload = this.preparePayload(request);
      
      // Generate signature
      const signature = this.generateSignature(payload);
      
      // Make API call
      const response = await this.callChannelAggregatorAPI('/transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Merchant-Name': this.config.merchantName,
          'X-Merchant-No': this.config.merchantNo,
          'X-Signature': signature,
          'X-Timestamp': new Date().toISOString(),
        },
        body: payload
      });

      console.log(`[Channel Aggregator] Transfer response:`, response);

      return {
        success: response.success || false,
        transactionId: response.transaction_id || response.reference_id,
        status: this.mapStatus(response.status),
        message: response.message || 'Transfer processed',
        channelResponse: response,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('[Channel Aggregator] Transfer failed:', error);
      return {
        success: false,
        status: 'failed',
        message: error instanceof Error ? error.message : 'Transfer failed',
        channelResponse: error,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Check transaction status
   */
  async checkTransactionStatus(transactionId: string): Promise<ChannelAggregatorResponse> {
    try {
      console.log(`[Channel Aggregator] Checking status for transaction: ${transactionId}`);
      
      const payload = {
        transaction_id: transactionId,
        merchant_name: this.config.merchantName,
        merchant_no: this.config.merchantNo,
        timestamp: new Date().toISOString()
      };

      const signature = this.generateSignature(payload);

      const response = await this.callChannelAggregatorAPI('/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Merchant-Name': this.config.merchantName,
          'X-Merchant-No': this.config.merchantNo,
          'X-Signature': signature,
          'X-Timestamp': new Date().toISOString(),
        },
        body: payload
      });

      return {
        success: response.success || false,
        transactionId: response.transaction_id,
        status: this.mapStatus(response.status),
        message: response.message || 'Status retrieved',
        channelResponse: response,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('[Channel Aggregator] Status check failed:', error);
      return {
        success: false,
        status: 'failed',
        message: error instanceof Error ? error.message : 'Status check failed',
        channelResponse: error,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get available channels
   */
  async getAvailableChannels(): Promise<any> {
    try {
      console.log(`[Channel Aggregator] Getting available channels`);
      
      const payload = {
        merchant_name: this.config.merchantName,
        merchant_no: this.config.merchantNo,
        timestamp: new Date().toISOString()
      };

      const signature = this.generateSignature(payload);

      const response = await this.callChannelAggregatorAPI('/channels', {
        method: 'GET',
        headers: {
          'X-Merchant-Name': this.config.merchantName,
          'X-Merchant-No': this.config.merchantNo,
          'X-Signature': signature,
          'X-Timestamp': new Date().toISOString(),
        }
      });

      return {
        success: true,
        channels: response.channels || [],
        message: 'Channels retrieved successfully',
        channelResponse: response
      };

    } catch (error) {
      console.error('[Channel Aggregator] Get channels failed:', error);
      return {
        success: false,
        channels: [],
        message: error instanceof Error ? error.message : 'Failed to get channels',
        channelResponse: error
      };
    }
  }

  /**
   * Prepare the request payload
   */
  private preparePayload(request: ChannelAggregatorRequest): any {
    return {
      merchant_name: this.config.merchantName,
      merchant_no: this.config.merchantNo,
      amount: request.amount,
      currency: request.currency,
      reference_id: request.referenceId,
      description: request.description,
      channel: request.channel,
      recipient: {
        account_number: request.recipientInfo.accountNumber,
        account_name: request.recipientInfo.accountName,
        bank_code: request.recipientInfo.bankCode,
        mobile_number: request.recipientInfo.mobileNumber,
        email: request.recipientInfo.email,
      },
      metadata: request.metadata || {},
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Generate SHA256 signature
   */
  private generateSignature(payload: any): string {
    const payloadString = JSON.stringify(payload);
    const signature = crypto
      .createHmac('sha256', this.config.sha256Key)
      .update(payloadString, 'utf8')
      .digest('hex');
    
    console.log(`[Channel Aggregator] Generated signature for payload:`, payloadString.substring(0, 100) + '...');
    return signature;
  }

  /**
   * Make API call to channel aggregator
   */
  private async callChannelAggregatorAPI(endpoint: string, options: any): Promise<any> {
    const url = `${this.config.endpoint}${endpoint}`;
    
    console.log(`[Channel Aggregator] Making API call to: ${url}`);
    console.log(`[Channel Aggregator] Request options:`, {
      method: options.method,
      headers: options.headers,
      body: options.body ? JSON.stringify(options.body).substring(0, 200) + '...' : 'No body'
    });

    try {
      // Use dynamic import for node-fetch to avoid ES module issues
      const { default: fetch } = await import('node-fetch');
      
      const response = await fetch(url, {
        method: options.method,
        headers: options.headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API call failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log(`[Channel Aggregator] API response:`, data);
      
      return data;

    } catch (error) {
      console.error(`[Channel Aggregator] API call error:`, error);
      throw error;
    }
  }

  /**
   * Map channel aggregator status to internal status
   */
  private mapStatus(channelStatus: string): 'pending' | 'processing' | 'completed' | 'failed' {
    const statusMap: Record<string, 'pending' | 'processing' | 'completed' | 'failed'> = {
      'pending': 'pending',
      'processing': 'processing',
      'completed': 'completed',
      'success': 'completed',
      'failed': 'failed',
      'error': 'failed',
      'cancelled': 'failed',
      'rejected': 'failed'
    };

    return statusMap[channelStatus?.toLowerCase()] || 'pending';
  }
}

// --- Channel Aggregator Factory ---
export class ChannelAggregatorFactory {
  static createGateway(config: ChannelAggregatorConfig): ChannelAggregatorGateway {
    return new ChannelAggregatorGateway(config);
  }
}

// --- Configuration Management ---
export function getChannelAggregatorConfig(): ChannelAggregatorConfig {
  const env = process.env.NODE_ENV === 'production' ? 'production' : 'sandbox';
  
  return {
    merchantName: process.env.CHANNEL_AGGREGATOR_MERCHANT_NAME || 'CPAY',
    merchantNo: process.env.CHANNEL_AGGREGATOR_MERCHANT_NO || '300000064613',
    sha256Key: process.env.CHANNEL_AGGREGATOR_SHA256_KEY || 'uck6lo8sdjaarqf3sohdoovdvvn0kdnk',
    endpoint: process.env.CHANNEL_AGGREGATOR_ENDPOINT || 'https://api.channelaggregator.com',
    environment: env
  };
}

// --- Channel Types ---
export const CHANNEL_TYPES = {
  INSTAPAY: 'instapay',
  GCASH: 'gcash',
  MAYA: 'maya',
  PESONET: 'pesonet',
  KOREAN_BANK: 'korean-bank',
  OTHER: 'other'
} as const;

export type ChannelType = typeof CHANNEL_TYPES[keyof typeof CHANNEL_TYPES]; 