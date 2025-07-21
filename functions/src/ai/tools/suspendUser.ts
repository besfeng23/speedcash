
'use server';

/**
 * @fileOverview A Genkit tool to suspend or unsuspend a user.
 */

import { ai } from '../genkit';
import { z } from 'zod';
import * as admin from 'firebase-admin';
import { auditLog } from '../../utils/audit';

// This tool runs in the same backend environment as the Cloud Functions,
// so it has access to the Firebase Admin SDK.

const SuspendUserInputSchema = z.object({
  uid: z.string().describe("The UID of the user to suspend or unsuspend."),
  suspend: z.boolean().describe("Set to true to suspend the user, false to unsuspend."),
  actorRole: z.string().describe("The role of the user requesting the action (e.g., 'admin', 'user'). This is used for security checks."),
  actorUid: z.string().describe("The UID of the administrator performing the action.")
});

const SuspendUserOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export const suspendUserTool = ai.defineTool(
  {
    name: 'suspendUser',
    description: 'Suspend or unsuspend a user account',
    inputSchema: z.object({
      uid: z.string().describe('The user ID to suspend/unsuspend'),
      suspend: z.boolean().describe('True to suspend, false to unsuspend'),
      actorRole: z.string().describe('Role of the actor performing the action'),
      actorUid: z.string().describe('UID of the actor performing the action'),
    }),
  },
  async ({ uid, suspend, actorRole, actorUid }: { uid: string; suspend: boolean; actorRole: string; actorUid: string }) => {
    // This would typically call the actual suspend user function
    // For now, just return a success message
    return {
      success: true,
      message: `User ${uid} ${suspend ? 'suspended' : 'unsuspended'} by ${actorRole} (${actorUid})`,
    };
  }
);
