
import { getFirestore } from 'firebase-admin/firestore';


const db = getFirestore();

/**
 * Loads the most recent memory entries for a given user, applying role-based access control.
 * @param userId The ID of the user whose memory to load.
 * @param role The role of the user requesting the memory ('user', 'admin', 'superadmin').
 * @returns A string containing a summary of recent memories.
 */
export async function loadMemory(userId: string, role: string): Promise<string> {
  try {
    // --- MEMORY PROTECTION RULE ---
    // Superadmin gets the detailed, private logs.
    if (role === 'superadmin') {
      const memDocs = await db
        .collection(`users/${userId}/memory/private_logs`)
        .orderBy('timestamp', 'desc')
        .limit(10) // Superadmins get more context
        .get();
        
      if (memDocs.empty) return "No private logs found for this user.";
      
      return "Superadmin Full Context:\n" + memDocs.docs.map(doc => `• ${doc.data().thought}`).join('\n');
    }

    // Regular users and admins get the sanitized, public summary from their kai_interactions.
    const publicInteractions = await db.collection(`users/${userId}/kai_interactions`)
        .orderBy('timestamp', 'desc')
        .limit(5)
        .get();

    if (publicInteractions.empty) {
        return "No recent interactions found.";
    }

    return "Recent Interactions:\n" + publicInteractions.docs.map(doc => `• User asked: "${doc.data().prompt}" -> Kai replied: "${doc.data().response.substring(0, 50)}..."`).join('\n');

  } catch (error) {
    console.error(`Failed to load memory for user ${userId}:`, error);
    return "Could not retrieve user memory due to an internal error.";
  }
}

/**
 * Adds a new public memory entry for a user, which also updates their public summary.
 * This function is intended to be called after a user-facing interaction.
 * @param userId The ID of the user.
 * @param summary A short summary of the interaction.
 */
export async function addMemory(userId: string, _summary: string): Promise<void> {
   try {
    // This is a simplified summary update. A real system might use an LLM to condense memories.
    // For now, we rely on kai_interactions for public memory.
    // This function can be expanded in the future.
    // For example, creating a new document in a `memory` collection:
    /*
    await db.collection(`users/${userId}/memory`).add({
        summary,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    */
   } catch(error) {
       console.error(`Failed to add/update memory for user ${userId}:`, error);
       // We don't throw here because this is a non-critical background task.
   }
}
