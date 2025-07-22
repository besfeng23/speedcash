import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/firebase';
import { getAuth } from 'firebase-admin/auth';
import { verifyUserOrgAccess } from '@/lib/auth';
import type { ApiLog } from '@/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No auth token' });
    const token = authHeader.replace('Bearer ', '');
    const decoded = await getAuth().verifyIdToken(token);
    const userId = decoded.uid;
    const orgId = req.query.orgId as string;
    if (!orgId) return res.status(400).json({ error: 'Missing orgId' });

    const hasAccess = await verifyUserOrgAccess(userId, orgId);
    if (!hasAccess) return res.status(403).json({ error: 'Access denied' });

    const logsSnap = await db.collection('api_logs')
      .where('organizationId', '==', orgId)
      .orderBy('timestamp', 'desc')
      .limit(100)
      .get();
    const logs: ApiLog[] = logsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ApiLog));
    return res.status(200).json(logs);
  } catch (error) {
    console.error('Error fetching logs:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 