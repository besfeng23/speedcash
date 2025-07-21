export interface Metric {
  name: string;
  value: number;
  timestamp: Date;
  tags: Record<string, string>;
}

export interface Alert {
  id: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  timestamp: Date;
  metadata: Record<string, any>;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
}

export interface AlertRule {
  id: string;
  name: string;
  condition: (metrics: Metric[]) => boolean;
  severity: Alert['severity'];
  message: string;
  cooldownMinutes: number;
}

class Monitoring {
  private metrics: Metric[] = [];
  private alerts: Alert[] = [];
  private alertRules: AlertRule[] = [];
  private lastAlertTime: Record<string, number> = {};

  // Metric tracking
  recordMetric(name: string, value: number, tags: Record<string, string> = {}): void {
    const metric: Metric = {
      name,
      value,
      timestamp: new Date(),
      tags
    };
    
    this.metrics.push(metric);
    
    // Keep only last 1000 metrics to prevent memory issues
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
  }

  // Transaction metrics
  recordTransaction(operation: string, duration: number, success: boolean, userId?: string): void {
    this.recordMetric('transaction_duration', duration, {
      operation,
      success: success.toString(),
      userId: userId || 'unknown'
    });

    this.recordMetric('transaction_count', 1, {
      operation,
      success: success.toString(),
      userId: userId || 'unknown'
    });

    if (!success) {
      this.recordMetric('transaction_error_count', 1, {
        operation,
        userId: userId || 'unknown'
      });
    }
  }

  // API metrics
  recordApiCall(method: string, path: string, statusCode: number, duration: number, userId?: string): void {
    this.recordMetric('api_duration', duration, {
      method,
      path,
      statusCode: statusCode.toString(),
      userId: userId || 'unknown'
    });

    this.recordMetric('api_count', 1, {
      method,
      path,
      statusCode: statusCode.toString(),
      userId: userId || 'unknown'
    });

    if (statusCode >= 400) {
      this.recordMetric('api_error_count', 1, {
        method,
        path,
        statusCode: statusCode.toString(),
        userId: userId || 'unknown'
      });
    }
  }

  // Performance metrics
  recordPerformance(operation: string, duration: number, userId?: string): void {
    this.recordMetric('performance_duration', duration, {
      operation,
      userId: userId || 'unknown'
    });
  }

  // Error metrics
  recordError(error: Error, context: string, userId?: string): void {
    this.recordMetric('error_count', 1, {
      error_type: error.name,
      context,
      userId: userId || 'unknown'
    });
  }

  // Get metrics
  getMetrics(name?: string, timeRange?: { start: Date; end: Date }): Metric[] {
    let filtered = this.metrics;

    if (name) {
      filtered = filtered.filter(m => m.name === name);
    }

    if (timeRange) {
      filtered = filtered.filter(m => 
        m.timestamp >= timeRange.start && m.timestamp <= timeRange.end
      );
    }

    return filtered;
  }

  // Calculate statistics
  getMetricStats(name: string, timeRange?: { start: Date; end: Date }): {
    count: number;
    sum: number;
    average: number;
    min: number;
    max: number;
  } {
    const metrics = this.getMetrics(name, timeRange);
    
    if (metrics.length === 0) {
      return { count: 0, sum: 0, average: 0, min: 0, max: 0 };
    }

    const values = metrics.map(m => m.value);
    const sum = values.reduce((a, b) => a + b, 0);
    const average = sum / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);

