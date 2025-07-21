import { Logger, LogLevel, createLogger } from '../logger';

// Mock console.log to capture log output
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});

describe('Logger', () => {
  beforeEach(() => {
    mockConsoleLog.mockClear();
  });

  afterAll(() => {
    mockConsoleLog.mockRestore();
  });

  describe('Log Levels', () => {
    it('should log at INFO level by default', () => {
      const logger = new Logger('test');
      
      logger.debug('debug message');
      logger.info('info message');
      
      expect(mockConsoleLog).toHaveBeenCalledTimes(1);
      const logCall = JSON.parse(mockConsoleLog.mock.calls[0][0]);
      expect(logCall.message).toBe('info message');
    });

    it('should respect custom log level', () => {
      const logger = new Logger('test', LogLevel.DEBUG);
      
      logger.debug('debug message');
      logger.info('info message');
      
      expect(mockConsoleLog).toHaveBeenCalledTimes(2);
    });

    it('should not log below threshold', () => {
      const logger = new Logger('test', LogLevel.ERROR);
      
      logger.debug('debug message');
      logger.info('info message');
      logger.warn('warn message');
      logger.error('error message');
      
      expect(mockConsoleLog).toHaveBeenCalledTimes(1);
      const logCall = JSON.parse(mockConsoleLog.mock.calls[0][0]);
      expect(logCall.message).toBe('error message');
    });
  });

  describe('Data Sanitization', () => {
    it('should sanitize sensitive fields', () => {
      const logger = new Logger('test');
      
      logger.info('test message', {
        userId: 'user123',
        password: 'secret123',
        token: 'jwt_token',
        accountNumber: '1234567890'
      });
      
      const logCall = JSON.parse(mockConsoleLog.mock.calls[0][0]);
      expect(logCall.context.password).toBe('[REDACTED]');
      expect(logCall.context.token).toBe('[REDACTED]');
      expect(logCall.context.accountNumber).toBe('[REDACTED]');
      expect(logCall.context.userId).toBe('user123'); // Should not be redacted
    });

    it('should handle nested objects', () => {
      const logger = new Logger('test');
      
      logger.info('test message', {
        user: {
          id: 'user123',
          password: 'secret123'
        },
        transaction: {
          amount: 100,
          accountNumber: '1234567890'
        }
      });
      
      const logCall = JSON.parse(mockConsoleLog.mock.calls[0][0]);
      expect(logCall.context.user.password).toBe('[REDACTED]');
      expect(logCall.context.transaction.accountNumber).toBe('[REDACTED]');
      expect(logCall.context.user.id).toBe('user123');
      expect(logCall.context.transaction.amount).toBe(100);
    });
  });

  describe('Transaction Logging', () => {
    it('should log transaction start', () => {
      const logger = new Logger('test');
      
      logger.transactionStart('tx123', 'p2p_transfer', 'user123');
      
      const logCall = JSON.parse(mockConsoleLog.mock.calls[0][0]);
      expect(logCall.message).toBe('Transaction started: p2p_transfer');
      expect(logCall.context.transactionId).toBe('tx123');
      expect(logCall.context.operation).toBe('p2p_transfer');
      expect(logCall.context.userId).toBe('user123');
    });

    it('should log transaction success', () => {
      const logger = new Logger('test');
      
      logger.transactionSuccess('tx123', 'p2p_transfer', 'user123');
      
      const logCall = JSON.parse(mockConsoleLog.mock.calls[0][0]);
      expect(logCall.message).toBe('Transaction completed: p2p_transfer');
      expect(logCall.context.transactionId).toBe('tx123');
    });

    it('should log transaction error', () => {
      const logger = new Logger('test');
      const error = new Error('Insufficient funds');
      
      logger.transactionError('tx123', 'p2p_transfer', error, 'user123');
      
      const logCall = JSON.parse(mockConsoleLog.mock.calls[0][0]);
      expect(logCall.message).toBe('Transaction failed: p2p_transfer');
      expect(logCall.error.name).toBe('Error');
      expect(logCall.error.message).toBe('Insufficient funds');
    });
  });

  describe('API Logging', () => {
    it('should log API request', () => {
      const logger = new Logger('test');
      
      logger.apiRequest('POST', '/api/transactions', 'user123');
      
      const logCall = JSON.parse(mockConsoleLog.mock.calls[0][0]);
      expect(logCall.message).toBe('API Request: POST /api/transactions');
      expect(logCall.context.method).toBe('POST');
      expect(logCall.context.path).toBe('/api/transactions');
      expect(logCall.context.userId).toBe('user123');
    });

    it('should log API response with appropriate level', () => {
      const logger = new Logger('test');
      
      logger.apiResponse('POST', '/api/transactions', 200, 'user123');
      logger.apiResponse('POST', '/api/transactions', 500, 'user123');
      
      const logCalls = mockConsoleLog.mock.calls.map(call => JSON.parse(call[0]));
      expect(logCalls[0].level).toBe(LogLevel.INFO); // 200 response
      expect(logCalls[1].level).toBe(LogLevel.WARN); // 500 response
    });
  });

  describe('Performance Logging', () => {
    it('should log performance with appropriate level', () => {
      const logger = new Logger('test');
      
      logger.performance('database_query', 100, 'user123');
      logger.performance('external_api_call', 6000, 'user123');
      
      const logCalls = mockConsoleLog.mock.calls.map(call => JSON.parse(call[0]));
      expect(logCalls[0].level).toBe(LogLevel.INFO); // Fast operation
      expect(logCalls[1].level).toBe(LogLevel.WARN); // Slow operation
    });
  });

  describe('Error Logging', () => {
    it('should log errors with stack trace', () => {
      const logger = new Logger('test');
      const error = new Error('Database connection failed');
      
      logger.error('Failed to connect to database', { userId: 'user123' }, error);
      
      const logCall = JSON.parse(mockConsoleLog.mock.calls[0][0]);
      expect(logCall.message).toBe('Failed to connect to database');
      expect(logCall.error.name).toBe('Error');
      expect(logCall.error.message).toBe('Database connection failed');
      expect(logCall.error.stack).toBeDefined();
    });
  });

  describe('createLogger', () => {
    it('should create logger with custom service name', () => {
      const logger = createLogger('custom_service');
      
      logger.info('test message');
      
      const logCall = JSON.parse(mockConsoleLog.mock.calls[0][0]);
      expect(logCall.service).toBe('custom_service');
    });

    it('should create logger with custom level', () => {
      const logger = createLogger('test', LogLevel.DEBUG);
      
      logger.debug('debug message');
      
      expect(mockConsoleLog).toHaveBeenCalledTimes(1);
      const logCall = JSON.parse(mockConsoleLog.mock.calls[0][0]);
      expect(logCall.message).toBe('debug message');
    });
  });
}); 