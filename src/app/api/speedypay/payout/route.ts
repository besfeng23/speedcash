import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// 🔐 SpeedyPay Configuration
const SPEEDYPAY_CONFIG = {
  secretKey: process.env.SPEEDYPAY_SECRET_KEY || 'uck6lo8sdjaarqf3sohdoovdvvn0kdnk',
  merchantSeq: process.env.SPEEDYPAY_MERCHANT_SEQ || '300000064613',
  testBaseUrl: 'https://test.e-mango.ph/cashier',
  prodBaseUrl: 'https://pay.e-mango.ph/cashier'
};

// 🔢 SpeedyPay Signature Generation
function generateSpeedyPaySignature(params: any, secretKey: string): string {
  // 1. Filter out null values and the sign field
  const filteredParams: { [key: string]: any } = {};
  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined && key !== 'sign') {
      filteredParams[key] = value;
    }
  }

  // 2. Sort parameters alphabetically
  const sortedKeys = Object.keys(filteredParams).sort();
  
  // 3. Concatenate key-value pairs with &
  const concatenatedString = sortedKeys
    .map(key => `${key}=${filteredParams[key]}`)
    .join('&');

  // 4. Append secret key
  const finalString = concatenatedString + '&' + secretKey;

  // 5. Generate SHA256 hash
  return crypto.createHash('sha256').update(finalString).digest('hex');
}

// 🌐 Make HTTP Request to SpeedyPay
async function makeSpeedyPayRequest(url: string, payload: any) {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('SpeedyPay API request failed:', error);
    throw error;
  }
}

// 🚀 POST Handler for Payout Requests
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const {
      amount,
      currency,
      procId,
      procDetail,
      purposes,
      firstName,
      lastName,
      mobilePhone
    } = body;

    // ✅ Validate required fields
    if (!amount || !procId || !procDetail || !purposes || !firstName || !lastName || !mobilePhone) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields'
      }, { status: 400 });
    }

    // ✅ Validate amount
    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      return NextResponse.json({
        success: false,
        error: 'Invalid amount'
      }, { status: 400 });
    }

    // 📅 Generate timestamps
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const orderDate = new Date().toISOString().substring(0, 10);
    const orderSeq = 'CPAY_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

    // 📦 Prepare payload
    const payload = {
      signType: 'SHA256',
      timestamp: timestamp,
      merchSeq: SPEEDYPAY_CONFIG.merchantSeq,
      orderSeq: orderSeq,
      orderDate: orderDate,
      amount: amountValue.toFixed(2),
      fee: '0.00',
      currency: currency || 'PHP',
      procId: procId,
      procDetail: procDetail,
      purposes: purposes,
      firstName: firstName,
      lastName: lastName,
      mobilePhone: mobilePhone,
      notifyUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://applez-dch9v.web.app'}/api/speedypay/webhook`
    };

    // 🔐 Generate signature
    const signature = generateSpeedyPaySignature(payload, SPEEDYPAY_CONFIG.secretKey);
    (payload as any).sign = signature;

    // 🚀 Send request to SpeedyPay
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? SPEEDYPAY_CONFIG.prodBaseUrl 
      : SPEEDYPAY_CONFIG.testBaseUrl;
    
    const response = await makeSpeedyPayRequest(`${baseUrl}/cashOut.do`, payload);

    // 📊 Log the request
    console.log('SpeedyPay payout request:', {
      orderSeq,
      amount: amountValue,
      procId,
      respCode: response.respCode,
      respMessage: response.respMessage
    });

    // ✅ Return response
    if (response.respCode === '00000000') {
      return NextResponse.json({
        success: true,
        data: {
          orderSeq: response.orderSeq || orderSeq,
          transSeq: response.transSeq,
          transState: response.transState,
          respCode: response.respCode,
          respMessage: response.respMessage
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        error: response.respMessage || 'Payout request failed',
        data: {
          orderSeq: response.orderSeq || orderSeq,
          respCode: response.respCode,
          respMessage: response.respMessage
        }
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Payout API error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// 🔍 GET Handler for API info
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'SpeedyPay Payout API',
    version: '1.0',
    endpoints: {
      payout: 'POST /api/speedypay/payout',
      webhook: 'POST /api/speedypay/webhook',
      balance: 'GET /api/speedypay/balance',
      status: 'GET /api/speedypay/status/:orderSeq'
    },
    channels: {
      majorBanks: 11,
      eWallets: 9,
      total: 20
    }
  });
} 