import { HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

const db = admin.firestore();

export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: {
    field: string;
    direction: 'asc' | 'desc';
  };
  where?: Array<{
    field: string;
    operator: '==' | '!=' | '<' | '<=' | '>' | '>=' | 'in' | 'not-in' | 'array-contains' | 'array-contains-any';
    value: any;
  }>;
  select?: string[];
}

export interface TransactionOptions {
  maxAttempts?: number;
  timeout?: number; // milliseconds
}

export interface BatchOptions {
  maxOperations?: number;
  timeout?: number; // milliseconds
}

export class DatabaseService {
  private static instance: DatabaseService;
  private queryCache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();

  private constructor() {}

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  /**
   * Get a document by ID
   */
  async getDocument<T = any>(collection: string, id: string): Promise<T | null> {
    try {
      const doc = await db.collection(collection).doc(id).get();
      return doc.exists ? doc.data() as T : null;
    } catch (error) {
      console.error(`Error getting document ${collection}/${id}:`, error);
      throw new HttpsError('internal', 'Database error');
    }
  }

  /**
   * Get multiple documents by IDs
   */
  async getDocuments<T = any>(collection: string, ids: string[]): Promise<(T | null)[]> {
    try {
      if (ids.length === 0) return [];

      const batchSize = 10; // Firestore batch limit
      const results: (T | null)[] = [];

      for (let i = 0; i < ids.length; i += batchSize) {
        const batch = ids.slice(i, i + batchSize);
        const refs = batch.map(id => db.collection(collection).doc(id));
        const docs = await db.getAll(...refs);
        
        results.push(...docs.map(doc => doc.exists ? doc.data() as T : null));
      }

      return results;
    } catch (error) {
      console.error(`Error getting documents from ${collection}:`, error);
      throw new HttpsError('internal', 'Database error');
    }
  }

  /**
   * Query documents with options
   */
  async queryDocuments<T = any>(collection: string, options: QueryOptions = {}): Promise<T[]> {
    try {
      let query: admin.firestore.Query = db.collection(collection);

      // Apply where conditions
      if (options.where) {
        for (const condition of options.where) {
          query = query.where(condition.field, condition.operator, condition.value);
        }
      }

      // Apply ordering
      if (options.orderBy) {
        query = query.orderBy(options.orderBy.field, options.orderBy.direction);
      }

      // Apply limit
      if (options.limit) {
        query = query.limit(options.limit);
      }

      // Apply offset (using cursor-based pagination)
      if (options.offset) {
        // Note: Firestore doesn't support offset, this is a simplified implementation
        // In production, use cursor-based pagination
        console.warn('Offset pagination is not efficient in Firestore. Consider using cursor-based pagination.');
      }

      // Apply field selection
      if (options.select) {
        query = query.select(...options.select);
      }

      const snapshot = await query.get();
      return snapshot.docs.map(doc => doc.data() as T);
    } catch (error) {
      console.error(`Error querying documents from ${collection}:`, error);
      throw new HttpsError('internal', 'Database error');
    }
  }

