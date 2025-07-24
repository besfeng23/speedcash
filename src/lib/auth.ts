import { adminDb } from '@/lib/firebase-admin';

export async function verifyUserOrgAccess(userId: string, orgId: string): Promise<boolean> {
  if (!userId || !orgId || !adminDb) {
    return false;
  }
  try {
    const orgRef = adminDb.collection('organizations').doc(orgId);
    const orgDoc = await orgRef.get();

    if (!orgDoc.exists) {
      console.warn(`Security check failed: Org ${orgId} does not exist.`);
      return false;
    }

    const members = orgDoc.data()?.members as string[] | undefined;
    if (!members || !members.includes(userId)) {
      console.warn(`Security check failed: User ${userId} attempted to access org ${orgId}.`);
      return false;
    }

    return true; // Access granted
  } catch (error) {
    console.error('Error during access verification:', error);
    return false;
  }
} 