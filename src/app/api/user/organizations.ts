import { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import type { Organization } from '@/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (!adminDb) {
      return res.status(500).json({ error: 'Database not initialized' });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No auth token' });
    const token = authHeader.replace('Bearer ', '');
    const decoded = await getAuth().verifyIdToken(token);
    const userId = decoded.uid;

    const orgsSnap = await adminDb.collection('organizations').where('members', 'array-contains', userId).get();
    const orgs: Organization[] = orgsSnap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Organization));
    return res.status(200).json(orgs);
  } catch (error) {
    console.error('Error fetching organizations:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 