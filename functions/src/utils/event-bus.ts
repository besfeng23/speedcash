import * as admin from 'firebase-admin';

const db = admin.firestore();

export interface EventData {
  id: string;
  type: string;
  data: any;
  source: string;
  timestamp: number;
  priority: 'low' | 'normal' | 'high' | 'critical';
  processed: boolean;
  processedAt?: number;
  error?: string;
}

export interface EventHandler<_T = any> {
  (event: EventData): Promise<void>;
}

export interface EventBusConfig {
  name: string;
  maxRetries: number;
  retryDelay: number; // seconds
  cleanupAfter: number; // seconds
}

export class EventBus {
  private config: EventBusConfig;
  private handlers: Map<string, EventHandler[]> = new Map();
  private isProcessing: boolean = false;

  constructor(config: EventBusConfig) {
    this.config = config;
  }

  /**
   * Register an event handler
   */
  on(eventType: string, handler: EventHandler): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)!.push(handler);
  }

  /**
   * Remove an event handler
   */
  off(eventType: string, handler: EventHandler): void {
    const handlers = this.handlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Emit an event
   */
  async emit<T = any>(
    type: string,
    data: T,
    options: {
      source?: string;
      priority?: 'low' | 'normal' | 'high' | 'critical';
    } = {}
  ): Promise<string> {
    const eventId = `${this.config.name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();

    const event: EventData = {
      id: eventId,
      type,
      data,
      source: options.source || 'system',
      timestamp: now,
      priority: options.priority || 'normal',
      processed: false
    };

    await db.collection(`events_${this.config.name}`).doc(eventId).set(event);

    // Start processing if not already running
    if (!this.isProcessing) {
      this.startProcessing();
    }

    return eventId;
  }

  /**
   * Get event by ID
   */
  async getEvent(eventId: string): Promise<EventData | null> {
    try {
      const doc = await db.collection(`events_${this.config.name}`).doc(eventId).get();
      return doc.exists ? doc.data() as EventData : null;
    } catch (error) {
      console.error('Get event error:', error);
      return null;
    }
  }

  /**
   * Start processing events
   */
  private async startProcessing(): Promise<void> {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;
    console.log(`Starting event processor for ${this.config.name}`);

    while (this.isProcessing) {
      try {
        await this.processNextEvent();
        await this.sleep(1000); // Wait 1 second between checks
      } catch (error) {
        console.error('Event processing error:', error);
        await this.sleep(5000); // Wait 5 seconds on error
      }
    }
  }

  /**
   * Stop processing events
   */
  stopProcessing(): void {
    this.isProcessing = false;
    console.log(`Stopping event processor for ${this.config.name}`);
  }

  /**
   * Process the next available event
   */
  private async processNextEvent(): Promise<void> {
    const snapshot = await db.collection(`events_${this.config.name}`)
      .where('processed', '==', false)
      .orderBy('priority', 'desc')
      .orderBy('timestamp', 'asc')
      .limit(1)
      .get();

    if (snapshot.empty) {
      return;
    }

    const eventDoc = snapshot.docs[0];
    const event = eventDoc.data() as EventData;

    // Mark event as processing
    await eventDoc.ref.update({
      processed: true,
      processedAt: Date.now()
    });

    // Process the event
    await this.processEvent(event);
  }

  /**
   * Process a specific event
   */
  private async processEvent(event: EventData): Promise<void> {
    const handlers = this.handlers.get(event.type);
    if (!handlers || handlers.length === 0) {
      console.warn(`No handlers registered for event type: ${event.type}`);
      return;
    }

    const promises = handlers.map(async (handler) => {
      try {
        await handler(event);
      } catch (error) {
        console.error(`Event handler error for ${event.type}:`, error);
        // Update event with error
        await db.collection(`events_${this.config.name}`).doc(event.id).update({
          error: error instanceof Error ? error.message : String(error)
        });
      }
    });

    await Promise.all(promises);
  }

  /**
   * Get event bus statistics
   */
  async getStats(): Promise<{
    total: number;
    processed: number;
    unprocessed: number;
    withErrors: number;
  }> {
    try {
      const stats = {
        total: 0,
        processed: 0,
        unprocessed: 0,
        withErrors: 0
      };

      // Get total events
      const totalSnapshot = await db.collection(`events_${this.config.name}`).count().get();
      stats.total = totalSnapshot.data().count;

      // Get processed events
      const processedSnapshot = await db.collection(`events_${this.config.name}`)
        .where('processed', '==', true)
        .count()
        .get();
      stats.processed = processedSnapshot.data().count;

      // Get unprocessed events
      const unprocessedSnapshot = await db.collection(`events_${this.config.name}`)
        .where('processed', '==', false)
        .count()
        .get();
      stats.unprocessed = unprocessedSnapshot.data().count;

      // Get events with errors
      const errorSnapshot = await db.collection(`events_${this.config.name}`)
        .where('error', '!=', null)
        .count()
        .get();
      stats.withErrors = errorSnapshot.data().count;

      return stats;
    } catch (error) {
      console.error('Get event bus stats error:', error);
      return {
        total: 0,
        processed: 0,
        unprocessed: 0,
        withErrors: 0
      };
    }
  }

  /**
   * Clean up old processed events
   */
  async cleanup(): Promise<void> {
    try {
      const cutoff = Date.now() - (this.config.cleanupAfter * 1000);
      
      const snapshot = await db.collection(`events_${this.config.name}`)
        .where('processed', '==', true)
        .where('processedAt', '<', cutoff)
        .limit(100)
        .get();

      if (!snapshot.empty) {
        const batch = db.batch();
        snapshot.docs.forEach(doc => {
          batch.delete(doc.ref);
        });
        await batch.commit();
        console.log(`Cleaned up ${snapshot.size} old events from event bus ${this.config.name}`);
      }
    } catch (error) {
      console.error('Event bus cleanup error:', error);
    }
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Pre-configured event bus instances
export const eventBuses = {
  // System events (user actions, transactions, etc.)
  system: new EventBus({
    name: 'system',
    maxRetries: 3,
    retryDelay: 60,
    cleanupAfter: 86400 // 24 hours
  }),

  // User events (login, logout, profile updates)
  user: new EventBus({
    name: 'user',
    maxRetries: 2,
    retryDelay: 30,
    cleanupAfter: 604800 // 7 days
  }),

  // Transaction events (payments, transfers, etc.)
  transaction: new EventBus({
    name: 'transaction',
    maxRetries: 5,
    retryDelay: 120,
    cleanupAfter: 2592000 // 30 days
  }),

  // KYC events (document submissions, approvals)
  kyc: new EventBus({
    name: 'kyc',
    maxRetries: 2,
    retryDelay: 300,
    cleanupAfter: 2592000 // 30 days
  }),

  // Partner events (onboarding, status changes)
  partner: new EventBus({
    name: 'partner',
    maxRetries: 3,
    retryDelay: 180,
    cleanupAfter: 604800 // 7 days
  }),

  // Analytics events (metrics, tracking)
  analytics: new EventBus({
    name: 'analytics',
    maxRetries: 1,
    retryDelay: 600,
    cleanupAfter: 604800 // 7 days
  })
};

// Convenience functions
export async function emitEvent<T = any>(
  busType: keyof typeof eventBuses,
  eventType: string,
  data: T,
  options?: {
    source?: string;
    priority?: 'low' | 'normal' | 'high' | 'critical';
  }
): Promise<string> {
  const bus = eventBuses[busType];
  return bus.emit(eventType, data, options);
}

export async function getEvent(
  busType: keyof typeof eventBuses,
  eventId: string
): Promise<EventData | null> {
  const bus = eventBuses[busType];
  return bus.getEvent(eventId);
}

export async function getEventBusStats(
  busType: keyof typeof eventBuses
): Promise<{
  total: number;
  processed: number;
  unprocessed: number;
  withErrors: number;
}> {
  const bus = eventBuses[busType];
  return bus.getStats();
}

// Event type constants
export const EventTypes = {
  // User events
  USER_REGISTERED: 'user.registered',
  USER_LOGIN: 'user.login',
  USER_LOGOUT: 'user.logout',
  USER_PROFILE_UPDATED: 'user.profile.updated',
  USER_2FA_ENABLED: 'user.2fa.enabled',
  USER_2FA_DISABLED: 'user.2fa.disabled',

  // Transaction events
  TRANSACTION_CREATED: 'transaction.created',
  TRANSACTION_COMPLETED: 'transaction.completed',
  TRANSACTION_FAILED: 'transaction.failed',
  TRANSACTION_CANCELLED: 'transaction.cancelled',
  PAYMENT_PROCESSED: 'payment.processed',
  PAYMENT_FAILED: 'payment.failed',

  // KYC events
  KYC_SUBMITTED: 'kyc.submitted',
  KYC_APPROVED: 'kyc.approved',
  KYC_REJECTED: 'kyc.rejected',
  KYC_DOCUMENT_ADDED: 'kyc.document.added',

  // Partner events
  PARTNER_REGISTERED: 'partner.registered',
  PARTNER_APPROVED: 'partner.approved',
  PARTNER_SUSPENDED: 'partner.suspended',
  PARTNER_KYB_SUBMITTED: 'partner.kyb.submitted',

  // System events
  SYSTEM_MAINTENANCE: 'system.maintenance',
  SYSTEM_ERROR: 'system.error',
  RATE_LIMIT_EXCEEDED: 'system.rate_limit.exceeded',
  WEBHOOK_RECEIVED: 'system.webhook.received',

  // Analytics events
  PAGE_VIEW: 'analytics.page.view',
  FEATURE_USED: 'analytics.feature.used',
  ERROR_OCCURRED: 'analytics.error.occurred'
} as const; 