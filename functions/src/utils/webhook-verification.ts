import { HttpsError } from 'firebase-functions/v2/https';
import * as crypto from 'crypto';

export interface WebhookConfig {
  secret: string;
  algorithm: 'sha256' | 'sha512' | 'hmac-sha256' | 'hmac-sha512';
  headerName: string;
  toleranceSeconds: number;
}

export interface WebhookPayload {
  body: string;
  headers: Record<string, string>;
  timestamp?: number;
  signature?: string;
}

export class WebhookVerifier {
  private config: WebhookConfig;

  constructor(config: WebhookConfig) {
    this.config = config;
  }

  /**
   * Verify webhook signature using HMAC-SHA256
   */
  verifyHmacSignature(payload: WebhookPayload): boolean {
    const { body, headers } = payload;
    const signature = headers[this.config.headerName.toLowerCase()] || 
                     headers[this.config.headerName] ||
                     headers['x-signature'] ||
                     headers['x-webhook-signature'];

    if (!signature) {
      console.error('No webhook signature found in headers');
      return false;
    }

    // Create expected signature
    const expectedSignature = crypto
      .createHmac('sha256', this.config.secret)
      .update(body, 'utf8')
      .digest('hex');

    // Compare signatures (constant-time comparison to prevent timing attacks)
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  }

  /**
   * Verify webhook signature using SHA256
   */
  verifySha256Signature(payload: WebhookPayload): boolean {
    const { body, headers } = payload;
    const signature = headers[this.config.headerName.toLowerCase()] || 
                     headers[this.config.headerName] ||
                     headers['x-signature'] ||
                     headers['x-webhook-signature'];

    if (!signature) {
      console.error('No webhook signature found in headers');
      return false;
    }

    // Create expected signature
    const expectedSignature = crypto
      .createHash('sha256')
      .update(body + this.config.secret, 'utf8')
      .digest('hex');

    // Compare signatures
    return signature === expectedSignature;
  }

  /**
   * Verify webhook timestamp to prevent replay attacks
   */
  verifyTimestamp(payload: WebhookPayload): boolean {
    const timestamp = payload.timestamp || 
                     parseInt(payload.headers['x-timestamp'] || '0', 10);

    if (!timestamp) {
      console.error('No timestamp found in webhook');
      return false;
    }

    const now = Math.floor(Date.now() / 1000);
    const tolerance = this.config.toleranceSeconds || 300; // 5 minutes default

    return Math.abs(now - timestamp) <= tolerance;
  }

  /**
   * Main verification method
   */
  verify(payload: WebhookPayload): boolean {
    try {
      // Verify timestamp first
      if (!this.verifyTimestamp(payload)) {
        console.error('Webhook timestamp verification failed');
        return false;
      }

      // Verify signature based on algorithm
      let signatureValid = false;
      switch (this.config.algorithm) {
        case 'sha256':
          signatureValid = this.verifySha256Signature(payload);
          break;
        case 'hmac-sha256':
          signatureValid = this.verifyHmacSignature(payload);
          break;
        case 'sha512':
          signatureValid = this.verifySha512Signature(payload);
          break;
        case 'hmac-sha512':
          signatureValid = this.verifyHmacSha512Signature(payload);
          break;
        default:
          console.error(`Unsupported signature algorithm: ${this.config.algorithm}`);
          return false;
      }

      if (!signatureValid) {
        console.error('Webhook signature verification failed');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Webhook verification error:', error);
      return false;
    }
  }

  /**
   * Verify webhook signature using SHA512
   */
  private verifySha512Signature(payload: WebhookPayload): boolean {
    const { body, headers } = payload;
    const signature = headers[this.config.headerName.toLowerCase()] || 
                     headers[this.config.headerName] ||
                     headers['x-signature'] ||
                     headers['x-webhook-signature'];

    if (!signature) {
      console.error('No webhook signature found in headers');
      return false;
    }

    // Create expected signature
    const expectedSignature = crypto
      .createHash('sha512')
      .update(body + this.config.secret, 'utf8')
      .digest('hex');

    // Compare signatures
    return signature === expectedSignature;
  }

  /**
   * Verify webhook signature using HMAC-SHA512
   */
  private verifyHmacSha512Signature(payload: WebhookPayload): boolean {
    const { body, headers } = payload;
    const signature = headers[this.config.headerName.toLowerCase()] || 
                     headers[this.config.headerName] ||
                     headers['x-signature'] ||
                     headers['x-webhook-signature'];

    if (!signature) {
      console.error('No webhook signature found in headers');
      return false;
    }

    // Create expected signature
    const expectedSignature = crypto
      .createHmac('sha512', this.config.secret)
      .update(body, 'utf8')
      .digest('hex');

    // Compare signatures (constant-time comparison)
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  }
}

// Pre-configured webhook verifiers for different payment gateways
export const webhookVerifiers = {
  instapay: new WebhookVerifier({
    secret: process.env.INSTAPAY_WEBHOOK_SECRET || '',
    algorithm: 'hmac-sha256',
    headerName: 'x-instapay-signature',
    toleranceSeconds: 300
  }),

  gcash: new WebhookVerifier({
    secret: process.env.GCASH_WEBHOOK_SECRET || '',
    algorithm: 'sha256',
    headerName: 'x-gcash-signature',
    toleranceSeconds: 300
  }),

  maya: new WebhookVerifier({
    secret: process.env.MAYA_WEBHOOK_SECRET || '',
    algorithm: 'hmac-sha256',
    headerName: 'x-maya-signature',
    toleranceSeconds: 300
  }),

  koreanBank: new WebhookVerifier({
    secret: process.env.KOREAN_BANK_WEBHOOK_SECRET || '',
    algorithm: 'sha512',
    headerName: 'x-korean-bank-signature',
    toleranceSeconds: 300
  }),

  generic: new WebhookVerifier({
    secret: process.env.WEBHOOK_SECRET || '',
    algorithm: 'hmac-sha256',
    headerName: 'x-webhook-signature',
    toleranceSeconds: 300
  })
};

// Convenience function to verify webhook with error handling
export function verifyWebhook(
  gateway: keyof typeof webhookVerifiers,
  payload: WebhookPayload
): boolean {
  const verifier = webhookVerifiers[gateway];
  
  if (!verifier) {
    console.error(`No webhook verifier configured for gateway: ${gateway}`);
    return false;
  }

  return verifier.verify(payload);
}

// Middleware function for webhook verification
export function createWebhookMiddleware(gateway: keyof typeof webhookVerifiers) {
  return (req: any, _res: any, next: any) => {
    const payload: WebhookPayload = {
      body: JSON.stringify(req.body),
      headers: req.headers,
      timestamp: parseInt(req.headers['x-timestamp'] || '0', 10),
      signature: req.headers['x-signature'] || req.headers['x-webhook-signature']
    };

    if (!verifyWebhook(gateway, payload)) {
      throw new HttpsError('unauthenticated', 'Invalid webhook signature');
    }

    next();
  };
} 