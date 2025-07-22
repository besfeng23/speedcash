import { db } from '@/lib/firebase';

export async function verifyUserOrgAccess(userId: string, orgId: string): Promise<boolean> {
  if (!userId || !orgId) {
    return false;
  }
  try {
    const orgRef = db.collection('organizations').doc(orgId);
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