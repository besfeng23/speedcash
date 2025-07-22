import { HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

const db = admin.firestore();

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (req: any) => string; // Custom key generator
  skipSuccessfulRequests?: boolean; // Skip rate limiting for successful requests
  skipFailedRequests?: boolean; // Skip rate limiting for failed requests
  message?: string; // Custom error message
}

export interface RateLimitInfo {
  remaining: number;
  resetTime: number;
  totalRequests: number;
}

export class RateLimiter {
  private config: RateLimitConfig;

  constructor(config: Partial<RateLimitConfig> = {}) {
    this.config = {
      windowMs: 15 * 60 * 1000, // 15 minutes default
      maxRequests: 100, // 100 requests per window default
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      message: 'Too many requests, please try again later.',
      ...config
    };
  }

  /**
   * Generate a unique key for rate limiting
   */
  private generateKey(req: any): string {
    if (this.config.keyGenerator) {
      return this.config.keyGenerator(req);
    }

    // Default key generation based on user ID and IP
    const userId = req.auth?.uid || 'anonymous';
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    const endpoint = req.url || req.path || 'unknown';
    
    return `${userId}:${ip}:${endpoint}`;
  }

  /**
   * Get current rate limit info
   */
  async getRateLimitInfo(key: string): Promise<RateLimitInfo> {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    
    const rateLimitRef = db.collection('rate_limits').doc(key);
    const doc = await rateLimitRef.get();
    
    if (!doc.exists) {
      return {
        remaining: this.config.maxRequests,
        resetTime: now + this.config.windowMs,
        totalRequests: 0
      };
    }

    const data = doc.data()!;
    const requests = data.requests || [];
    
    // Filter requests within the current window
    const validRequests = requests.filter((timestamp: number) => timestamp > windowStart);
    
    return {
      remaining: Math.max(0, this.config.maxRequests - validRequests.length),
      resetTime: windowStart + this.config.windowMs,
      totalRequests: validRequests.length
    };
  }

  /**
   * Check if request is allowed
   */
  async isAllowed(req: any): Promise<boolean> {
    const key = this.generateKey(req);
    const info = await this.getRateLimitInfo(key);
    
    return info.remaining > 0;
  }

  /**
   * Record a request
   */
  async recordRequest(req: any, success: boolean = true): Promise<void> {
    // Skip recording based on config
    if (success && this.config.skipSuccessfulRequests) return;
    if (!success && this.config.skipFailedRequests) return;

    const key = this.generateKey(req);
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    
    const rateLimitRef = db.collection('rate_limits').doc(key);
    
    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(rateLimitRef);
      
      if (!doc.exists) {
        // Create new rate limit record
        transaction.set(rateLimitRef, {
          requests: [now],
          createdAt: now,
          updatedAt: now
        });
      } else {
        // Update existing record
        const data = doc.data()!;
        const requests = data.requests || [];
        
        // Filter requests within the current window and add new request
        const validRequests = requests.filter((timestamp: number) => timestamp > windowStart);
        validRequests.push(now);
        
        transaction.update(rateLimitRef, {
          requests: validRequests,
          updatedAt: now
        });
      }
    });
  }

  /**
   * Middleware function for Express-like requests
   */
  middleware() {
    return async (req: any, res: any, next: any) => {
      try {
        const isAllowed = await this.isAllowed(req);
        
        if (!isAllowed) {
          const info = await this.getRateLimitInfo(this.generateKey(req));
          
          // Set rate limit headers
          res.set('X-RateLimit-Limit', this.config.maxRequests.toString());
          res.set('X-RateLimit-Remaining', info.remaining.toString());
          res.set('X-RateLimit-Reset', info.resetTime.toString());
          res.set('Retry-After', Math.ceil(this.config.windowMs / 1000).toString());
          
          throw new HttpsError('resource-exhausted', this.config.message || 'Rate limit exceeded');
        }
        
        // Record the request
        await this.recordRequest(req, true);
        
        next();
      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * Check rate limit and throw error if exceeded
   */
  async checkLimit(req: any): Promise<RateLimitInfo> {
    const key = this.generateKey(req);
    const info = await this.getRateLimitInfo(key);
    
    if (info.remaining <= 0) {
      throw new HttpsError('resource-exhausted', this.config.message || 'Rate limit exceeded');
    }
    
    return info;
  }
}

// Pre-configured rate limiters for different use cases
export const rateLimiters = {
  // General API rate limiting
  api: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 1000,
    message: 'API rate limit exceeded. Please try again later.'
  }),

  // Authentication rate limiting
  auth: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    message: 'Too many authentication attempts. Please try again later.'
  }),

  // Transaction rate limiting
  transactions: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
    message: 'Too many transaction requests. Please wait before trying again.'
  }),

  // KYC submission rate limiting
  kyc: new RateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,
    message: 'Too many KYC submissions. Please wait before trying again.'
  }),

  // AI assistant rate limiting
  ai: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 20,
    message: 'Too many AI requests. Please wait before trying again.'
  }),

  // Admin actions rate limiting
  admin: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 50,
    message: 'Too many admin actions. Please wait before trying again.'
  }),

  // Webhook rate limiting
  webhook: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
    message: 'Too many webhook requests. Please wait before trying again.'
  })
};

// Convenience function to check rate limit
export async function checkRateLimit(
  type: keyof typeof rateLimiters,
  req: any
): Promise<RateLimitInfo> {
  const limiter = rateLimiters[type];
  
  if (!limiter) {
    throw new HttpsError('internal', `Unknown rate limiter type: ${type}`);
  }

  return limiter.checkLimit(req);
}

// Convenience function to record request
export async function recordRequest(
  type: keyof typeof rateLimiters,
  req: any,
  success: boolean = true
): Promise<void> {
  const limiter = rateLimiters[type];
  
  if (!limiter) {
    console.warn(`Unknown rate limiter type: ${type}`);
    return;
  }

  await limiter.recordRequest(req, success);
}

// Cleanup old rate limit records (run periodically)
export async function cleanupRateLimits(): Promise<void> {
  const now = Date.now();
  const cutoff = now - (24 * 60 * 60 * 1000); // 24 hours ago
  
  const batch = db.batch();
  const snapshot = await db.collection('rate_limits')
    .where('updatedAt', '<', cutoff)
    .limit(500)
    .get();
  
  snapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });
  
  await batch.commit();
  console.log(`Cleaned up ${snapshot.size} old rate limit records`);
} 