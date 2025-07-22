import * as admin from 'firebase-admin';

const db = admin.firestore();

export interface JobData {
  id: string;
  type: string;
  data: any;
  priority: 'low' | 'normal' | 'high' | 'critical';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'retry';
  attempts: number;
  maxAttempts: number;
  createdAt: number;
  scheduledFor?: number;
  startedAt?: number;
  completedAt?: number;
  error?: string;
  result?: any;
}

export interface QueueConfig {
  name: string;
  maxConcurrency: number;
  defaultMaxAttempts: number;
  retryDelay: number; // seconds
  cleanupAfter: number; // seconds
}

export type JobHandler<T = any> = (job: JobData) => Promise<T>;

export class QueueService {
  private config: QueueConfig;
  private handlers: Map<string, JobHandler> = new Map();
  private isProcessing: boolean = false;
  private processingJobs: Set<string> = new Set();

  constructor(config: QueueConfig) {
    this.config = config;
  }

  /**
   * Register a job handler
   */
  registerHandler(jobType: string, handler: JobHandler): void {
    this.handlers.set(jobType, handler);
  }

  /**
   * Add a job to the queue
   */
  async addJob<T = any>(
    type: string,
    data: T,
    options: {
      priority?: 'low' | 'normal' | 'high' | 'critical';
      maxAttempts?: number;
      scheduledFor?: number;
    } = {}
  ): Promise<string> {
    const jobId = `${this.config.name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();

    const job: JobData = {
      id: jobId,
      type,
      data,
      priority: options.priority || 'normal',
      status: 'pending',
      attempts: 0,
      maxAttempts: options.maxAttempts || this.config.defaultMaxAttempts,
      createdAt: now,
      scheduledFor: options.scheduledFor || now
    };

    await db.collection(`queues_${this.config.name}`).doc(jobId).set(job);

    // Start processing if not already running
    if (!this.isProcessing) {
      this.startProcessing();
    }

    return jobId;
  }

  /**
   * Get job status
   */
  async getJob(jobId: string): Promise<JobData | null> {
    try {
      const doc = await db.collection(`queues_${this.config.name}`).doc(jobId).get();
      return doc.exists ? doc.data() as JobData : null;
    } catch (error) {
      console.error('Get job error:', error);
      return null;
    }
  }

  /**
   * Cancel a job
   */
  async cancelJob(jobId: string): Promise<boolean> {
    try {
      const job = await this.getJob(jobId);
      if (!job || job.status !== 'pending') {
        return false;
      }

      await db.collection(`queues_${this.config.name}`).doc(jobId).update({
        status: 'failed',
        error: 'Job cancelled',
        completedAt: Date.now()
      });

      return true;
    } catch (error) {
      console.error('Cancel job error:', error);
      return false;
    }
  }

  /**
   * Start processing jobs
   */
  private async startProcessing(): Promise<void> {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;
    console.log(`Starting queue processor for ${this.config.name}`);

    while (this.isProcessing) {
      try {
        await this.processNextJob();
        await this.sleep(1000); // Wait 1 second between checks
      } catch (error) {
        console.error('Queue processing error:', error);
        await this.sleep(5000); // Wait 5 seconds on error
      }
    }
  }

  /**
   * Stop processing jobs
   */
  stopProcessing(): void {
    this.isProcessing = false;
    console.log(`Stopping queue processor for ${this.config.name}`);
  }

  /**
   * Process the next available job
   */
  private async processNextJob(): Promise<void> {
    // Check if we can process more jobs
    if (this.processingJobs.size >= this.config.maxConcurrency) {
      return;
    }

    const now = Date.now();
    const snapshot = await db.collection(`queues_${this.config.name}`)
      .where('status', '==', 'pending')
      .where('scheduledFor', '<=', now)
      .orderBy('priority', 'desc')
      .orderBy('createdAt', 'asc')
      .limit(1)
      .get();

    if (snapshot.empty) {
      return;
    }

    const jobDoc = snapshot.docs[0];
    const job = jobDoc.data() as JobData;

    // Check if we can process this job
    if (this.processingJobs.has(job.id)) {
      return;
    }

    // Mark job as processing
    this.processingJobs.add(job.id);
    await jobDoc.ref.update({
      status: 'processing',
      startedAt: now,
      attempts: admin.firestore.FieldValue.increment(1)
    });

    // Process the job
    this.processJob(job).finally(() => {
      this.processingJobs.delete(job.id);
    });
  }

  /**
   * Process a specific job
   */
  private async processJob(job: JobData): Promise<void> {
    const handler = this.handlers.get(job.type);
    if (!handler) {
      await this.failJob(job, `No handler registered for job type: ${job.type}`);
      return;
    }

    try {
      const result = await handler(job);
      await this.completeJob(job, result);
    } catch (error) {
      console.error(`Job ${job.id} failed:`, error);
      await this.handleJobFailure(job, error);
    }
  }

  /**
   * Handle job failure
   */
  private async handleJobFailure(job: JobData, error: any): Promise<void> {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const currentAttempts = job.attempts + 1;

    if (currentAttempts >= job.maxAttempts) {
      await this.failJob(job, errorMessage);
    } else {
      await this.retryJob(job, errorMessage);
    }
  }

  /**
   * Retry a failed job
   */
  private async retryJob(job: JobData, error: string): Promise<void> {
    const retryDelay = this.config.retryDelay * 1000; // Convert to milliseconds
    const scheduledFor = Date.now() + retryDelay;

    await db.collection(`queues_${this.config.name}`).doc(job.id).update({
      status: 'pending',
      scheduledFor,
      error: `${error} (Attempt ${job.attempts + 1}/${job.maxAttempts})`
    });
  }

  /**
   * Mark job as completed
   */
  private async completeJob(job: JobData, result: any): Promise<void> {
    await db.collection(`queues_${this.config.name}`).doc(job.id).update({
      status: 'completed',
      result,
      completedAt: Date.now()
    });
  }

  /**
   * Mark job as failed
   */
  private async failJob(job: JobData, error: string): Promise<void> {
    await db.collection(`queues_${this.config.name}`).doc(job.id).update({
      status: 'failed',
      error,
      completedAt: Date.now()
    });
  }

  /**
   * Get queue statistics
   */
  async getStats(): Promise<{
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    total: number;
  }> {
    try {
      const stats = {
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
        total: 0
      };

      const statuses = ['pending', 'processing', 'completed', 'failed'];
      
      for (const status of statuses) {
        const snapshot = await db.collection(`queues_${this.config.name}`)
          .where('status', '==', status)
          .count()
          .get();
        
        stats[status as keyof typeof stats] = snapshot.data().count;
        stats.total += snapshot.data().count;
      }

      return stats;
    } catch (error) {
      console.error('Get queue stats error:', error);
      return {
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
        total: 0
      };
    }
  }

  /**
   * Clean up old completed jobs
   */
  async cleanup(): Promise<void> {
    try {
      const cutoff = Date.now() - (this.config.cleanupAfter * 1000);
      
      const snapshot = await db.collection(`queues_${this.config.name}`)
        .where('status', 'in', ['completed', 'failed'])
        .where('completedAt', '<', cutoff)
        .limit(100)
        .get();

      if (!snapshot.empty) {
        const batch = db.batch();
        snapshot.docs.forEach(doc => {
          batch.delete(doc.ref);
        });
        await batch.commit();
        console.log(`Cleaned up ${snapshot.size} old jobs from queue ${this.config.name}`);
      }
    } catch (error) {
      console.error('Queue cleanup error:', error);
    }
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Pre-configured queue instances
export const queueInstances = {
  // Email queue for sending emails
  email: new QueueService({
    name: 'email',
    maxConcurrency: 5,
    defaultMaxAttempts: 3,
    retryDelay: 60, // 1 minute
    cleanupAfter: 86400 // 24 hours
  }),

  // Transaction queue for processing payments
  transaction: new QueueService({
    name: 'transaction',
    maxConcurrency: 10,
    defaultMaxAttempts: 5,
    retryDelay: 30, // 30 seconds
    cleanupAfter: 604800 // 7 days
  }),

  // KYC queue for document processing
  kyc: new QueueService({
    name: 'kyc',
    maxConcurrency: 3,
    defaultMaxAttempts: 2,
    retryDelay: 300, // 5 minutes
    cleanupAfter: 2592000 // 30 days
  }),

  // Webhook queue for external notifications
  webhook: new QueueService({
    name: 'webhook',
    maxConcurrency: 20,
    defaultMaxAttempts: 3,
    retryDelay: 120, // 2 minutes
    cleanupAfter: 86400 // 24 hours
  }),

  // Analytics queue for data processing
  analytics: new QueueService({
    name: 'analytics',
    maxConcurrency: 2,
    defaultMaxAttempts: 1,
    retryDelay: 600, // 10 minutes
    cleanupAfter: 604800 // 7 days
  })
};

// Convenience functions
export async function addJobToQueue<T = any>(
  queueType: keyof typeof queueInstances,
  jobType: string,
  data: T,
  options?: {
    priority?: 'low' | 'normal' | 'high' | 'critical';
    maxAttempts?: number;
    scheduledFor?: number;
  }
): Promise<string> {
  const queue = queueInstances[queueType];
  return queue.addJob(jobType, data, options);
}

export async function getJobStatus(
  queueType: keyof typeof queueInstances,
  jobId: string
): Promise<JobData | null> {
  const queue = queueInstances[queueType];
  return queue.getJob(jobId);
}

export async function cancelJobInQueue(
  queueType: keyof typeof queueInstances,
  jobId: string
): Promise<boolean> {
  const queue = queueInstances[queueType];
  return queue.cancelJob(jobId);
}

export async function getQueueStats(
  queueType: keyof typeof queueInstances
): Promise<{
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  total: number;
}> {
  const queue = queueInstances[queueType];
  return queue.getStats();
} 