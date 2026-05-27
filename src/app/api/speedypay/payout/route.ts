import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

type SpeedyPayParams = Record<string, string | number | boolean>;

type SpeedyPayRequestBody = {
  amount?: unknown;
  currency?: unknown;
  procId?: unknown;
  procDetail?: unknown;
  purposes?: unknown;
  firstName?: unknown;
  lastName?: unknown;
  mobilePhone?: unknown;
  internalTransactionId?: unknown;
};

type SpeedyPayResponse = {
  respCode?: unknown;
  respMessage?: unknown;
  orderSeq?: unknown;
  transSeq?: unknown;
  transState?: unknown;
};

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required SpeedyPay configuration: ${name}`);
  }
  return value;
}

function getString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function generateSpeedyPaySignature(params: SpeedyPayParams, secretKey: string): string {
  const filteredParams: SpeedyPayParams = {};
  for (const [key, value] of Object.entries(params)) {
    if (key !== 'sign') {
      filteredParams[key] = value;
    }
  }

  const concatenatedString = Object.keys(filteredParams)
    .sort()
    .map((key) => `${key}=${filteredParams[key]}`)
    .join('&');

  return crypto.createHash('sha256').update(`${concatenatedString}&${secretKey}`).digest('hex');
}

async function makeSpeedyPayRequest(url: string, payload: SpeedyPayParams): Promise<SpeedyPayResponse> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`SpeedyPay request failed with status ${response.status}`);
  }

  const data: unknown = await response.json();
  if (!isRecord(data)) {
    throw new Error('SpeedyPay returned an invalid response shape');
  }

  return data;
}

export async function POST(request: NextRequest) {
  if (process.env.ENABLE_DIRECT_SPEEDYPAY_PAYOUT_ROUTE !== 'true') {
    return NextResponse.json({
      success: false,
      error: 'Direct SpeedyPay payout route is disabled. Use the controlled Money Core flow.',
    }, {status: 403});
  }

  try {
    const secretKey = requireEnv('SPEEDYPAY_SECRET_KEY');
    const merchantSeq = requireEnv('SPEEDYPAY_MERCHANT_SEQ');
    const baseUrl = requireEnv('SPEEDYPAY_BASE_URL').replace(/\/$/, '');
    const notifyBaseUrl = requireEnv('SPEEDYPAY_NOTIFY_BASE_URL').replace(/\/$/, '');

    const body = await request.json() as SpeedyPayRequestBody;
    const amount = getString(body.amount);
    const currency = getString(body.currency) || 'PHP';
    const procId = getString(body.procId);
    const procDetail = getString(body.procDetail);
    const purposes = getString(body.purposes);
    const firstName = getString(body.firstName);
    const lastName = getString(body.lastName);
    const mobilePhone = getString(body.mobilePhone);
    const internalTransactionId = getString(body.internalTransactionId);

    if (!amount || !procId || !procDetail || !purposes || !firstName || !lastName || !mobilePhone || !internalTransactionId) {
      return NextResponse.json({success: false, error: 'Missing required fields'}, {status: 400});
    }

    const amountValue = Number.parseFloat(amount);
    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      return NextResponse.json({success: false, error: 'Invalid amount'}, {status: 400});
    }

    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const orderDate = new Date().toISOString().substring(0, 10);
    const orderSeq = `SPEEDCASH_${internalTransactionId}`;

    const payload: SpeedyPayParams = {
      signType: 'SHA256',
      timestamp,
      merchSeq: merchantSeq,
      orderSeq,
      orderDate,
      amount: amountValue.toFixed(2),
      fee: '0.00',
      currency,
      procId,
      procDetail,
      purposes,
      firstName,
      lastName,
      mobilePhone,
      notifyUrl: `${notifyBaseUrl}/api/speedypay/webhook`,
    };

    payload.sign = generateSpeedyPaySignature(payload, secretKey);

    const response = await makeSpeedyPayRequest(`${baseUrl}/cashOut.do`, payload);
    const respCode = getString(response.respCode);
    const respMessage = getString(response.respMessage);

    console.log('SpeedyPay payout submitted', {
      internalTransactionId,
      orderSeq,
      amount: amountValue,
      currency,
      respCode: respCode || 'unknown',
    });

    if (respCode === '00000000') {
      return NextResponse.json({
        success: true,
        status: 'SUBMITTED_TO_PROVIDER',
        message: 'Payout submitted to provider. This is not final settlement.',
        data: {
          orderSeq: getString(response.orderSeq) || orderSeq,
          transSeq: getString(response.transSeq),
          transState: getString(response.transState),
          respCode,
          respMessage,
        },
      });
    }

    return NextResponse.json({
      success: false,
      error: respMessage || 'Payout request failed',
      data: {
        orderSeq: getString(response.orderSeq) || orderSeq,
        respCode,
        respMessage,
      },
    }, {status: 400});
  } catch (error: unknown) {
    console.error('SpeedyPay payout route failed', {
      message: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json({success: false, error: 'Internal server error'}, {status: 500});
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'SpeedyPay payout route is disabled by default and must not be used as final settlement.',
    requiredFlag: 'ENABLE_DIRECT_SPEEDYPAY_PAYOUT_ROUTE=true',
  });
}
