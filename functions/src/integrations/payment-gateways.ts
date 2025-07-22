import { HttpsError } from 'firebase-functions/v2/https';
import { 
  ChannelAggregatorGateway, 
  ChannelAggregatorFactory, 
  getChannelAggregatorConfig,
  ChannelAggregatorRequest,
  CHANNEL_TYPES 
} from './channel-aggregator';

// --- Payment Gateway Interfaces ---
export interface PaymentGatewayConfig {
  apiKey: string;
  secretKey: string;
  endpoint: string;
  environment: 'sandbox' | 'production';
}

export interface PaymentRequest {
  amount: number;
  currency: string;
  referenceId: string;
  description: string;
  recipientInfo: {
    accountNumber?: string;
    accountName?: string;
    bankCode?: string;
    mobileNumber?: string;
  };
}

export interface PaymentResponse {
  success: boolean;
  transactionId?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  message: string;
  gatewayResponse?: any;
}

// --- Unified Channel Aggregator Gateway ---
export class UnifiedChannelAggregatorGateway {
  private channelAggregator: ChannelAggregatorGateway;

  constructor() {
    const config = getChannelAggregatorConfig();
    this.channelAggregator = ChannelAggregatorFactory.createGateway(config);
  }

  async initiateTransfer(request: PaymentRequest, channel: string): Promise<PaymentResponse> {
    try {
      console.log(`[Unified Gateway] Initiating transfer via channel: ${channel}`);
      
      const channelRequest: ChannelAggregatorRequest = {
        amount: request.amount,
        currency: request.currency,
        referenceId: request.referenceId,
        description: request.description,
        channel: channel as any,
        recipientInfo: {
          accountNumber: request.recipientInfo.accountNumber,
          accountName: request.recipientInfo.accountName,
          bankCode: request.recipientInfo.bankCode,
          mobileNumber: request.recipientInfo.mobileNumber,
        },
        metadata: {
          source: 'cpay',
          timestamp: new Date().toISOString()
        }
      };

      const response = await this.channelAggregator.initiateTransfer(channelRequest);

      return {
        success: response.success,
        transactionId: response.transactionId,
        status: response.status,
        message: response.message,
        gatewayResponse: response.channelResponse
      };

    } catch (error) {
      console.error(`[Unified Gateway] Transfer failed for channel ${channel}:`, error);
      return {
        success: false,
        status: 'failed',
        message: error instanceof Error ? error.message : 'Transfer failed',
        gatewayResponse: error
      };
    }
  }

  async checkTransactionStatus(transactionId: string): Promise<PaymentResponse> {
    try {
      const response = await this.channelAggregator.checkTransactionStatus(transactionId);
      
      return {
        success: response.success,
        transactionId: response.transactionId,
        status: response.status,
        message: response.message,
        gatewayResponse: response.channelResponse
      };

    } catch (error) {
      console.error(`[Unified Gateway] Status check failed:`, error);
      return {
        success: false,
        status: 'failed',
        message: error instanceof Error ? error.message : 'Status check failed',
        gatewayResponse: error
      };
    }
  }

  async getAvailableChannels(): Promise<any> {
    try {
      return await this.channelAggregator.getAvailableChannels();
    } catch (error) {
      console.error(`[Unified Gateway] Get channels failed:`, error);
      return {
        success: false,
        channels: [],
        message: error instanceof Error ? error.message : 'Failed to get channels'
      };
    }
  }
}

// --- Legacy Gateway Classes (Now using Channel Aggregator) ---

export class InstaPayGateway {
  private unifiedGateway: UnifiedChannelAggregatorGateway;

  constructor(_config: PaymentGatewayConfig) {
    this.unifiedGateway = new UnifiedChannelAggregatorGateway();
  }

  async initiateTransfer(request: PaymentRequest): Promise<PaymentResponse> {
    return this.unifiedGateway.initiateTransfer(request, CHANNEL_TYPES.INSTAPAY);
  }
}

export class GCashGateway {
  private unifiedGateway: UnifiedChannelAggregatorGateway;

  constructor(_config: PaymentGatewayConfig) {
    this.unifiedGateway = new UnifiedChannelAggregatorGateway();
  }

  async initiateTransfer(request: PaymentRequest): Promise<PaymentResponse> {
    return this.unifiedGateway.initiateTransfer(request, CHANNEL_TYPES.GCASH);
  }
}

export class MayaGateway {
  private unifiedGateway: UnifiedChannelAggregatorGateway;

  constructor(_config: PaymentGatewayConfig) {
    this.unifiedGateway = new UnifiedChannelAggregatorGateway();
  }

  async initiateTransfer(request: PaymentRequest): Promise<PaymentResponse> {
    return this.unifiedGateway.initiateTransfer(request, CHANNEL_TYPES.MAYA);
  }
}

export class KoreanBankGateway {
  private unifiedGateway: UnifiedChannelAggregatorGateway;

  constructor(_config: PaymentGatewayConfig) {
    this.unifiedGateway = new UnifiedChannelAggregatorGateway();
  }

  async initiateTransfer(request: PaymentRequest): Promise<PaymentResponse> {
    return this.unifiedGateway.initiateTransfer(request, CHANNEL_TYPES.KOREAN_BANK);
  }
}

export class PesoNetGateway {
  private unifiedGateway: UnifiedChannelAggregatorGateway;

  constructor(_config: PaymentGatewayConfig) {
    this.unifiedGateway = new UnifiedChannelAggregatorGateway();
  }

  async initiateTransfer(request: PaymentRequest): Promise<PaymentResponse> {
    return this.unifiedGateway.initiateTransfer(request, CHANNEL_TYPES.PESONET);
  }
}

export class NewPartnerGateway {
  private unifiedGateway: UnifiedChannelAggregatorGateway;

  constructor(_config: PaymentGatewayConfig) {
    this.unifiedGateway = new UnifiedChannelAggregatorGateway();
  }

  async initiateTransfer(request: PaymentRequest): Promise<PaymentResponse> {
    return this.unifiedGateway.initiateTransfer(request, CHANNEL_TYPES.OTHER);
  }
}

// --- Payment Gateway Factory ---
export class PaymentGatewayFactory {
  static createGateway(type: 'instapay' | 'gcash' | 'maya' | 'korean-bank' | 'pesonet' | 'new-partner', config: PaymentGatewayConfig) {
    switch (type) {
      case 'instapay':
        return new InstaPayGateway(config);
      case 'gcash':
        return new GCashGateway(config);
      case 'maya':
        return new MayaGateway(config);
      case 'korean-bank':
        return new KoreanBankGateway(config);
      case 'pesonet':
        return new PesoNetGateway(config);
      case 'new-partner':
        return new NewPartnerGateway(config);
      default:
        throw new HttpsError('invalid-argument', `Unsupported payment gateway: ${type}`);
    }
  }

  static createUnifiedGateway(): UnifiedChannelAggregatorGateway {
    return new UnifiedChannelAggregatorGateway();
  }
}

// --- Configuration Management ---
export function getPaymentGatewayConfig(type: string): PaymentGatewayConfig {
  const env = process.env.NODE_ENV === 'production' ? 'production' : 'sandbox';
  
  // All gateways now use the channel aggregator configuration
  const channelConfig = getChannelAggregatorConfig();
  
  return {
    apiKey: channelConfig.merchantNo,
    secretKey: channelConfig.sha256Key,
    endpoint: channelConfig.endpoint,
    environment: env
  };
} 