import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import type { Organization } from '@/types';

export async function GET(request: NextRequest) {
  try {
    // Check if Firebase admin is properly configured
    if (!adminDb) {
      console.error('Firebase admin not initialized - missing environment variables');
      return NextResponse.json({ 
        error: 'Database not initialized',
        details: 'Firebase admin configuration missing. Check FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY environment variables.'
      }, { status: 500 });
    }

    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No auth token' }, { status: 401 });
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    try {
      const decoded = await getAuth().verifyIdToken(token);
      const userId = decoded.uid;

      const orgsSnap = await adminDb.collection('organizations').where('members', 'array-contains', userId).get();
      const orgs: Organization[] = orgsSnap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Organization));
      
      return NextResponse.json(orgs);
    } catch (authError) {
      console.error('Firebase auth error:', authError);
      return NextResponse.json({ 
        error: 'Authentication failed',
        details: 'Invalid or expired token'
      }, { status: 401 });
    }
  } catch (error) {
    console.error('Error fetching organizations:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 