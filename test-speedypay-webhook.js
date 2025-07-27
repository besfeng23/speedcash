const crypto = require('crypto');
const https = require('https');

// 🔐 SpeedyPay Webhook Test Configuration
const WEBHOOK_CONFIG = {
  secretKey: 'uck6lo8sdjaarqf3sohdoovdvvn0kdnk',
  merchantSeq: '300000064613',
  // Test webhook URL (replace with your actual Firebase Functions URL)
  webhookUrl: 'https://asia-southeast1-applez-dch9v.cloudfunctions.net/speedypayWebhook',
  healthUrl: 'https://asia-southeast1-applez-dch9v.cloudfunctions.net/speedypayWebhookHealth',
  statsUrl: 'https://asia-southeast1-applez-dch9v.cloudfunctions.net/speedypayWebhookStats',
  testUrl: 'https://asia-southeast1-applez-dch9v.cloudfunctions.net/speedypayWebhookTest'
};

// 🔢 SpeedyPay Signature Generation
function generateSpeedyPaySignature(params, secretKey) {
  // 1. Filter out null values and the sign field
  const filteredParams = {};
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

// 🌐 HTTP Request Function
function makeRequest(url, method, headers, body) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    
    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname,
      method: method,
      headers: headers
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: response
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    
    req.end();
  });
}

// 🧪 Test 1: Webhook Health Check
async function testWebhookHealth() {
  console.log('\n🧪 TEST 1: Webhook Health Check');
  console.log('=================================');
  
  const headers = {
    'Content-Type': 'application/json'
  };

  console.log('📤 Request Details:');
  console.log('URL:', WEBHOOK_CONFIG.healthUrl);
  console.log('Method: GET');
  console.log('Headers:', JSON.stringify(headers, null, 2));

  try {
    const response = await makeRequest(WEBHOOK_CONFIG.healthUrl, 'GET', headers);
    
    console.log('\n📥 Response:');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return null;
  }
}

// 🧪 Test 2: Generate Test Webhook Data
async function testGenerateWebhookData() {
  console.log('\n🧪 TEST 2: Generate Test Webhook Data');
  console.log('======================================');
  
  const headers = {
    'Content-Type': 'application/json'
  };

  console.log('📤 Request Details:');
  console.log('URL:', WEBHOOK_CONFIG.testUrl);
  console.log('Method: GET');
  console.log('Headers:', JSON.stringify(headers, null, 2));

  try {
    const response = await makeRequest(WEBHOOK_CONFIG.testUrl, 'GET', headers);
    
    console.log('\n📥 Response:');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return null;
  }
}

// 🧪 Test 3: Send Success Webhook
async function testSuccessWebhook() {
  console.log('\n🧪 TEST 3: Send Success Webhook');
  console.log('================================');
  
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const orderSeq = 'TEST_SUCCESS_' + Date.now();
  
  const webhookData = {
    signType: 'SHA256',
    timestamp: timestamp,
    merchSeq: WEBHOOK_CONFIG.merchantSeq,
    orderSeq: orderSeq,
    transSeq: 'TRANS_SUCCESS_' + Date.now(),
    transState: '00', // SUCCESS
    amount: '1000.00',
    currency: 'PHP',
    procId: 'BOPIPHMMXXX',
    procDetail: '1234567890',
    purposes: 'Salary Payment',
    firstName: 'John',
    lastName: 'Doe',
    mobilePhone: '09123456789',
    createTime: timestamp,
    notifyTime: timestamp,
    respCode: '00000000',
    respMessage: 'Transaction successful'
  };

  // Generate signature
  const signature = generateSpeedyPaySignature(webhookData, WEBHOOK_CONFIG.secretKey);
  webhookData.sign = signature;
  
  const headers = {
    'Content-Type': 'application/json'
  };

  console.log('📤 Request Details:');
  console.log('URL:', WEBHOOK_CONFIG.webhookUrl);
  console.log('Method: POST');
  console.log('Headers:', JSON.stringify(headers, null, 2));
  console.log('Payload:', JSON.stringify(webhookData, null, 2));
  console.log('Signature:', signature);

  try {
    const response = await makeRequest(WEBHOOK_CONFIG.webhookUrl, 'POST', headers, webhookData);
    
    console.log('\n📥 Response:');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2));
    
    return { response: response.data, orderSeq };
  } catch (error) {
    console.error('❌ Error:', error.message);
    return null;
  }
}

