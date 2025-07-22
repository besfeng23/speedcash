

import { HttpsError } from 'firebase-functions/v2/https';
import { z } from 'zod';
// import { askAiAssistant } from '../ai/flows/chat-assistant'; // TODO: Create AI flow

// Use dynamic import for node-fetch to avoid ES module issues
const fetch = async (url: string, options: any) => {
  const { default: fetchModule } = await import('node-fetch');
  return fetchModule(url, options);
};

const AiAssistantInputSchema = z.object({
  query: z.string(),
  conversationHistory: z.array(z.object({
    sender: z.enum(['USER', 'AI']),
    text: z.string(),
  })).optional(),
});

// Fallback responses for when OpenAI API is not available
function generateFallbackResponse(query: string): string {
  const responses: { [key: string]: string } = {
    'hello': "Hello! I'm Kai, your CPay AI assistant. How can I help you today?",
    'hi': "Hi there! I'm here to help with your CPay questions.",
    'help': "I can help you with CPay features like sending money, checking balances, transaction history, and more. What would you like to know?",
    'balance': "To check your balance, you can view it on your dashboard or in the mobile app. Your current balance is displayed prominently at the top of your account.",
    'send': "To send money, go to the Send page, enter the recipient's details and amount, then confirm the transaction.",
    'transaction': "You can view your transaction history in the History section of your account. All your past transactions are listed there with details.",
    'kyc': "KYC (Know Your Customer) verification helps secure your account. Upload your valid ID and other required documents in the KYC section.",
    'support': "For additional support, you can create a ticket through the Help & Support section, or contact our customer service team.",
    'withdraw': "To withdraw funds, go to the Withdraw section, select your bank, enter the amount, and confirm the transaction.",
    'deposit': "You can deposit funds through various methods including bank transfers, payment gateways, or cash-in partners.",
  };

  // Find the most relevant response
  for (const [keyword, response] of Object.entries(responses)) {
    if (query.includes(keyword)) {
      return response;
    }
  }

  // Default response
  return "I'm here to help with your CPay questions! You can ask me about sending money, checking balances, transaction history, KYC verification, and more. What would you like to know?";
}


export async function askAuthenticatedKaiHandler(data: any, context: any) {
    console.log(`[KAI] Processing request from user: ${context.auth?.uid}`);
    
    if (!context.auth) {
        console.log('[KAI] Authentication failed - no auth context');
        throw new HttpsError('unauthenticated', 'User must be authenticated.');
    }
    
    try {
        const { query, conversationHistory } = AiAssistantInputSchema.parse(data);
        console.log(`[KAI] Validated input - query length: ${query.length}, history length: ${conversationHistory?.length || 0}`);

        // Check OpenAI API key
        const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
        if (!OPENAI_API_KEY || OPENAI_API_KEY === 'demo_key_replace_with_actual_openai_api_key') {
            console.error('[KAI] OpenAI API key not configured properly');
            // Return a helpful demo response instead of throwing an error
            return {
                reply: "Hello! I'm Kai, the AI assistant for CPay. To fully activate my capabilities, please configure a valid OpenAI API key in your environment variables. For now, I can help with basic information about CPay features.",
                intent: 'DEMO_MODE'
            };
        }

        // Prepare messages for OpenAI
        const messages = [
            { role: 'system', content: "You are CPay's helpful AI assistant. You help users with their financial transactions, wallet management, and general questions about the CPay platform." },
            ...(conversationHistory || []).map((msg: any) => ({
                role: msg.sender === 'USER' ? 'user' : 'assistant',
                content: msg.text
            })),
            { role: 'user', content: query }
        ];

        console.log(`[KAI] Sending request to OpenAI with ${messages.length} messages`);
        
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages,
                max_tokens: 256,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[KAI] OpenAI API error: ${response.status} ${response.statusText} - ${errorText}`);
            
            // Provide helpful fallback responses based on common queries
            const fallbackResponse = generateFallbackResponse(query.toLowerCase());
            return {
                reply: fallbackResponse,
                intent: 'FALLBACK_RESPONSE'
            };
        }

        const dataJson: any = await response.json();
        const aiReply = dataJson.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';
        
        console.log(`[KAI] Successfully generated response: ${aiReply.substring(0, 100)}...`);
        
        return {
            reply: aiReply,
            intent: 'GENERAL_QUERY'
        };
    } catch (error) {
        console.error('[KAI] Error processing request:', error);
        
        if (error instanceof HttpsError) {
            throw error;
        }
        
        if (error instanceof z.ZodError) {
            console.error('[KAI] Validation error:', error.errors);
            throw new HttpsError('invalid-argument', 'Invalid input data format');
        }
        
        throw new HttpsError('internal', 'An unexpected error occurred while processing your request');
    }
}
