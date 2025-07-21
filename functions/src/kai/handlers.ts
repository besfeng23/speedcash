
'use server';

import { HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { z } from 'zod';
// import { askAiAssistant } from '../ai/flows/chat-assistant'; // TODO: Create AI flow

const db = admin.firestore();

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
    const uid = context.auth.uid;
    const { query, conversationHistory } = AiAssistantInputSchema.parse(data);

    // 1. Fetch user data (profile and balance) securely on the backend.
    const userDocRef = db.doc(`users/${uid}`);
    const phpWalletRef = db.doc(`users/${uid}/wallets/PHP`);

    await Promise.all([
        userDocRef.get(),
        phpWalletRef.get()
    ]);
    


    // TODO: Implement AI assistant flow
    // const aiResult = await askAiAssistant({ 
    //     query,
    //     uid,
    //     conversationHistory,
    //     kycStatus,
    //     phpBalance,
    //     role: userRole
    // });

    // Placeholder response for now
    const aiResult = {
        reply: `Hello! I'm CPay's AI assistant. You asked: "${query}". This feature is currently under development.`,
        intent: 'GENERAL_QUERY'
    };

    // 3. If the intent requires a ticket, create it securely on the backend.
    if (aiResult.intent === 'SUPPORT_REQUEST' || aiResult.intent === 'FEATURE_REQUEST') {
        const ticketRef = db.collection('supportTickets').doc();
        await ticketRef.set({
            intent: aiResult.intent,
            initialQuery: query,
            conversationHistory: [...(conversationHistory || []), { sender: 'USER', text: query }],
            aiReply: aiResult.reply,
            ticketId: ticketRef.id,
            uid,
            status: 'NEW',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    }

    // 4. Log the interaction.
     await db.collection(`users/${uid}/kai_interactions`).add({
        prompt: query,
        response: aiResult.reply,
        requestingUser: uid,
        requestingRole: context.auth.token.role || 'user',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    // 5. Return the AI's reply to the frontend.
    return { reply: aiResult.reply };
}
