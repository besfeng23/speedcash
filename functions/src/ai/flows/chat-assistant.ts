

/**
 * @fileOverview An AI assistant flow that answers user queries and analyzes user intent.
 * This flow is specifically for the backend (Cloud Function) context.
 *
 * - askAiAssistant - A function that handles the chat interaction and intent analysis.
 * - AiAssistantInput - The input type for the askAiAssistant function.
 * - AiAssistantOutput - The return type for the askAiAssistant function.
 */

import { ai } from '../genkit';
import { suspendUserTool } from '../tools/suspendUser';
import { generateImageTool } from '../tools/generateImage';
import { z } from 'zod';

const MessageSchema = z.object({
  sender: z.enum(['USER', 'AI']),
  text: z.string(),
});

export const AiAssistantInputSchema = z.object({
  query: z.string().describe("The user's question."),
  uid: z.string().describe("The UID of the user making the request."),
  role: z.string().optional().describe("The role of the user making the request (e.g., 'user', 'admin'). This is used for security checks."),
  kycStatus: z.string().optional().describe("The user's current KYC status (e.g., 'VERIFIED', 'PENDING_REVIEW')."),
  phpBalance: z.number().optional().describe("The user's current PHP wallet balance."),
  conversationHistory: z.array(MessageSchema).optional().describe("The history of the conversation so far."),
});
export type AiAssistantInput = z.infer<typeof AiAssistantInputSchema>;

const AiAssistantOutputSchema = z.object({
  reply: z.string().describe("The AI assistant's response to the user. If an image was generated, this reply should contain ONLY the data URI of the image and nothing else."),
  intent: z.enum(['GENERAL_QUERY', 'SUPPORT_REQUEST', 'FEATURE_REQUEST', 'ADMIN_ACTION'])
        .describe("The user's classified intent."),
});
export type AiAssistantOutput = z.infer<typeof AiAssistantOutputSchema>;

// Internal schema for combined analysis
const CombinedAnalysisSchema = z.object({
    reply: z.string().describe("The AI assistant's helpful and conversational response. If a tool was used that generated an image, this field should contain ONLY the data URI of the image (e.g., 'data:image/png;base64,...') and no other text. For all other cases, this is a natural language response."),
    intent: z.enum(['GENERAL_QUERY', 'SUPPORT_REQUEST', 'FEATURE_REQUEST', 'ADMIN_ACTION'])
        .describe("Classify the user's intent. Use SUPPORT_REQUEST for problems or confusion. Use FEATURE_REQUEST for suggestions. Use ADMIN_ACTION if an admin tool was used. Otherwise, use GENERAL_QUERY."),
});


export async function askAiAssistant(input: AiAssistantInput): Promise<AiAssistantOutput> {
  return chatAssistantFlow(input);
}

const answerAndAnalyzePrompt = ai.definePrompt({
  name: 'backendChatAssistantPrompt',
  input: { schema: AiAssistantInputSchema },
  output: { schema: CombinedAnalysisSchema },
  tools: [suspendUserTool, generateImageTool],
  prompt: `You are CPay's helpful and friendly AI Assistant. Your primary job is to be a conversational partner.

IMPORTANT: If the user asks you to perform an action (like suspending a user or generating an image) but does not provide all the necessary information, you MUST ask a clarifying question.
- For suspending a user, you need a user ID. If not given, ask "Which user ID would you like to suspend?".
- For generating an image, you need a description. If not given, ask "What should I generate an image of?".

You have access to the user's live data. Use it to answer their questions accurately.

If the user has the role 'admin' or 'superadmin' and asks to suspend or unsuspend another user, you MUST use the suspendUserTool to perform the action. You must provide the actorUid (which is the current user's UID) and actorRole to the tool. Confirm the action was successful in your reply.
If the user asks you to generate, create, or draw an image, you MUST use the generateImageTool. The tool will return a data URI. Your entire 'reply' field in the final JSON output MUST be ONLY this data URI and nothing else.

If the user asks for sensitive information that is not available in their context (e.g. another user's balance), you must politely decline.

User Context:
- User ID: {{{uid}}}
- Role: {{#if role}}{{role}}{{else}}user{{/if}}
- KYC Status: {{#if kycStatus}}{{kycStatus}}{{else}}Not Available{{/if}}
- PHP Balance: {{#if phpBalance}}₱{{phpBalance}}{{else}}Not Available{{/if}}

{{#if conversationHistory}}
Conversation History:
{{#each conversationHistory}}
- {{sender}}: {{text}}
{{/each}}
{{/if}}

User's Query: "{{{query}}}"

Based on all the information above, provide a helpful and conversational response AND classify the user's intent.
Respond with ONLY a JSON object matching the output schema.
`,
});


const chatAssistantFlow = ai.defineFlow(
  {
    name: 'chatAssistantFlow',
    inputSchema: AiAssistantInputSchema,
    outputSchema: AiAssistantOutputSchema,
  },
  async (input: any) => {
    const { output } = await answerAndAnalyzePrompt(input);
    return output!;
  }
);