  /**
   * Create a document
   */
  async createDocument<T = any>(collection: string, data: T, id?: string): Promise<string> {
    try {
      const docRef = id 
        ? db.collection(collection).doc(id)
        : db.collection(collection).doc();

      await docRef.set({
        ...data,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      return docRef.id;
    } catch (error) {
      console.error(`Error creating document in ${collection}:`, error);
      throw new HttpsError('internal', 'Database error');
    }
  }

  /**
   * Update a document
   */
  async updateDocument<T = any>(collection: string, id: string, data: Partial<T>): Promise<void> {
    try {
      await db.collection(collection).doc(id).update({
        ...data,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    } catch (error) {
      console.error(`Error updating document ${collection}/${id}:`, error);
      throw new HttpsError('internal', 'Database error');
    }
  }

  /**
   * Delete a document
   */
  async deleteDocument(collection: string, id: string): Promise<void> {
    try {
      await db.collection(collection).doc(id).delete();
    } catch (error) {
      console.error(`Error deleting document ${collection}/${id}:`, error);
      throw new HttpsError('internal', 'Database error');
    }
  }

  /**
   * Run a transaction
   */
  async runTransaction<T = any>(
    updateFunction: (transaction: admin.firestore.Transaction) => Promise<T>,
    options: TransactionOptions = {}
  ): Promise<T> {
    const maxAttempts = options.maxAttempts || 5;

    let lastError: any;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await db.runTransaction(updateFunction, {
          maxAttempts: 1 // We handle retries manually
        });
      } catch (error) {
        lastError = error;
        console.warn(`Transaction attempt ${attempt} failed:`, error);
        
        if (attempt < maxAttempts) {
          // Wait before retry (exponential backoff)
          await this.sleep(Math.min(1000 * Math.pow(2, attempt - 1), 5000));
        }
      }
    }

    console.error(`Transaction failed after ${maxAttempts} attempts:`, lastError);
    throw new HttpsError('internal', 'Transaction failed');
  }

  /**
   * Run a batch operation
   */
  async runBatch(
    operations: Array<{
      type: 'create' | 'update' | 'delete';
      collection: string;
      id?: string;
      data?: any;
    }>,
    options: BatchOptions = {}
  ): Promise<void> {
    try {
      const maxOperations = options.maxOperations || 500; // Firestore batch limit

      // Split operations into batches
      for (let i = 0; i < operations.length; i += maxOperations) {
        const batch = operations.slice(i, i + maxOperations);
        const writeBatch = db.batch();

        for (const operation of batch) {
          const docRef = operation.id 
            ? db.collection(operation.collection).doc(operation.id)
            : db.collection(operation.collection).doc();

          switch (operation.type) {
            case 'create':
              writeBatch.set(docRef, {
                ...operation.data,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
              });
              break;
            case 'update':
              writeBatch.update(docRef, {
                ...operation.data,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
              });
              break;
            case 'delete':
              writeBatch.delete(docRef);
              break;
          }
        }

        await writeBatch.commit();
      }
    } catch (error) {
      console.error('Batch operation failed:', error);
      throw new HttpsError('internal', 'Batch operation failed');
    }
  }

  /**
   * Count documents
   */
  async countDocuments(collection: string, where?: Array<{
    field: string;
    operator: '==' | '!=' | '<' | '<=' | '>' | '>=' | 'in' | 'not-in' | 'array-contains' | 'array-contains-any';
    value: any;
  }>): Promise<number> {
    try {
      let query: admin.firestore.Query = db.collection(collection);

      if (where) {
        for (const condition of where) {
          query = query.where(condition.field, condition.operator, condition.value);
        }
      }

      const snapshot = await query.count().get();
      return snapshot.data().count;
    } catch (error) {
      console.error(`Error counting documents in ${collection}:`, error);
      throw new HttpsError('internal', 'Database error');
    }
  }

  /**
   * Check if document exists
   */
  async documentExists(collection: string, id: string): Promise<boolean> {
    try {
      const doc = await db.collection(collection).doc(id).get();
      return doc.exists;
    } catch (error) {
      console.error(`Error checking document existence ${collection}/${id}:`, error);
      throw new HttpsError('internal', 'Database error');
    }
  }

  /**
   * Get document with metadata
   */
  async getDocumentWithMetadata<T = any>(collection: string, id: string): Promise<{
    data: T | null;
    metadata: {
      exists: boolean;
      createTime?: admin.firestore.Timestamp;
      updateTime?: admin.firestore.Timestamp;
      readTime: admin.firestore.Timestamp;
    };
  }> {
    try {
      const doc = await db.collection(collection).doc(id).get();
      return {
        data: doc.exists ? doc.data() as T : null,
        metadata: {
          exists: doc.exists,
          createTime: doc.createTime,
          updateTime: doc.updateTime,
          readTime: doc.readTime
        }
      };
    } catch (error) {
      console.error(`Error getting document with metadata ${collection}/${id}:`, error);
      throw new HttpsError('internal', 'Database error');
    }
  }

  /**
   * Listen to document changes
   */
  onDocumentChange<T = any>(
    collection: string,
    id: string,
    callback: (data: T | null, metadata: any) => void
  ): () => void {
    const unsubscribe = db.collection(collection).doc(id)
      .onSnapshot((doc) => {
        const data = doc.exists ? doc.data() as T : null;
        const metadata = {
          exists: doc.exists,
          createTime: doc.createTime,
          updateTime: doc.updateTime,
          readTime: doc.readTime
        };
        callback(data, metadata);
      }, (error) => {
        console.error(`Error listening to document ${collection}/${id}:`, error);
      });

    return unsubscribe;
  }

  /**
   * Listen to collection changes
   */
  onCollectionChange<T = any>(
    collection: string,
    callback: (docs: T[]) => void,
    options: QueryOptions = {}
  ): () => void {
    let query: admin.firestore.Query = db.collection(collection);

    if (options.where) {
      for (const condition of options.where) {
        query = query.where(condition.field, condition.operator, condition.value);
      }
    }

    if (options.orderBy) {
      query = query.orderBy(options.orderBy.field, options.orderBy.direction);
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    const unsubscribe = query.onSnapshot((snapshot) => {
      const docs = snapshot.docs.map(doc => doc.data() as T);
      callback(docs);
    }, (error) => {
      console.error(`Error listening to collection ${collection}:`, error);
    });

    return unsubscribe;
  }

  /**
   * Clear query cache
   */
  clearQueryCache(): void {
    this.queryCache.clear();
  }

  /**
   * Get database statistics
   */
  async getDatabaseStats(): Promise<{
    collections: string[];
    totalDocuments: number;
    cacheSize: number;
  }> {
    try {
      const collections = await db.listCollections();
      const collectionNames = collections.map(col => col.id);
      
      let totalDocuments = 0;
      for (const collection of collections) {
        const snapshot = await collection.count().get();
        totalDocuments += snapshot.data().count;
      }

      return {
        collections: collectionNames,
        totalDocuments,
        cacheSize: this.queryCache.size
      };
    } catch (error) {
      console.error('Error getting database stats:', error);
      throw new HttpsError('internal', 'Database error');
    }
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const database = DatabaseService.getInstance();

// Convenience functions
export async function getDocument<T = any>(collection: string, id: string): Promise<T | null> {
  return database.getDocument<T>(collection, id);
}

export async function getDocuments<T = any>(collection: string, ids: string[]): Promise<(T | null)[]> {
  return database.getDocuments<T>(collection, ids);
}

export async function queryDocuments<T = any>(collection: string, options?: QueryOptions): Promise<T[]> {
  return database.queryDocuments<T>(collection, options);
}

export async function createDocument<T = any>(collection: string, data: T, id?: string): Promise<string> {
  return database.createDocument<T>(collection, data, id);
}

export async function updateDocument<T = any>(collection: string, id: string, data: Partial<T>): Promise<void> {
  return database.updateDocument<T>(collection, id, data);
}

export async function deleteDocument(collection: string, id: string): Promise<void> {
  return database.deleteDocument(collection, id);
}

export async function runTransaction<T = any>(
  updateFunction: (transaction: admin.firestore.Transaction) => Promise<T>,
  options?: TransactionOptions
): Promise<T> {
  return database.runTransaction(updateFunction, options);
}

export async function runBatch(
  operations: Array<{
    type: 'create' | 'update' | 'delete';
    collection: string;
    id?: string;
    data?: any;
  }>,
  options?: BatchOptions
): Promise<void> {
  return database.runBatch(operations, options);
} 