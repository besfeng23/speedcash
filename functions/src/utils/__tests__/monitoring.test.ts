import { monitoring, recordTransaction, recordApiCall, recordError, checkAlerts } from '../monitoring';

describe('Monitoring', () => {
  beforeEach(() => {
    // Reset monitoring state for each test
    (monitoring as any).metrics = [];
    (monitoring as any).alerts = [];
    (monitoring as any).lastAlertTime = {};
  });

  describe('Metric Recording', () => {
    it('should record transaction metrics', () => {
      recordTransaction('p2p_transfer', 1500, true, 'user123');
      
      const metrics = monitoring.getMetrics('transaction_duration');
      expect(metrics).toHaveLength(1);
      expect(metrics[0].value).toBe(1500);
      expect(metrics[0].tags.operation).toBe('p2p_transfer');
      expect(metrics[0].tags.success).toBe('true');
      expect(metrics[0].tags.userId).toBe('user123');
    });

    it('should record API call metrics', () => {
      recordApiCall('POST', '/api/transactions', 200, 800, 'user123');
      
      const metrics = monitoring.getMetrics('api_duration');
      expect(metrics).toHaveLength(1);
      expect(metrics[0].value).toBe(800);
      expect(metrics[0].tags.method).toBe('POST');
      expect(metrics[0].tags.path).toBe('/api/transactions');
      expect(metrics[0].tags.statusCode).toBe('200');
    });

    it('should record error metrics', () => {
      const error = new Error('Database connection failed');
      recordError(error, 'database_operation', 'user123');
      
      const metrics = monitoring.getMetrics('error_count');
      expect(metrics).toHaveLength(1);
      expect(metrics[0].value).toBe(1);
      expect(metrics[0].tags.error_type).toBe('Error');
      expect(metrics[0].tags.context).toBe('database_operation');
    });

    it('should record multiple metrics for a single transaction', () => {
      recordTransaction('p2p_transfer', 1500, true, 'user123');
      
      const durationMetrics = monitoring.getMetrics('transaction_duration');
      const countMetrics = monitoring.getMetrics('transaction_count');
      const errorMetrics = monitoring.getMetrics('transaction_error_count');
      
      expect(durationMetrics).toHaveLength(1);
      expect(countMetrics).toHaveLength(1);
      expect(errorMetrics).toHaveLength(0); // No error for successful transaction
    });

    it('should record error metrics for failed transactions', () => {
      recordTransaction('p2p_transfer', 1500, false, 'user123');
      
      const errorMetrics = monitoring.getMetrics('transaction_error_count');
      expect(errorMetrics).toHaveLength(1);
      expect(errorMetrics[0].value).toBe(1);
    });
  });

  describe('Metric Filtering', () => {
    beforeEach(() => {
      // Add some test metrics
      recordTransaction('p2p_transfer', 1000, true, 'user123');
      recordTransaction('cash_in', 2000, true, 'user456');
      recordApiCall('POST', '/api/transactions', 200, 500, 'user123');
      recordApiCall('GET', '/api/balance', 200, 300, 'user456');
    });

    it('should filter metrics by name', () => {
      const transactionMetrics = monitoring.getMetrics('transaction_duration');
      const apiMetrics = monitoring.getMetrics('api_duration');
      
      expect(transactionMetrics).toHaveLength(2);
      expect(apiMetrics).toHaveLength(2);
    });

    it('should filter metrics by time range', () => {
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
      const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);
      
      // Add an old metric
      (monitoring as any).metrics.push({
        name: 'transaction_duration',
        value: 5000,
        timestamp: tenMinutesAgo,
        tags: { operation: 'old_transaction' }
      });
      
      const recentMetrics = monitoring.getMetrics('transaction_duration', {
        start: fiveMinutesAgo,
        end: now
      });
      
      expect(recentMetrics).toHaveLength(2); // Only the recent ones
    });
  });

  describe('Statistics Calculation', () => {
    beforeEach(() => {
      recordTransaction('p2p_transfer', 1000, true, 'user123');
      recordTransaction('p2p_transfer', 2000, true, 'user456');
      recordTransaction('p2p_transfer', 1500, true, 'user789');
    });

    it('should calculate correct statistics', () => {
      const stats = monitoring.getMetricStats('transaction_duration');
      
      expect(stats.count).toBe(3);
      expect(stats.sum).toBe(4500);
      expect(stats.average).toBe(1500);
      expect(stats.min).toBe(1000);
      expect(stats.max).toBe(2000);
    });

    it('should handle empty metrics', () => {
      const stats = monitoring.getMetricStats('nonexistent_metric');
      
      expect(stats.count).toBe(0);
      expect(stats.sum).toBe(0);
      expect(stats.average).toBe(0);
      expect(stats.min).toBe(0);
      expect(stats.max).toBe(0);
    });
  });

  describe('Alert Management', () => {
    it('should create alerts when conditions are met', () => {
      // Add a custom alert rule
      monitoring.addAlertRule({
        id: 'test_alert',
        name: 'Test Alert',
        condition: (metrics) => metrics.length > 0,
        severity: 'HIGH',
        message: 'Test alert triggered',
        cooldownMinutes: 1
      });
      
      // Add a metric to trigger the alert
      recordTransaction('p2p_transfer', 1000, true, 'user123');
      
      checkAlerts();
      
      const alerts = monitoring.getAlerts(false); // Unacknowledged alerts
      expect(alerts).toHaveLength(1);
      expect(alerts[0].message).toBe('Test alert triggered');
      expect(alerts[0].severity).toBe('HIGH');
    });

    it('should respect alert cooldown', () => {
      monitoring.addAlertRule({
        id: 'test_alert',
        name: 'Test Alert',
        condition: (metrics) => metrics.length > 0,
        severity: 'HIGH',
        message: 'Test alert triggered',
        cooldownMinutes: 1
      });
      
      recordTransaction('p2p_transfer', 1000, true, 'user123');
      
      // Trigger alert twice
      checkAlerts();
      checkAlerts();
      
      const alerts = monitoring.getAlerts(false);
      expect(alerts).toHaveLength(1); // Should only create one alert due to cooldown
    });

    it('should acknowledge alerts', () => {
      monitoring.addAlertRule({
        id: 'test_alert',
        name: 'Test Alert',
        condition: (metrics) => metrics.length > 0,
        severity: 'HIGH',
        message: 'Test alert triggered',
        cooldownMinutes: 1
      });
      
      recordTransaction('p2p_transfer', 1000, true, 'user123');
      checkAlerts();
      
      const alerts = monitoring.getAlerts(false);
      expect(alerts).toHaveLength(1);
      
      monitoring.acknowledgeAlert(alerts[0].id, 'admin_user');
      
      const acknowledgedAlerts = monitoring.getAlerts(true);
      expect(acknowledgedAlerts).toHaveLength(1);
      expect(acknowledgedAlerts[0].acknowledgedBy).toBe('admin_user');
      expect(acknowledgedAlerts[0].acknowledgedAt).toBeDefined();
    });
  });

  describe('Default Alert Rules', () => {
    beforeEach(() => {
      // Reset and setup default rules
      (monitoring as any).alertRules = [];
      monitoring.setupDefaultAlertRules();
    });

    it('should trigger high error rate alert', () => {
      // Add many errors to trigger the alert
      for (let i = 0; i < 10; i++) {
        recordTransaction('p2p_transfer', 1000, false, 'user123'); // Failed transactions
      }
      for (let i = 0; i < 5; i++) {
        recordTransaction('p2p_transfer', 1000, true, 'user123'); // Successful transactions
      }
      
      checkAlerts();
      
      const alerts = monitoring.getAlerts(false);
      const errorRateAlert = alerts.find(a => a.message.includes('Error rate is above 10%'));
      expect(errorRateAlert).toBeDefined();
    });

    it('should trigger high latency alert', () => {
      // Add slow operations
      for (let i = 0; i < 5; i++) {
        recordTransaction('p2p_transfer', 6000, true, 'user123'); // 6 seconds
      }
      
      checkAlerts();
      
      const alerts = monitoring.getAlerts(false);
      const latencyAlert = alerts.find(a => a.message.includes('Average response time is above 5 seconds'));
      expect(latencyAlert).toBeDefined();
    });

    it('should trigger no transactions alert', () => {
      // Don't add any transactions
      checkAlerts();
      
      const alerts = monitoring.getAlerts(false);
      const noTransactionsAlert = alerts.find(a => a.message.includes('No transactions in the last 10 minutes'));
      expect(noTransactionsAlert).toBeDefined();
    });
  });

  describe('Memory Management', () => {
    it('should limit metrics to prevent memory issues', () => {
      // Add more than 1000 metrics
      for (let i = 0; i < 1100; i++) {
        recordTransaction('p2p_transfer', 1000, true, 'user123');
      }
      
      const metrics = monitoring.getMetrics();
      expect(metrics.length).toBeLessThanOrEqual(1000);
    });
  });
}); 