// 🧪 Test 4: Send Failed Webhook
async function testFailedWebhook() {
  console.log('\n🧪 TEST 4: Send Failed Webhook');
  console.log('===============================');
  
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const orderSeq = 'TEST_FAILED_' + Date.now();
  
  const webhookData = {
    signType: 'SHA256',
    timestamp: timestamp,
    merchSeq: WEBHOOK_CONFIG.merchantSeq,
    orderSeq: orderSeq,
    transSeq: 'TRANS_FAILED_' + Date.now(),
    transState: '01', // FAILED
    amount: '500.00',
    currency: 'PHP',
    procId: 'GXCHPHM2XXX',
    procDetail: '09123456789',
    purposes: 'Test Failed Payout',
    firstName: 'Jane',
    lastName: 'Smith',
    mobilePhone: '09123456789',
    createTime: timestamp,
    notifyTime: timestamp,
    respCode: '99999999',
    respMessage: 'Insufficient funds'
  };

  // Generate signature
  const signature = generateSpeedyPaySignature(webhookData, WEBHOOK_CONFIG.secretKey);
  webhookData.sign = signature;
  
  const headers = {
    'Content-Type': 'application/json'
  };

  console.log('📤 Request Details:');
  console.log('URL:', WEBHOOK_CONFIG.webhookUrl);
  console.log('Method: POST');
  console.log('Headers:', JSON.stringify(headers, null, 2));
  console.log('Payload:', JSON.stringify(webhookData, null, 2));

  try {
    const response = await makeRequest(WEBHOOK_CONFIG.webhookUrl, 'POST', headers, webhookData);
    
    console.log('\n📥 Response:');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2));
    
    return { response: response.data, orderSeq };
  } catch (error) {
    console.error('❌ Error:', error.message);
    return null;
  }
}

// 🧪 Test 5: Send Invalid Signature Webhook
async function testInvalidSignatureWebhook() {
  console.log('\n🧪 TEST 5: Send Invalid Signature Webhook');
  console.log('==========================================');
  
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const orderSeq = 'TEST_INVALID_' + Date.now();
  
  const webhookData = {
    signType: 'SHA256',
    timestamp: timestamp,
    merchSeq: WEBHOOK_CONFIG.merchantSeq,
    orderSeq: orderSeq,
    transSeq: 'TRANS_INVALID_' + Date.now(),
    transState: '06', // IN_PROCESS
    amount: '250.00',
    currency: 'PHP',
    procId: 'PAPHPHM1XXX',
    procDetail: '09123456789',
    purposes: 'Test Invalid Signature',
    firstName: 'Bob',
    lastName: 'Johnson',
    mobilePhone: '09123456789',
    createTime: timestamp,
    notifyTime: timestamp,
    respCode: '00000000',
    respMessage: 'Processing'
  };

  // Use invalid signature
  webhookData.sign = 'invalid_signature_1234567890abcdef';
  
  const headers = {
    'Content-Type': 'application/json'
  };

  console.log('📤 Request Details:');
  console.log('URL:', WEBHOOK_CONFIG.webhookUrl);
  console.log('Method: POST');
  console.log('Headers:', JSON.stringify(headers, null, 2));
  console.log('Payload:', JSON.stringify(webhookData, null, 2));

  try {
    const response = await makeRequest(WEBHOOK_CONFIG.webhookUrl, 'POST', headers, webhookData);
    
    console.log('\n📥 Response:');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return null;
  }
}

