import { HttpsError } from 'firebase-functions/v2/https';
import { database } from './database';
import { cacheInstances } from './cache';
import { queueInstances } from './queue';
import { eventBuses } from './event-bus';

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: number;
  uptime: number;
  version: string;
  checks: {
    database: HealthCheckItem;
    cache: HealthCheckItem;
    queue: HealthCheckItem;
    eventBus: HealthCheckItem;
    memory: HealthCheckItem;
    disk: HealthCheckItem;
    externalServices: HealthCheckItem;
  };
  summary: {
    totalChecks: number;
    passedChecks: number;
    failedChecks: number;
    responseTime: number;
  };
}

export interface HealthCheckItem {
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  error?: string;
  details?: any;
}

export interface HealthCheckConfig {
  timeout: number; // milliseconds
  cacheTimeout: number; // seconds
  enableDetailedChecks: boolean;
}

export class HealthCheckService {
  private static instance: HealthCheckService;
  private config: HealthCheckConfig;
  private startTime: number;
  private lastCheck: HealthCheckResult | null = null;

  private constructor() {
    this.config = {
      timeout: 10000, // 10 seconds
      cacheTimeout: 60, // 1 minute
      enableDetailedChecks: true
    };
    this.startTime = Date.now();
  }

  static getInstance(): HealthCheckService {
    if (!HealthCheckService.instance) {
      HealthCheckService.instance = new HealthCheckService();
    }
    return HealthCheckService.instance;
  }

  /**
   * Perform a comprehensive health check
   */
  async performHealthCheck(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const timestamp = Date.now();
    const uptime = timestamp - this.startTime;

    try {
      // Perform all health checks in parallel
      const [
        databaseCheck,
        cacheCheck,
        queueCheck,
        eventBusCheck,
        memoryCheck,
        diskCheck,
        externalServicesCheck
      ] = await Promise.allSettled([
        this.checkDatabase(),
        this.checkCacheHealth(),
        this.checkQueue(),
        this.checkEventBus(),
        this.checkMemory(),
        this.checkDisk(),
        this.checkExternalServices()
      ]);

      const checks = {
        database: this.getResult(databaseCheck),
        cache: this.getResult(cacheCheck),
        queue: this.getResult(queueCheck),
        eventBus: this.getResult(eventBusCheck),
        memory: this.getResult(memoryCheck),
        disk: this.getResult(diskCheck),
        externalServices: this.getResult(externalServicesCheck)
      };

      const responseTime = Date.now() - startTime;
      const status = this.determineOverallStatus(checks);
      const summary = this.calculateSummary(checks, responseTime);

      const result: HealthCheckResult = {
        status,
        timestamp,
        uptime,
        version: process.env.APP_VERSION || '1.0.0',
        checks,
        summary
      };

      this.lastCheck = result;
      return result;
    } catch (error) {
      console.error('Health check failed:', error);
      throw new HttpsError('internal', 'Health check failed');
    }
  }

  /**
   * Get cached health check result
   */
  async getCachedHealthCheck(): Promise<HealthCheckResult | null> {
    if (!this.lastCheck) {
      return null;
    }

    const now = Date.now();
    const cacheAge = now - this.lastCheck.timestamp;

    if (cacheAge < this.config.cacheTimeout * 1000) {
      return this.lastCheck;
    }

    return null;
  }

  /**
   * Check database health
   */
  private async checkDatabase(): Promise<HealthCheckItem> {
    const startTime = Date.now();

    try {
      const stats = await database.getDatabaseStats();
      const responseTime = Date.now() - startTime;

      return {
        status: 'healthy',
        responseTime,
        details: {
          collections: stats.collections.length,
          totalDocuments: stats.totalDocuments,
          cacheSize: stats.cacheSize
        }
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        status: 'unhealthy',
        responseTime,
        error: error instanceof Error ? error.message : 'Database check failed'
      };
    }
  }

