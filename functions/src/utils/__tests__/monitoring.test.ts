import { monitoring } from '../monitoring';

// Mock Firebase Admin initialization
jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(),
  firestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      add: jest.fn().mockResolvedValue({ id: 'test-id' }),
      orderBy: jest.fn(() => ({
        limit: jest.fn(() => ({
          get: jest.fn().mockResolvedValue({ docs: [] })
        }))
      })),
      where: jest.fn(() => ({
        orderBy: jest.fn(() => ({
          limit: jest.fn(() => ({
            get: jest.fn().mockResolvedValue({ docs: [] })
          }))
        }))
      }))
    }))
  })),
  FieldValue: {
    serverTimestamp: jest.fn(() => ({ _methodName: 'serverTimestamp' }))
  }
}));

describe('Monitoring Service', () => {
  beforeEach(() => {
    // Clear any existing logs before each test
    jest.clearAllMocks();
  });

  describe('log', () => {
    it('should log entries to Firestore', async () => {
      const mockAdd = jest.fn().mockResolvedValue({ id: 'test-id' });
      const mockCollection = jest.fn().mockReturnValue({ add: mockAdd });
      const mockFirestore = jest.fn().mockReturnValue({ collection: mockCollection });
      
      // Mock the Firestore instance
      jest.doMock('firebase-admin', () => ({
        firestore: mockFirestore
      }));

      const testEntry = {
        timestamp: new Date().toISOString(),
        level: 'info' as const,
        message: 'Test log entry',
        data: { test: 'data' }
      };

      await monitoring.log(testEntry);

      expect(mockCollection).toHaveBeenCalledWith('system_logs');
      expect(mockAdd).toHaveBeenCalledWith(expect.objectContaining({
        ...testEntry,
        timestamp: expect.any(Object) // FieldValue.serverTimestamp()
      }));
    });

    it('should fallback to console logging on Firestore error', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const mockAdd = jest.fn().mockRejectedValue(new Error('Firestore error'));
      const mockCollection = jest.fn().mockReturnValue({ add: mockAdd });
      const mockFirestore = jest.fn().mockReturnValue({ collection: mockCollection });
      
      jest.doMock('firebase-admin', () => ({
        firestore: mockFirestore
      }));

      const testEntry = {
        timestamp: new Date().toISOString(),
        level: 'info' as const,
        message: 'Test log entry'
      };

      await monitoring.log(testEntry);

      expect(consoleSpy).toHaveBeenCalledWith('[INFO] Test log entry', '');
      consoleSpy.mockRestore();
    });
  });

  describe('logCorsRequest', () => {
    it('should log CORS request details', async () => {
      const mockLog = jest.spyOn(monitoring, 'log').mockResolvedValue();
      
      const mockReq = {
        method: 'OPTIONS',
        url: '/test',
        headers: {
          origin: 'https://test.com',
          'user-agent': 'test-agent'
        },
        ip: '127.0.0.1'
      };

      const mockRes = {};

      await monitoring.logCorsRequest(mockReq, mockRes, true);

      expect(mockLog).toHaveBeenCalledWith(expect.objectContaining({
        level: 'info',
        message: 'CORS success',
        data: {
          method: 'OPTIONS',
          url: '/test',
          success: true
        },
        origin: 'https://test.com',
        userAgent: 'test-agent',
        ip: '127.0.0.1'
      }));

      mockLog.mockRestore();
    });
  });

  describe('logApiCall', () => {
    it('should log successful API calls', async () => {
      const mockLog = jest.spyOn(monitoring, 'log').mockResolvedValue();
      
      const mockReq = {
        method: 'POST',
        headers: {
          origin: 'https://test.com',
          'user-agent': 'test-agent'
        },
        ip: '127.0.0.1'
      };

      await monitoring.logApiCall(mockReq, 'testAction', true);

      expect(mockLog).toHaveBeenCalledWith(expect.objectContaining({
        level: 'info',
        message: 'API call successful: testAction',
        data: {
          action: 'testAction',
          method: 'POST',
          success: true
        }
      }));

      mockLog.mockRestore();
    });

    it('should log failed API calls with error details', async () => {
      const mockLog = jest.spyOn(monitoring, 'log').mockResolvedValue();
      
      const mockReq = {
        method: 'POST',
        headers: {
          origin: 'https://test.com',
          'user-agent': 'test-agent'
        },
        ip: '127.0.0.1'
      };

      const testError = new Error('Test error');

      await monitoring.logApiCall(mockReq, 'testAction', false, testError);

      expect(mockLog).toHaveBeenCalledWith(expect.objectContaining({
        level: 'error',
        message: 'API call failed: testAction',
        data: {
          action: 'testAction',
          method: 'POST',
          success: false,
          error: 'Test error'
        }
      }));

      mockLog.mockRestore();
    });
  });

  describe('logError', () => {
    it('should log error details', async () => {
      const mockLog = jest.spyOn(monitoring, 'log').mockResolvedValue();
      
      const testError = new Error('Test error message');
      const context = { action: 'test', userId: 'user123' };

      await monitoring.logError(testError, context);

      expect(mockLog).toHaveBeenCalledWith(expect.objectContaining({
        level: 'error',
        message: 'Test error message',
        data: {
          error: testError.stack,
          context: { action: 'test', userId: 'user123' }
        }
      }));

      mockLog.mockRestore();
    });
  });

  describe('logPerformance', () => {
    it('should log performance metrics', async () => {
      const mockLog = jest.spyOn(monitoring, 'log').mockResolvedValue();
      
      const operation = 'testOperation';
      const duration = 150;
      const metadata = { userId: 'user123' };

      await monitoring.logPerformance(operation, duration, metadata);

      expect(mockLog).toHaveBeenCalledWith(expect.objectContaining({
        level: 'info',
        message: 'Performance: testOperation',
        data: {
          operation: 'testOperation',
          duration: 150,
          metadata: { userId: 'user123' }
        }
      }));

      mockLog.mockRestore();
    });
  });

  describe('getRecentLogs', () => {
    it('should retrieve recent logs from Firestore', async () => {
      const mockDocs = [
        { id: '1', data: () => ({ message: 'log1', timestamp: new Date() }) },
        { id: '2', data: () => ({ message: 'log2', timestamp: new Date() }) }
      ];
      
      const mockGet = jest.fn().mockResolvedValue({ docs: mockDocs });
      const mockLimit = jest.fn().mockReturnValue({ get: mockGet });
      const mockOrderBy = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockCollection = jest.fn().mockReturnValue({ orderBy: mockOrderBy });
      const mockFirestore = jest.fn().mockReturnValue({ collection: mockCollection });
      
      jest.doMock('firebase-admin', () => ({
        firestore: mockFirestore
      }));

      const logs = await monitoring.getRecentLogs(50);

      expect(mockCollection).toHaveBeenCalledWith('system_logs');
      expect(mockOrderBy).toHaveBeenCalledWith('timestamp', 'desc');
      expect(mockLimit).toHaveBeenCalledWith(50);
      expect(logs).toHaveLength(2);
      expect(logs[0]).toHaveProperty('id', '1');
      expect(logs[1]).toHaveProperty('id', '2');
    });

    it('should handle Firestore errors gracefully', async () => {
      const mockGet = jest.fn().mockRejectedValue(new Error('Firestore error'));
      const mockLimit = jest.fn().mockReturnValue({ get: mockGet });
      const mockOrderBy = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockCollection = jest.fn().mockReturnValue({ orderBy: mockOrderBy });
      const mockFirestore = jest.fn().mockReturnValue({ collection: mockCollection });
      
      jest.doMock('firebase-admin', () => ({
        firestore: mockFirestore
      }));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const logs = await monitoring.getRecentLogs();

      expect(consoleSpy).toHaveBeenCalledWith('Failed to get recent logs:', expect.any(Error));
      expect(logs).toEqual([]);

      consoleSpy.mockRestore();
    });
  });

  describe('getCorsLogs', () => {
    it('should retrieve CORS-specific logs', async () => {
      const mockDocs = [
        { id: '1', data: () => ({ message: 'CORS success', timestamp: new Date() }) },
        { id: '2', data: () => ({ message: 'CORS failure', timestamp: new Date() }) }
      ];
      
      const mockGet = jest.fn().mockResolvedValue({ docs: mockDocs });
      const mockLimit = jest.fn().mockReturnValue({ get: mockGet });
      const mockOrderBy = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockWhere = jest.fn().mockReturnValue({ orderBy: mockOrderBy });
      const mockCollection = jest.fn().mockReturnValue({ where: mockWhere });
      const mockFirestore = jest.fn().mockReturnValue({ collection: mockCollection });
      
      jest.doMock('firebase-admin', () => ({
        firestore: mockFirestore
      }));

      const logs = await monitoring.getCorsLogs(25);

      expect(mockCollection).toHaveBeenCalledWith('system_logs');
      expect(mockWhere).toHaveBeenCalledWith('message', '==', 'CORS success');
      expect(mockOrderBy).toHaveBeenCalledWith('timestamp', 'desc');
      expect(mockLimit).toHaveBeenCalledWith(25);
      expect(logs).toHaveLength(2);
    });
  });
}); 