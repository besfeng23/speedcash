import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-static';

export async function GET(request: NextRequest) {
  return NextResponse.json(
    { 
      message: 'CORS test successful',
      timestamp: new Date().toISOString(),
      origin: request.headers.get('origin')
    },
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      },
    }
  );
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  
  return NextResponse.json(
    { 
      message: 'CORS POST test successful',
      receivedData: body,
      timestamp: new Date().toISOString(),
      origin: request.headers.get('origin')
    },
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      },
    }
  );
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Max-Age': '86400',
    },
  });
} 