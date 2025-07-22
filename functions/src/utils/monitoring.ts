import * as admin from 'firebase-admin';

interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  data?: any;
  userId?: string;
  action?: string;
  origin?: string;
  userAgent?: string;
  ip?: string;
}

class MonitoringService {
  private db: admin.firestore.Firestore;

  constructor() {
    this.db = admin.firestore();
  }

  async log(entry: LogEntry) {
    try {
      await this.db.collection('system_logs').add({
        ...entry,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (error) {
      console.error('Failed to log to Firestore:', error);
      // Fallback to console logging
      console.log(`[${entry.level.toUpperCase()}] ${entry.message}`, entry.data || '');
    }
  }

  async logCorsRequest(req: any, _res: any, success: boolean) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: success ? 'info' : 'warn',
      message: `CORS ${success ? 'success' : 'failure'}`,
      data: {
        method: req.method,
        url: req.url,
        success,
        timestamp: new Date().toISOString(),
      },
      origin: req.headers.origin,
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.connection?.remoteAddress,
    };

    await this.log(entry);
  }

  async logApiCall(req: any, action: string, success: boolean, error?: any) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: success ? 'info' : 'error',
      message: `API call ${success ? 'successful' : 'failed'}: ${action}`,
      data: {
        action,
        method: req.method,
        success,
        error: error?.message || error,
        timestamp: new Date().toISOString(),
      },
      origin: req.headers.origin,
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.connection?.remoteAddress,
    };

    await this.log(entry);
  }

  async logError(error: any, context?: any) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'error',
      message: error.message || 'Unknown error',
      data: {
        error: error.stack || error,
        context,
        timestamp: new Date().toISOString(),
      },
    };

    await this.log(entry);
  }

  async logPerformance(operation: string, duration: number, metadata?: any) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'info',
      message: `Performance: ${operation}`,
      data: {
        operation,
        duration,
        metadata,
        timestamp: new Date().toISOString(),
      },
    };

    await this.log(entry);
  }

  // Method to get recent logs for debugging
  async getRecentLogs(limit: number = 100) {
    try {
      const snapshot = await this.db
        .collection('system_logs')
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Failed to get recent logs:', error);
      return [];
    }
  }

  // Method to get CORS-related logs specifically
  async getCorsLogs(limit: number = 50) {
    try {
      const snapshot = await this.db
        .collection('system_logs')
        .where('message', '==', 'CORS success')
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Failed to get CORS logs:', error);
      return [];
    }
  }
}

export const monitoring = new MonitoringService(); 