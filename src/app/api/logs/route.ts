import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { verifyUserOrgAccess } from '@/lib/auth';
import type { ApiLog } from '@/types';

export async function GET(request: NextRequest) {
  try {
    if (!adminDb) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }

    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No auth token' }, { status: 401 });
    }
    
    const token = authHeader.replace('Bearer ', '');
    const decoded = await getAuth().verifyIdToken(token);
    const userId = decoded.uid;
    
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');
    if (!orgId) {
      return NextResponse.json({ error: 'Missing orgId' }, { status: 400 });
    }

    const hasAccess = await verifyUserOrgAccess(userId, orgId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const logsSnap = await adminDb.collection('api_logs')
      .where('organizationId', '==', orgId)
      .orderBy('timestamp', 'desc')
      .limit(100)
      .get();
    const logs: ApiLog[] = logsSnap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as ApiLog));
    
    return NextResponse.json(logs);
  } catch (error) {
    console.error('Error fetching logs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 