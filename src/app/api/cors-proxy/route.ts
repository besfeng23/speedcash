import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const DISPATCHER_URL = process.env.INTERNAL_DISPATCHER_URL ||
  'https://asia-southeast1-applez-dch9v.cloudfunctions.net/cpayDispatcher';

function getAllowedOrigins() {
  return (process.env.CORS_ALLOWED_ORIGINS || 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function getCorsHeaders(origin: string | null) {
  const allowedOrigins = getAllowedOrigins();
  const allowedOrigin = origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0];

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');

  try {
    const body = await request.json();
    const { action, data } = body;

    if (!action || typeof action !== 'string') {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400, headers: getCorsHeaders(origin) }
      );
    }

    const response = await fetch(DISPATCHER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: request.headers.get('Authorization') || '',
      },
      body: JSON.stringify({ action, data }),
    });

    const result = await response.json();
    console.log(`[CORS Proxy] Action: ${action}, Status: ${response.status}`);

    return NextResponse.json(result, {
      status: response.status,
      headers: getCorsHeaders(origin),
    });
  } catch (error) {
    console.error('CORS proxy error:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: getCorsHeaders(origin) }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(request.headers.get('origin')),
  });
}