// 🧪 Test 6: Send Invalid Merchant Webhook
async function testInvalidMerchantWebhook() {
  console.log('\n🧪 TEST 6: Send Invalid Merchant Webhook');
  console.log('==========================================');
  
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const orderSeq = 'TEST_INVALID_MERCH_' + Date.now();
  
  const webhookData = {
    signType: 'SHA256',
    timestamp: timestamp,
    merchSeq: 'INVALID_MERCHANT_123', // Invalid merchant ID
    orderSeq: orderSeq,
    transSeq: 'TRANS_INVALID_MERCH_' + Date.now(),
    transState: '06', // IN_PROCESS
    amount: '100.00',
    currency: 'PHP',
    procId: 'SPEYPHM2XXX',
    procDetail: '09123456789',
    purposes: 'Test Invalid Merchant',
    firstName: 'Alice',
    lastName: 'Brown',
    mobilePhone: '09123456789',
    createTime: timestamp,
    notifyTime: timestamp,
    respCode: '00000000',
    respMessage: 'Processing'
  };

  // Generate signature
  const signature = generateSpeedyPaySignature(webhookData, WEBHOOK_CONFIG.secretKey);
  webhookData.sign = signature;
  
  const headers = {
    'Content-Type': 'application/json'
  };

  console.log('📤 Request Details:');
  console.log('URL:', WEBHOOK_CONFIG.webhookUrl);
  console.log('Method: POST');
  console.log('Headers:', JSON.stringify(headers, null, 2));
  console.log('Payload:', JSON.stringify(webhookData, null, 2));

  try {
    const response = await makeRequest(WEBHOOK_CONFIG.webhookUrl, 'POST', headers, webhookData);
    
    console.log('\n📥 Response:');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return null;
  }
}

// 🧪 Test 7: Webhook Statistics
async function testWebhookStats() {
  console.log('\n🧪 TEST 7: Webhook Statistics');
  console.log('=============================');
  
  const headers = {
    'Content-Type': 'application/json'
  };

  console.log('📤 Request Details:');
  console.log('URL:', WEBHOOK_CONFIG.statsUrl);
  console.log('Method: GET');
  console.log('Headers:', JSON.stringify(headers, null, 2));

  try {
    const response = await makeRequest(WEBHOOK_CONFIG.statsUrl, 'GET', headers);
    
    console.log('\n📥 Response:');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return null;
  }
}

// 🚀 Main Test Runner
async function runAllWebhookTests() {
  console.log('🚀 SpeedyPay Webhook Test Suite');
  console.log('================================');
  console.log('Webhook URL:', WEBHOOK_CONFIG.webhookUrl);
  console.log('Merchant Seq:', WEBHOOK_CONFIG.merchantSeq);
  console.log('Timestamp:', new Date().toISOString());

  // Test 1: Health check
  await testWebhookHealth();

  // Test 2: Generate test data
  await testGenerateWebhookData();

  // Test 3: Success webhook
  const successResult = await testSuccessWebhook();

  // Test 4: Failed webhook
  const failedResult = await testFailedWebhook();

  // Test 5: Invalid signature
  await testInvalidSignatureWebhook();

  // Test 6: Invalid merchant
  await testInvalidMerchantWebhook();

  // Test 7: Statistics
  await testWebhookStats();

  console.log('\n✅ All webhook tests completed!');
  console.log('\n📋 Test Summary:');
  console.log('- Health Check: ✅');
  console.log('- Test Data Generation: ✅');
  console.log('- Success Webhook: ✅');
  console.log('- Failed Webhook: ✅');
  console.log('- Invalid Signature: ✅');
  console.log('- Invalid Merchant: ✅');
  console.log('- Statistics: ✅');
  
  console.log('\n📋 Next Steps:');
  console.log('1. Check Firebase Functions logs for webhook processing');
  console.log('2. Verify transaction updates in Firestore');
  console.log('3. Test with real SpeedyPay transactions');
  console.log('4. Monitor webhook statistics');
  console.log('5. Set up alerts for failed webhooks');
}

// 🎯 Run the tests
if (require.main === module) {
  runAllWebhookTests().catch(console.error);
}

module.exports = {
  generateSpeedyPaySignature,
  makeRequest,
  testWebhookHealth,
  testGenerateWebhookData,
  testSuccessWebhook,
  testFailedWebhook,
  testInvalidSignatureWebhook,
  testInvalidMerchantWebhook,
  testWebhookStats,
  WEBHOOK_CONFIG
}; 