  /**
   * Check cache health
   */
  private async checkCacheHealth(): Promise<HealthCheckItem> {
    const startTime = Date.now();

    try {
      const cacheStats = await Promise.all(
        Object.entries(cacheInstances).map(async ([name, cache]) => {
          const stats = await cache.getStats();
          return { name, stats };
        })
      );

      const responseTime = Date.now() - startTime;
      const totalItems = cacheStats.reduce((sum, { stats }) => sum + stats.totalItems, 0);
      const averageHitRate = cacheStats.reduce((sum, { stats }) => sum + stats.hitRate, 0) / cacheStats.length;

      return {
        status: averageHitRate > 0.5 ? 'healthy' : 'degraded',
        responseTime,
        details: {
          totalItems,
          averageHitRate,
          cacheInstances: cacheStats.length
        }
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        status: 'unhealthy',
        responseTime,
        error: error instanceof Error ? error.message : 'Cache check failed'
      };
    }
  }

  /**
   * Check queue health
   */
  private async checkQueue(): Promise<HealthCheckItem> {
    const startTime = Date.now();

    try {
      const queueStats = await Promise.all(
        Object.entries(queueInstances).map(async ([name, queue]) => {
          const stats = await queue.getStats();
          return { name, stats };
        })
      );

      const responseTime = Date.now() - startTime;
      const totalJobs = queueStats.reduce((sum, { stats }) => sum + stats.total, 0);
      const failedJobs = queueStats.reduce((sum, { stats }) => sum + stats.failed, 0);
      const failureRate = totalJobs > 0 ? failedJobs / totalJobs : 0;

      return {
        status: failureRate < 0.1 ? 'healthy' : failureRate < 0.3 ? 'degraded' : 'unhealthy',
        responseTime,
        details: {
          totalJobs,
          failedJobs,
          failureRate,
          queueInstances: queueStats.length
        }
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        status: 'unhealthy',
        responseTime,
        error: error instanceof Error ? error.message : 'Queue check failed'
      };
    }
  }

  /**
   * Check event bus health
   */
  private async checkEventBus(): Promise<HealthCheckItem> {
    const startTime = Date.now();

    try {
      const eventBusStats = await Promise.all(
        Object.entries(eventBuses).map(async ([name, bus]) => {
          const stats = await bus.getStats();
          return { name, stats };
        })
      );

      const responseTime = Date.now() - startTime;
      const totalEvents = eventBusStats.reduce((sum, { stats }) => sum + stats.total, 0);
      const eventsWithErrors = eventBusStats.reduce((sum, { stats }) => sum + stats.withErrors, 0);
      const errorRate = totalEvents > 0 ? eventsWithErrors / totalEvents : 0;

      return {
        status: errorRate < 0.05 ? 'healthy' : errorRate < 0.2 ? 'degraded' : 'unhealthy',
        responseTime,
        details: {
          totalEvents,
          eventsWithErrors,
          errorRate,
          eventBusInstances: eventBusStats.length
        }
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        status: 'unhealthy',
        responseTime,
        error: error instanceof Error ? error.message : 'Event bus check failed'
      };
    }
  }

  /**
   * Check memory usage
   */
  private async checkMemory(): Promise<HealthCheckItem> {
    const startTime = Date.now();

    try {
      const memUsage = process.memoryUsage();
      const responseTime = Date.now() - startTime;

      const heapUsedPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;

      return {
        status: heapUsedPercent < 80 ? 'healthy' : heapUsedPercent < 95 ? 'degraded' : 'unhealthy',
        responseTime,
        details: {
          heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + ' MB',
          heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + ' MB',
          heapUsedPercent: Math.round(heapUsedPercent * 100) / 100,
          rss: Math.round(memUsage.rss / 1024 / 1024) + ' MB',
          external: Math.round(memUsage.external / 1024 / 1024) + ' MB'
        }
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        status: 'unhealthy',
        responseTime,
        error: error instanceof Error ? error.message : 'Memory check failed'
      };
    }
  }

