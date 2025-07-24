

import { HttpsError } from 'firebase-functions/v2/https';
import { z } from 'zod';
import { ai } from '../ai/genkit'; // Import AI configuration

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
        if (!OPENAI_API_KEY) {
            console.error('[KAI] OpenAI API key not configured');
            // Fallback to local AI configuration
            const aiResponse = await ai.generate({
                prompt: query,
                type: 'text',
                model: 'local'
            });
            
            return {
                reply: aiResponse.output.text,
                intent: 'GENERAL_QUERY'
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
            throw new HttpsError('internal', `Failed to get response from OpenAI: ${response.status} ${response.statusText}`);
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