    return { count: metrics.length, sum, average, min, max };
  }

  // Alert management
  addAlertRule(rule: AlertRule): void {
    this.alertRules.push(rule);
  }

  checkAlerts(): void {
    const now = Date.now();

    for (const rule of this.alertRules) {
      const lastAlert = this.lastAlertTime[rule.id] || 0;
      const cooldownMs = rule.cooldownMinutes * 60 * 1000;

      if (now - lastAlert > cooldownMs && rule.condition(this.metrics)) {
        this.createAlert(rule);
        this.lastAlertTime[rule.id] = now;
      }
    }
  }

  private createAlert(rule: AlertRule): void {
    const alert: Alert = {
      id: `${rule.id}_${Date.now()}`,
      severity: rule.severity,
      message: rule.message,
      timestamp: new Date(),
      metadata: {
        ruleId: rule.id,
        ruleName: rule.name
      },
      acknowledged: false
    };

    this.alerts.push(alert);
    
    // In production, this would send to an alerting service
    console.error(`ALERT [${rule.severity}]: ${rule.message}`);
  }

  getAlerts(acknowledged?: boolean): Alert[] {
    if (acknowledged === undefined) {
      return this.alerts;
    }
    return this.alerts.filter(a => a.acknowledged === acknowledged);
  }

  acknowledgeAlert(alertId: string, acknowledgedBy: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      alert.acknowledgedBy = acknowledgedBy;
      alert.acknowledgedAt = new Date();
    }
  }

  // Pre-configured alert rules
  setupDefaultAlertRules(): void {
    // High error rate alert
    this.addAlertRule({
      id: 'high_error_rate',
      name: 'High Error Rate',
      condition: (metrics) => {
        const recentMetrics = metrics.filter(m => 
          m.timestamp > new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
        );
        
        const errorCount = recentMetrics
          .filter(m => m.name === 'error_count' || m.name === 'transaction_error_count' || m.name === 'api_error_count')
          .reduce((sum, m) => sum + m.value, 0);
        
        const totalCount = recentMetrics
          .filter(m => m.name === 'transaction_count' || m.name === 'api_count')
          .reduce((sum, m) => sum + m.value, 0);
        
        return totalCount > 0 && (errorCount / totalCount) > 0.1; // 10% error rate
      },
      severity: 'HIGH',
      message: 'Error rate is above 10% in the last 5 minutes',
      cooldownMinutes: 5
    });

    // High latency alert
    this.addAlertRule({
      id: 'high_latency',
      name: 'High Latency',
      condition: (metrics) => {
        const recentMetrics = metrics.filter(m => 
          m.timestamp > new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
        );
        
        const latencyMetrics = recentMetrics.filter(m => 
          m.name === 'transaction_duration' || m.name === 'api_duration'
        );
        
        if (latencyMetrics.length === 0) return false;
        
        const avgLatency = latencyMetrics.reduce((sum, m) => sum + m.value, 0) / latencyMetrics.length;
        return avgLatency > 5000; // 5 seconds
      },
      severity: 'MEDIUM',
      message: 'Average response time is above 5 seconds',
      cooldownMinutes: 10
    });

    // No transactions alert
    this.addAlertRule({
      id: 'no_transactions',
      name: 'No Transactions',
      condition: (metrics) => {
        const recentMetrics = metrics.filter(m => 
          m.timestamp > new Date(Date.now() - 10 * 60 * 1000) // Last 10 minutes
        );
        
        const transactionCount = recentMetrics
          .filter(m => m.name === 'transaction_count')
          .reduce((sum, m) => sum + m.value, 0);
        
        return transactionCount === 0;
      },
      severity: 'LOW',
      message: 'No transactions in the last 10 minutes',
      cooldownMinutes: 15
    });
  }
}

// Create monitoring instance
export const monitoring = new Monitoring();

// Setup default alert rules
monitoring.setupDefaultAlertRules();

// Utility functions
export function recordTransaction(operation: string, duration: number, success: boolean, userId?: string): void {
  monitoring.recordTransaction(operation, duration, success, userId);
}

export function recordApiCall(method: string, path: string, statusCode: number, duration: number, userId?: string): void {
  monitoring.recordApiCall(method, path, statusCode, duration, userId);
}

export function recordError(error: Error, context: string, userId?: string): void {
  monitoring.recordError(error, context, userId);
}

export function checkAlerts(): void {
  monitoring.checkAlerts();
} 