  /**
   * Check disk usage (simplified for serverless)
   */
  private async checkDisk(): Promise<HealthCheckItem> {
    const startTime = Date.now();

    try {
      const responseTime = Date.now() - startTime;

      return {
        status: 'healthy',
        responseTime,
        details: {
          environment: 'serverless',
          note: 'Disk space managed by platform'
        }
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        status: 'unhealthy',
        responseTime,
        error: error instanceof Error ? error.message : 'Disk check failed'
      };
    }
  }

  /**
   * Check external services
   */
  private async checkExternalServices(): Promise<HealthCheckItem> {
    const startTime = Date.now();

    try {
      const services = [
        { name: 'Mailchimp', url: 'https://api.mailchimp.com/3.0/ping' },
        { name: 'Firebase', url: 'https://firebase.google.com' }
      ];

      const serviceChecks = await Promise.allSettled(
        services.map(async (service) => {
          const response = await fetch(service.url, { 
            method: 'HEAD'
          });
          return {
            name: service.name,
            status: response.ok ? 'healthy' : 'unhealthy',
            responseTime: Date.now() - startTime
          };
        })
      );

      const responseTime = Date.now() - startTime;
      const healthyServices = serviceChecks.filter(
        check => check.status === 'fulfilled' && check.value.status === 'healthy'
      ).length;
      const totalServices = services.length;
      const healthRate = totalServices > 0 ? healthyServices / totalServices : 0;

      return {
        status: healthRate === 1 ? 'healthy' : healthRate > 0.5 ? 'degraded' : 'unhealthy',
        responseTime,
        details: {
          healthyServices,
          totalServices,
          healthRate,
          services: serviceChecks.map((check, index) => ({
            name: services[index].name,
            status: check.status === 'fulfilled' ? check.value.status : 'unhealthy'
          }))
        }
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        status: 'unhealthy',
        responseTime,
        error: error instanceof Error ? error.message : 'External services check failed'
      };
    }
  }

  /**
   * Get result from Promise.allSettled
   */
  private getResult<T>(promiseResult: PromiseSettledResult<T>): HealthCheckItem {
    if (promiseResult.status === 'fulfilled') {
      return promiseResult.value as HealthCheckItem;
    } else {
      return {
        status: 'unhealthy',
        responseTime: 0,
        error: promiseResult.reason instanceof Error ? promiseResult.reason.message : 'Check failed'
      };
    }
  }

  /**
   * Determine overall health status
   */
  private determineOverallStatus(checks: HealthCheckResult['checks']): 'healthy' | 'degraded' | 'unhealthy' {
    const checkValues = Object.values(checks);
    const unhealthyCount = checkValues.filter(check => check.status === 'unhealthy').length;
    const degradedCount = checkValues.filter(check => check.status === 'degraded').length;

    if (unhealthyCount > 0) {
      return 'unhealthy';
    } else if (degradedCount > 0) {
      return 'degraded';
    } else {
      return 'healthy';
    }
  }

  /**
   * Calculate summary statistics
   */
  private calculateSummary(checks: HealthCheckResult['checks'], totalResponseTime: number): HealthCheckResult['summary'] {
    const checkValues = Object.values(checks);
    const totalChecks = checkValues.length;
    const passedChecks = checkValues.filter(check => check.status === 'healthy').length;
    const failedChecks = checkValues.filter(check => check.status === 'unhealthy').length;

    return {
      totalChecks,
      passedChecks,
      failedChecks,
      responseTime: Math.round(totalResponseTime)
    };
  }

  /**
   * Clear health check cache
   */
  clearCache(): void {
    this.lastCheck = null;
  }

  /**
   * Get health check configuration
   */
  getConfig(): HealthCheckConfig {
    return { ...this.config };
  }

  /**
   * Update health check configuration
   */
  updateConfig(config: Partial<HealthCheckConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

// Export singleton instance
export const healthCheck = HealthCheckService.getInstance();

// Convenience functions
export async function performHealthCheck(): Promise<HealthCheckResult> {
  return healthCheck.performHealthCheck();
}

export async function getCachedHealthCheck(): Promise<HealthCheckResult | null> {
  return healthCheck.getCachedHealthCheck();
}

export function clearHealthCheckCache(): void {
  healthCheck.clearCache();
} 