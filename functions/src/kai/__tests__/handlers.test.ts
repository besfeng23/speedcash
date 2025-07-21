import { askAuthenticatedKaiHandler } from '../handlers';
import { HttpsError } from 'firebase-functions/v2/https';

// Mock the dynamic import of node-fetch
jest.mock('node-fetch', () => ({
  __esModule: true,
  default: jest.fn()
}));

const mockFetch = require('node-fetch').default;

describe('KAI Handlers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset environment variables
    delete process.env.OPENAI_API_KEY;
  });

  describe('askAuthenticatedKaiHandler', () => {
    const mockContext = {
      auth: {
        uid: 'test-user-id',
        token: {
          role: 'user'
        }
      }
    };

    it('should throw error when user is not authenticated', async () => {
      const context = { auth: null };
      const data = {
        query: 'Hello',
        conversationHistory: []
      };

      await expect(askAuthenticatedKaiHandler(data, context))
        .rejects
        .toThrow(new HttpsError('unauthenticated', 'User must be authenticated.'));
    });

    it('should throw error when OpenAI API key is not set', async () => {
      const data = {
        query: 'Hello',
        conversationHistory: []
      };

      await expect(askAuthenticatedKaiHandler(data, mockContext))
        .rejects
        .toThrow(new HttpsError('failed-precondition', 'OpenAI API key is not set.'));
    });

    it('should successfully process a query with OpenAI API', async () => {
      // Set up environment variable
      process.env.OPENAI_API_KEY = 'test-api-key';

      // Mock successful OpenAI response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: [{
            message: {
              content: 'Hello! I am CPay\'s AI assistant. How can I help you today?'
            }
          }]
        })
      });

      const data = {
        query: 'Hello',
        conversationHistory: []
      };

      const result = await askAuthenticatedKaiHandler(data, mockContext);

      expect(result).toEqual({
        reply: 'Hello! I am CPay\'s AI assistant. How can I help you today?',
        intent: 'GENERAL_QUERY'
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-api-key'
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
              { role: 'system', content: "You are CPay's helpful AI assistant. You help users with their financial transactions, wallet management, and general questions about the CPay platform." },
              { role: 'user', content: 'Hello' }
            ],
            max_tokens: 256,
            temperature: 0.7
          })
        })
      );
    });

    it('should handle conversation history correctly', async () => {
      process.env.OPENAI_API_KEY = 'test-api-key';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: [{
            message: {
              content: 'I remember our previous conversation about wallets.'
            }
          }]
        })
      });

      const data = {
        query: 'What did we talk about?',
        conversationHistory: [
          { sender: 'USER', text: 'Tell me about wallets' },
          { sender: 'AI', text: 'Wallets are digital storage for your money.' }
        ]
      };

      const result = await askAuthenticatedKaiHandler(data, mockContext);

      expect(result.reply).toBe('I remember our previous conversation about wallets.');

      // Verify that conversation history was included in the request
      const callArgs = mockFetch.mock.calls[0][1];
      const requestBody = JSON.parse(callArgs.body);
      
      expect(requestBody.messages).toEqual([
        { role: 'system', content: "You are CPay's helpful AI assistant. You help users with their financial transactions, wallet management, and general questions about the CPay platform." },
        { role: 'user', content: 'Tell me about wallets' },
        { role: 'assistant', content: 'Wallets are digital storage for your money.' },
        { role: 'user', content: 'What did we talk about?' }
      ]);
    });

    it('should handle OpenAI API errors gracefully', async () => {
      process.env.OPENAI_API_KEY = 'test-api-key';

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: jest.fn().mockResolvedValue('Unauthorized')
      });

      const data = {
        query: 'Hello',
        conversationHistory: []
      };

      await expect(askAuthenticatedKaiHandler(data, mockContext))
        .rejects
        .toThrow(new HttpsError('internal', 'Failed to get response from OpenAI: 401 Unauthorized'));
    });

    it('should handle empty OpenAI response gracefully', async () => {
      process.env.OPENAI_API_KEY = 'test-api-key';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: []
        })
      });

      const data = {
        query: 'Hello',
        conversationHistory: []
      };

      const result = await askAuthenticatedKaiHandler(data, mockContext);

      expect(result).toEqual({
        reply: 'Sorry, I could not generate a response.',
        intent: 'GENERAL_QUERY'
      });
    });

    it('should validate input schema correctly', async () => {
      process.env.OPENAI_API_KEY = 'test-api-key';

      const invalidData = {
        // Missing query field
        conversationHistory: []
      };

      await expect(askAuthenticatedKaiHandler(invalidData, mockContext))
        .rejects
        .toThrow();
    });
  });
}); 