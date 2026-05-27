import * as crypto from 'crypto';

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
  metadata?: Record<string, unknown>;
}

export interface ChannelAggregatorResponse {
  success: boolean;
  transactionId?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  message: string;
  channelResponse?: unknown;
  timestamp?: string;
}

type AggregatorPayload = Record<string, unknown>;

type AggregatorRequestOptions = {
  method: 'GET' | 'POST';
  headers: Record<string, string>;
  body?: AggregatorPayload;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function getString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required Channel Aggregator config: ${name}`);
  }
  return value;
}

function redactProviderResponse(value: unknown): unknown {
  if (!isRecord(value)) return value;

  const sensitiveKeys = new Set([
    'account_number',
    'accountNumber',
    'account_name',
    'accountName',
    'mobile_number',
    'mobileNumber',
    'email',
    'signature',
    'sha256Key',
    'authorization',
  ]);

  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [
      key,
      sensitiveKeys.has(key) ? '[REDACTED]' : redactProviderResponse(entry),
    ])
  );
}

export class ChannelAggregatorGateway {
  private config: ChannelAggregatorConfig;

  constructor(config: ChannelAggregatorConfig) {
    this.config = config;
  }

  async initiateTransfer(request: ChannelAggregatorRequest): Promise<ChannelAggregatorResponse> {
    try {
      console.log('[Channel Aggregator] initiate transfer', {
        channel: request.channel,
        referenceId: request.referenceId,
        amount: request.amount,
        currency: request.currency,
      });

      const payload = this.preparePayload(request);
      const signature = this.generateSignature(payload);

      const response = await this.callChannelAggregatorAPI('/transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Merchant-Name': this.config.merchantName,
          'X-Merchant-No': this.config.merchantNo,
          'X-Signature': signature,
          'X-Timestamp': new Date().toISOString(),
        },
        body: payload,
      });

      return {
        success: Boolean(response.success),
        transactionId: getString(response.transaction_id) || getString(response.reference_id),
        status: this.mapStatus(getString(response.status)),
        message: getString(response.message) || 'Transfer processed',
        channelResponse: redactProviderResponse(response),
        timestamp: new Date().toISOString(),
      };
    } catch (error: unknown) {
      console.error('[Channel Aggregator] transfer failed', {
        referenceId: request.referenceId,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      return {
        success: false,
        status: 'failed',
        message: error instanceof Error ? error.message : 'Transfer failed',
        timestamp: new Date().toISOString(),
      };
    }
  }

  async checkTransactionStatus(transactionId: string): Promise<ChannelAggregatorResponse> {
    try {
      console.log('[Channel Aggregator] check status', {transactionId});

      const payload = {
        transaction_id: transactionId,
        merchant_name: this.config.merchantName,
        merchant_no: this.config.merchantNo,
        timestamp: new Date().toISOString(),
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
        body: payload,
      });

      return {
        success: Boolean(response.success),
        transactionId: getString(response.transaction_id),
        status: this.mapStatus(getString(response.status)),
        message: getString(response.message) || 'Status retrieved',
        channelResponse: redactProviderResponse(response),
        timestamp: new Date().toISOString(),
      };
    } catch (error: unknown) {
      console.error('[Channel Aggregator] status check failed', {
        transactionId,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      return {
        success: false,
        status: 'failed',
        message: error instanceof Error ? error.message : 'Status check failed',
        timestamp: new Date().toISOString(),
      };
    }
  }

  async getAvailableChannels(): Promise<unknown> {
    try {
      console.log('[Channel Aggregator] get available channels');

      const payload = {
        merchant_name: this.config.merchantName,
        merchant_no: this.config.merchantNo,
        timestamp: new Date().toISOString(),
      };

      const signature = this.generateSignature(payload);

      const response = await this.callChannelAggregatorAPI('/channels', {
        method: 'GET',
        headers: {
          'X-Merchant-Name': this.config.merchantName,
          'X-Merchant-No': this.config.merchantNo,
          'X-Signature': signature,
          'X-Timestamp': new Date().toISOString(),
        },
      });

      return {
        success: true,
        channels: Array.isArray(response.channels) ? response.channels : [],
        message: 'Channels retrieved successfully',
        channelResponse: redactProviderResponse(response),
      };
    } catch (error: unknown) {
      console.error('[Channel Aggregator] get channels failed', {
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      return {
        success: false,
        channels: [],
        message: error instanceof Error ? error.message : 'Failed to get channels',
      };
    }
  }

  private preparePayload(request: ChannelAggregatorRequest): AggregatorPayload {
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
      timestamp: new Date().toISOString(),
    };
  }

  private generateSignature(payload: AggregatorPayload): string {
    return crypto
      .createHmac('sha256', this.config.sha256Key)
      .update(JSON.stringify(payload), 'utf8')
      .digest('hex');
  }

  private async callChannelAggregatorAPI(
    endpoint: string,
    options: AggregatorRequestOptions
  ): Promise<Record<string, unknown>> {
    const url = `${this.config.endpoint}${endpoint}`;

    console.log('[Channel Aggregator] API request', {
      endpoint,
      method: options.method,
      hasBody: Boolean(options.body),
    });

    const {default: fetch} = await import('node-fetch');

    const response = await fetch(url, {
      method: options.method,
      headers: options.headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`Provider API call failed with status ${response.status}`);
    }

    const data: unknown = await response.json();
    if (!isRecord(data)) {
      throw new Error('Provider API returned an invalid response shape');
    }

    console.log('[Channel Aggregator] API response received', {
      endpoint,
      status: getString(data.status) || 'unknown',
      transactionId: getString(data.transaction_id) || getString(data.reference_id) || 'unknown',
    });

    return data;
  }

  private mapStatus(channelStatus?: string): 'pending' | 'processing' | 'completed' | 'failed' {
    const statusMap: Record<string, 'pending' | 'processing' | 'completed' | 'failed'> = {
      pending: 'pending',
      processing: 'processing',
      completed: 'completed',
      success: 'completed',
      failed: 'failed',
      error: 'failed',
      cancelled: 'failed',
      rejected: 'failed',
    };

    return statusMap[channelStatus?.toLowerCase() || ''] || 'pending';
  }
}

export class ChannelAggregatorFactory {
  static createGateway(config: ChannelAggregatorConfig): ChannelAggregatorGateway {
    return new ChannelAggregatorGateway(config);
  }
}

export function getChannelAggregatorConfig(): ChannelAggregatorConfig {
  const env = process.env.NODE_ENV === 'production' ? 'production' : 'sandbox';

  return {
    merchantName: requireEnv('CHANNEL_AGGREGATOR_MERCHANT_NAME'),
    merchantNo: requireEnv('CHANNEL_AGGREGATOR_MERCHANT_NO'),
    sha256Key: requireEnv('CHANNEL_AGGREGATOR_SHA256_KEY'),
    endpoint: requireEnv('CHANNEL_AGGREGATOR_ENDPOINT').replace(/\/$/, ''),
    environment: env,
  };
}

export const CHANNEL_TYPES = {
  INSTAPAY: 'instapay',
  GCASH: 'gcash',
  MAYA: 'maya',
  PESONET: 'pesonet',
  KOREAN_BANK: 'korean-bank',
  OTHER: 'other',
} as const;

export type ChannelType = typeof CHANNEL_TYPES[keyof typeof CHANNEL_TYPES];
