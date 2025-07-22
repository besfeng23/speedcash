import * as admin from 'firebase-admin';

const db = admin.firestore();

export interface CacheConfig {
  ttl: number; // Time to live in seconds
  prefix: string; // Cache key prefix
  maxSize: number; // Maximum number of cached items
}

export interface CacheItem<T = any> {
  data: T;
  timestamp: number;
  expiresAt: number;
  accessCount: number;
  lastAccessed: number;
}

export class CacheService {
  private config: CacheConfig;
  private collection: string;

  constructor(config: CacheConfig) {
    this.config = config;
    this.collection = `cache_${config.prefix}`;
  }

  /**
   * Get cached data
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const docRef = db.collection(this.collection).doc(key);
      const doc = await docRef.get();

      if (!doc.exists) {
        return null;
      }

      const cacheItem = doc.data() as CacheItem<T>;
      const now = Date.now();

      // Check if cache has expired
      if (now > cacheItem.expiresAt) {
        await this.delete(key);
        return null;
      }

      // Update access statistics
      await docRef.update({
        accessCount: admin.firestore.FieldValue.increment(1),
        lastAccessed: now
      });

      return cacheItem.data;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Set cached data
   */
  async set<T>(key: string, data: T, ttl?: number): Promise<void> {
    try {
      const now = Date.now();
      const expiresAt = now + ((ttl || this.config.ttl) * 1000);

      const cacheItem: CacheItem<T> = {
        data,
        timestamp: now,
        expiresAt,
        accessCount: 0,
        lastAccessed: now
      };

      await db.collection(this.collection).doc(key).set(cacheItem);

      // Clean up old items if cache is too large
      await this.cleanup();
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  /**
   * Delete cached data
   */
  async delete(key: string): Promise<void> {
    try {
      await db.collection(this.collection).doc(key).delete();
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  /**
   * Check if key exists and is not expired
   */
  async exists(key: string): Promise<boolean> {
    try {
      const docRef = db.collection(this.collection).doc(key);
      const doc = await docRef.get();

      if (!doc.exists) {
        return false;
      }

      const cacheItem = doc.data() as CacheItem;
      const now = Date.now();

      if (now > cacheItem.expiresAt) {
        await this.delete(key);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Cache exists error:', error);
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    totalItems: number;
    totalSize: number;
    hitRate: number;
    averageAccessCount: number;
  }> {
    try {
      const snapshot = await db.collection(this.collection).get();
      const items = snapshot.docs.map(doc => doc.data() as CacheItem);
      const now = Date.now();

      // Filter out expired items
      const validItems = items.filter(item => now <= item.expiresAt);
      const totalAccessCount = validItems.reduce((sum, item) => sum + item.accessCount, 0);

      return {
        totalItems: validItems.length,
        totalSize: validItems.length,
        hitRate: validItems.length > 0 ? totalAccessCount / validItems.length : 0,
        averageAccessCount: validItems.length > 0 ? totalAccessCount / validItems.length : 0
      };
    } catch (error) {
      console.error('Cache stats error:', error);
      return {
        totalItems: 0,
        totalSize: 0,
        hitRate: 0,
        averageAccessCount: 0
      };
    }
  }

  /**
   * Clear all cached data
   */
  async clear(): Promise<void> {
    try {
      const snapshot = await db.collection(this.collection).get();
      const batch = db.batch();

      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  /**
   * Clean up expired and old items
   */
  private async cleanup(): Promise<void> {
    try {
      const snapshot = await db.collection(this.collection)
        .orderBy('lastAccessed', 'asc')
        .limit(100)
        .get();

      const now = Date.now();
      const batch = db.batch();
      let deletedCount = 0;

      // Delete expired items
      snapshot.docs.forEach(doc => {
        const cacheItem = doc.data() as CacheItem;
        if (now > cacheItem.expiresAt) {
          batch.delete(doc.ref);
          deletedCount++;
        }
      });

      // Delete old items if cache is too large
      if (snapshot.docs.length - deletedCount > this.config.maxSize) {
        const remainingDocs = snapshot.docs.slice(deletedCount);
        const docsToDelete = remainingDocs.slice(0, remainingDocs.length - this.config.maxSize);

        docsToDelete.forEach(doc => {
          batch.delete(doc.ref);
        });
      }

      if (deletedCount > 0) {
        await batch.commit();
        console.log(`Cleaned up ${deletedCount} cache items`);
      }
    } catch (error) {
      console.error('Cache cleanup error:', error);
    }
  }
}

// Pre-configured cache instances for different use cases
export const cacheInstances = {
  // User data cache (5 minutes)
  user: new CacheService({
    ttl: 300,
    prefix: 'user',
    maxSize: 1000
  }),

  // Transaction cache (2 minutes)
  transaction: new CacheService({
    ttl: 120,
    prefix: 'transaction',
    maxSize: 500
  }),

  // KYC cache (10 minutes)
  kyc: new CacheService({
    ttl: 600,
    prefix: 'kyc',
    maxSize: 200
  }),

  // Partner cache (15 minutes)
  partner: new CacheService({
    ttl: 900,
    prefix: 'partner',
    maxSize: 100
  }),

  // API response cache (1 minute)
  api: new CacheService({
    ttl: 60,
    prefix: 'api',
    maxSize: 2000
  }),

  // Rate limit cache (1 hour)
  rateLimit: new CacheService({
    ttl: 3600,
    prefix: 'rate_limit',
    maxSize: 5000
  })
};

// Convenience functions
export async function getCachedData<T>(
  cacheType: keyof typeof cacheInstances,
  key: string
): Promise<T | null> {
  const cache = cacheInstances[cacheType];
  return cache.get<T>(key);
}

export async function setCachedData<T>(
  cacheType: keyof typeof cacheInstances,
  key: string,
  data: T,
  ttl?: number
): Promise<void> {
  const cache = cacheInstances[cacheType];
  await cache.set(key, data, ttl);
}

export async function deleteCachedData(
  cacheType: keyof typeof cacheInstances,
  key: string
): Promise<void> {
  const cache = cacheInstances[cacheType];
  await cache.delete(key);
}

// Cache decorator for functions
export function cached<T extends (...args: any[]) => Promise<any>>(
  cacheType: keyof typeof cacheInstances,
  keyGenerator: (...args: Parameters<T>) => string,
  ttl?: number
) {
  return function (_target: any, _propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: Parameters<T>) {
      const cache = cacheInstances[cacheType];
      const key = keyGenerator(...args);

      // Try to get from cache first
      const cachedResult = await cache.get(key);
      if (cachedResult !== null) {
        return cachedResult;
      }

      // Execute the original method
      const result = await method.apply(this, args);

      // Cache the result
      await cache.set(key, result, ttl);

      return result;
    };
  };
} 