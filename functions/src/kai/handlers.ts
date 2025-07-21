

import { HttpsError } from 'firebase-functions/v2/https';
import { z } from 'zod';
import fetch from 'node-fetch';
// import { askAiAssistant } from '../ai/flows/chat-assistant'; // TODO: Create AI flow

const AiAssistantInputSchema = z.object({
  query: z.string(),
  conversationHistory: z.array(z.object({
    sender: z.enum(['USER', 'AI']),
    text: z.string(),
  })).optional(),
});


export async function askAuthenticatedKaiHandler(data: any, context: any) {
    if (!context.auth) {
        throw new HttpsError('unauthenticated', 'User must be authenticated.');
    }
    const { query, conversationHistory } = AiAssistantInputSchema.parse(data);

    // Call OpenAI API
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
        throw new HttpsError('failed-precondition', 'OpenAI API key is not set.');
    }
    const messages = [
        { role: 'system', content: "You are CPay's helpful AI assistant." },
        ...(conversationHistory || []).map((msg: any) => ({
            role: msg.sender === 'USER' ? 'user' : 'assistant',
            content: msg.text
        })),
        { role: 'user', content: query }
    ];
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages,
            max_tokens: 256
        })
    });
    if (!response.ok) {
        throw new HttpsError('internal', 'Failed to get response from OpenAI.');
    }
    const dataJson: any = await response.json();
    const aiReply = dataJson.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';
    return {
        reply: aiReply,
        intent: 'GENERAL_QUERY'
    };
}
