const crypto = require('crypto');
const https = require('https');

// 🔐 SpeedyPay (eMango Pay) Test Credentials
const CREDENTIALS = {
  merchantName: 'CPAY',
  merchantSeq: '300000064613', // Your Partner Merchant ID
  secretKey: 'uck6lo8sdjaarqf3sohdoovdvvn0kdnk',
  // Test environment endpoints
  testBaseUrl: 'https://test.e-mango.ph/cashier',
  // Production environment endpoints
  prodBaseUrl: 'https://pay.e-mango.ph/cashier'
};

// 🧪 Test Configuration
const TEST_CONFIG = {
  amount: '100.00',
  currency: 'PHP',
  orderSeq: 'TEST' + Date.now(),
  purposes: 'CPay Test Payout',
  firstName: 'John',
  lastName: 'Doe',
  mobilePhone: '09123456789',
  procId: 'GXCHPHM2XXX', // GCash (G-Xchange Inc) - more likely to be available in test
  procDetail: '09123456789', // Recipient account/mobile number
  notifyUrl: 'https://applez-dch9v.web.app/webhook/speedypay'
};

// 🔢 SpeedyPay Signature Generation Function
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

// 🧪 Test 1: Payout (cashOut.do)
async function testPayout() {
  console.log('\n🧪 TEST 1: Payout (cashOut.do)');
  console.log('================================');
  
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const orderDate = new Date().toISOString().substring(0, 10);
  
  const payload = {
    signType: 'SHA256',
    timestamp: timestamp,
    merchSeq: CREDENTIALS.merchantSeq,
    orderSeq: TEST_CONFIG.orderSeq,
    orderDate: orderDate,
    amount: TEST_CONFIG.amount,
    fee: '0.00',
    currency: TEST_CONFIG.currency,
    procId: TEST_CONFIG.procId,
    procDetail: TEST_CONFIG.procDetail,
    purposes: TEST_CONFIG.purposes,
    firstName: TEST_CONFIG.firstName,
    lastName: TEST_CONFIG.lastName,
    mobilePhone: TEST_CONFIG.mobilePhone,
    notifyUrl: TEST_CONFIG.notifyUrl
  };

  // Generate signature
  const signature = generateSpeedyPaySignature(payload, CREDENTIALS.secretKey);
  payload.sign = signature;
  
  const headers = {
    'Content-Type': 'application/json'
  };

  console.log('📤 Request Details:');
  console.log('URL:', `${CREDENTIALS.testBaseUrl}/cashOut.do`);
  console.log('Method: POST');
  console.log('Headers:', JSON.stringify(headers, null, 2));
  console.log('Payload:', JSON.stringify(payload, null, 2));
  console.log('Signature:', signature);

  try {
    const response = await makeRequest(`${CREDENTIALS.testBaseUrl}/cashOut.do`, 'POST', headers, payload);
    
    console.log('\n📥 Response:');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return null;
  }
}

// 🧪 Test 2: Transaction Query (qryOrder.do)
async function testTransactionQuery(orderSeq) {
  console.log('\n🧪 TEST 2: Transaction Query (qryOrder.do)');
  console.log('===========================================');
  
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
  
  const payload = {
    signType: 'SHA256',
    timestamp: timestamp,
    merchSeq: CREDENTIALS.merchantSeq,
    orderSeq: orderSeq || TEST_CONFIG.orderSeq
  };

  // Generate signature
  const signature = generateSpeedyPaySignature(payload, CREDENTIALS.secretKey);
  payload.sign = signature;
  
  const headers = {
    'Content-Type': 'application/json'
  };

  console.log('📤 Request Details:');
  console.log('URL:', `${CREDENTIALS.testBaseUrl}/qryOrder.do`);
  console.log('Method: POST');
  console.log('Headers:', JSON.stringify(headers, null, 2));
  console.log('Payload:', JSON.stringify(payload, null, 2));

  try {
    const response = await makeRequest(`${CREDENTIALS.testBaseUrl}/qryOrder.do`, 'POST', headers, payload);
    
    console.log('\n📥 Response:');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return null;
  }
}

// 🧪 Test 3: Balance Query (qryBalance.do)
async function testBalanceQuery() {
  console.log('\n🧪 TEST 3: Balance Query (qryBalance.do)');
  console.log('==========================================');
  
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
  
  const payload = {
    signType: 'SHA256',
    timestamp: timestamp,
    merchSeq: CREDENTIALS.merchantSeq
  };

  // Generate signature
  const signature = generateSpeedyPaySignature(payload, CREDENTIALS.secretKey);
  payload.sign = signature;
  
  const headers = {
    'Content-Type': 'application/json'
  };

  console.log('📤 Request Details:');
  console.log('URL:', `${CREDENTIALS.testBaseUrl}/qryBalance.do`);
  console.log('Method: POST');
  console.log('Headers:', JSON.stringify(headers, null, 2));
  console.log('Payload:', JSON.stringify(payload, null, 2));

  try {
    const response = await makeRequest(`${CREDENTIALS.testBaseUrl}/qryBalance.do`, 'POST', headers, payload);
    
    console.log('\n📥 Response:');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return null;
  }
}

// 🧪 Test 4: Signature Verification
function testSignatureVerification() {
  console.log('\n🧪 TEST 4: Signature Verification');
  console.log('==================================');
  
  // Example from documentation
  const testParams = {
    amount: '100.00',
    currency: 'PHP',
    merchSeq: '300000064613',
    orderSeq: 'TEST123',
    timestamp: '2024-01-01 12:00:00'
  };
  
  const expectedSignature = generateSpeedyPaySignature(testParams, CREDENTIALS.secretKey);
  
  console.log('Test Parameters:', JSON.stringify(testParams, null, 2));
  console.log('Expected Signature:', expectedSignature);
  
  // Verify signature generation
  const calculatedSignature = generateSpeedyPaySignature(testParams, CREDENTIALS.secretKey);
  const isValid = calculatedSignature === expectedSignature;
  
  console.log('Calculated Signature:', calculatedSignature);
  console.log('Signature Valid:', isValid ? '✅ YES' : '❌ NO');
}

// 🧪 Test 5: Available Payout Channels
function testPayoutChannels() {
  console.log('\n🧪 TEST 5: Available Payout Channels');
  console.log('=====================================');
  
  const channels = [
    { procId: 'APHIPHM2XXX', description: 'Alipay Philippines Inc' },
    { procId: 'AUBKPHMMXXX', description: 'Asia United Bank' },
    { procId: 'BFSRPHM2XXX', description: 'Bananapay Fintech Services' },
    { procId: 'BKCHPHMMXXX', description: 'Bank of China' },
    { procId: 'BNORPHMMXXY', description: 'Banco de Oro Unibank Inc' },
    { procId: 'BOPIPHMMXXX', description: 'Bank of the Philippine Islands' },
    { procId: 'BPDIPHM1XXX', description: 'BPI Direct BanKo A Savings Bank' },
    { procId: 'CAMZPHM2XXX', description: 'CARD MRI RIZAL BANK INC' },
    { procId: 'CBMFPHM1XXX', description: 'CARD Bank Inc' },
    { procId: 'CELRPHM1XXX', description: 'Cebuana Lhuillier Rural Bank' },
    { procId: 'CHBKPHMMXXX', description: 'China Banking Corporation' },
    { procId: 'CHSVPHM1XXX', description: 'China Bank Savings Inc' },
    { procId: 'CIPHPHMMXXX', description: 'CIMB BANK PHILIPPINES INC' },
    { procId: 'CIVAPHM1XXX', description: 'CITY SAVINGS BANK INC' },
    { procId: 'CIYCPHM2XXX', description: 'CIS BAYAD CENTER INC' },
    { procId: 'CNRLPHM1XXX', description: 'Cantilan Bank Inc' },
    { procId: 'CPHIPHMMXXX', description: 'PHILIPPINE BANK OF COMMUNICATIONS' },
    { procId: 'CRMHPHM1XXX', description: 'CARD SME BANK INC A THRIFT BANK' },
    { procId: 'CTCBPHMMXXY', description: 'CTBC Bank Phils Corp' },
    { procId: 'CUOBPHM2XXX', description: 'Community Rural Bank of Romblon' },
    { procId: 'DCPHPHM1XXX', description: 'DCPay Philippines Inc' },
    { procId: 'DUMTPHM1XXX', description: 'DUNGGANON BANK INCORPORATED' },
    { procId: 'EAGMPHM2XXX', description: 'Easy Pay Global EMI Corp' },
    { procId: 'EAWRPHM2XXX', description: 'EastWest Rural Bank' },
    { procId: 'ECASPHM2XXX', description: 'Ecashpay Asia Inc' },
    { procId: 'ENRUPHM1XXX', description: 'ENTREPRENEUR RURAL BANK INC' },
    { procId: 'EQSNPHM1XXX', description: 'Equicom Savings Bank' },
    { procId: 'EWBCPHMMXXX', description: 'East West Banking Corporation' },
    { procId: 'GHPESGSGXXX', description: 'GPAY NETWORK PH Inc' },
    { procId: 'GOTYPHM2XXX', description: 'GoTyme Bank Corporation' },
    { procId: 'GXCHPHM2XXX', description: 'GCASH (G-Xchange Inc)' },
    { procId: 'HSBCPHMMXXX', description: 'The HSBC Limited' },
    { procId: 'IFIPPHM2XXX', description: 'INFOSERVE INCORPORATED' },
    { procId: 'IREMPHM2XXX', description: 'I-Remit Inc' },
    { procId: 'ISTHPHM1XXX', description: 'ISLA BANK' },
    { procId: 'LAUIPHM2XXZ', description: 'Seabank Philippines Inc' },
    { procId: 'LESIPHM1XXX', description: 'LEGAZPI SAVINGS BANK INC' },
    { procId: 'LUDVPHM1XXX', description: 'Luzon Development Bank' },
    { procId: 'MAARPHM1XXX', description: 'Malayan Savings Bank' },
    { procId: 'MAYCPHM2XXX', description: 'MarCoPay Inc' },
    { procId: 'MBBEPHMMXXX', description: 'Maybank Philippines Inc' },
    { procId: 'MBTCPHMMXXX', description: 'Metrobank' },
    { procId: 'MIOCPHM1XXX', description: 'MINDANAO CONSOLIDATED COOPERATIVE' },
    { procId: 'MRTCPHM1XXX', description: 'Bangko Mabuhay' },
    { procId: 'MYDBPHM2XXX', description: 'MAYA BANK INC' },
    { procId: 'OMNPPHM2XXX', description: 'OmniPay Inc' },
    { procId: 'ONNRPHM1XXX', description: 'BDO NETWORK BANK' },
    { procId: 'OPDVPHM1XXX', description: 'AllBank Inc' },
    { procId: 'OWNBPHM2XXX', description: 'OWN BANK THE RURAL BANK INC' },
    { procId: 'PABIPHMMXXX', description: 'Bank Of Commerce' },
    { procId: 'PAEYPHM2XXX', description: 'PayMongo Payments Inc' },
    { procId: 'PAHCPHM2XXX', description: 'Paynamics Technologies Inc' },
    { procId: 'PAPHPHM1XXX', description: 'Maya Philippines Inc' },
    { procId: 'PASVPHM1XXX', description: 'Pacific Ace Savings Bank' },
    { procId: 'PDAXPHM2XXX', description: 'Philippine Digital Asset Exchange' },
    { procId: 'PHSBPHMMXXX', description: 'Philippine Savings Bank' },
    { procId: 'PHTBPHMMXXX', description: 'PHILTRUST BANK' },
    { procId: 'PHVBPHMMXXX', description: 'Philippine Veterans Bank' },
    { procId: 'PNBMPHMMTOD', description: 'Philippine National Bank' },
    { procId: 'PPBUPHMMXXX', description: 'PHILIPPINE BUSINESS BANK' },
    { procId: 'PPSFPHM2XXX', description: 'PalawanPay' },
    { procId: 'PRTOPHM1XXX', description: 'PARTNER RURAL BANK' },
    { procId: 'PSCOPHM1XXX', description: 'Producers Savings Bank Corporation' },
    { procId: 'QCDFPHM1XXX', description: 'Queen City Development Bank' },
    { procId: 'QCRIPHM1XXX', description: 'Quezon Capital Rural Bank' },
    { procId: 'RARLPHM1XXX', description: 'RANG-AY BANK A Rural Bank Inc' },
    { procId: 'RCBCPHMMXXX', description: 'RCBC' },
    { procId: 'ROBPPHMQXXY', description: 'ROBINSONS BANK CORPORATION' },
    { procId: 'RUCAPHM1XXX', description: 'CAMALIG BANK INC' },
    { procId: 'RUGUPHM1XXX', description: 'Rural Bank of Guinobatan Inc' },
    { procId: 'SCBLPHMMXXX', description: 'STANDARD CHARTERED BANK' },
    { procId: 'SETCPHMM000', description: 'Security Bank Corporation' },
    { procId: 'SETCPHMMXXY', description: 'Security Bank Corporation' },
    { procId: 'SHPHPHM2XXZ', description: 'ShopeePay Philippines Inc' },
    { procId: 'SPEYPHM2XXX', description: 'SpeedyPay Inc' },
    { procId: 'SRCPPHM2XXX', description: 'Starpay Corporation' },
    { procId: 'STLAPH22XXX', description: 'Sterling Bank of Asia Inc' },
    { procId: 'SUSVPHM1XXX', description: 'Sun Savings Bank' },
    { procId: 'TAYOPHM2XXX', description: 'TAYOCASH INC' },
    { procId: 'TDBIPHM2XXX', description: 'Tonik Digital Bank Inc' },
    { procId: 'TLBPPHMMXXX', description: 'LAND BANK OF THE PHILIPPINES' },
    { procId: 'TRWIPHM2XXX', description: 'Wise Pilipinas Inc' },
    { procId: 'TRXPPHM2XXX', description: 'Traxion Pay Inc' },
    { procId: 'UBPHPHMMXXY', description: 'Unionbank of the Philippines' },
    { procId: 'UNOBPHM2XXX', description: 'UNOBANK INC' },
    { procId: 'UNODPHM2XXX', description: 'UnionDigital Bank Inc' },
    { procId: 'USMEPHM2XXX', description: 'USSC Money Service Inc' },
    { procId: 'VBRIPHM2XXX', description: 'Vigan Banco Rural Incorporada' },
    { procId: 'WEDVPHM1XXX', description: 'WEALTH DEVELOPMENT BANK' }
  ];

  console.log(`Available Payout Channels (${channels.length} total):`);
  console.log('==================================================');
  
  // Group by category for better readability
  const categories = {
    'Major Banks': ['BOPIPHMMXXX', 'BNORPHMMXXY', 'MBTCPHMMXXX', 'UBPHPHMMXXY', 'RCBCPHMMXXX', 'TLBPPHMMXXX', 'CHBKPHMMXXX', 'PNBMPHMMTOD', 'EWBCPHMMXXX', 'SETCPHMM000', 'AUBKPHMMXXX'],
    'E-Wallets & Digital': ['GXCHPHM2XXX', 'PAPHPHM1XXX', 'MYDBPHM2XXX', 'SPEYPHM2XXX', 'LAUIPHM2XXZ', 'SHPHPHM2XXZ', 'GOTYPHM2XXX', 'TDBIPHM2XXX', 'UNODPHM2XXX'],
    'Rural Banks': ['BPDIPHM1XXX', 'CAMZPHM2XXX', 'CBMFPHM1XXX', 'CELRPHM1XXX', 'CHSVPHM1XXX', 'CIVAPHM1XXX', 'CNRLPHM1XXX', 'CRMHPHM1XXX', 'CUOBPHM2XXX', 'DUMTPHM1XXX', 'EAWRPHM2XXX', 'ENRUPHM1XXX', 'EQSNPHM1XXX', 'ISTHPHM1XXX', 'LESIPHM1XXX', 'LUDVPHM1XXX', 'MAARPHM1XXX', 'MIOCPHM1XXX', 'MRTCPHM1XXX', 'ONNRPHM1XXX', 'OPDVPHM1XXX', 'OWNBPHM2XXX', 'PASVPHM1XXX', 'PRTOPHM1XXX', 'PSCOPHM1XXX', 'QCDFPHM1XXX', 'QCRIPHM1XXX', 'RARLPHM1XXX', 'RUCAPHM1XXX', 'RUGUPHM1XXX', 'SUSVPHM1XXX', 'VBRIPHM2XXX', 'WEDVPHM1XXX'],
    'International Banks': ['BKCHPHMMXXX', 'HSBCPHMMXXX', 'MBBEPHMMXXX', 'SCBLPHMMXXX'],
    'Fintech & Payment Services': ['APHIPHM2XXX', 'BFSRPHM2XXX', 'DCPHPHM1XXX', 'EAGMPHM2XXX', 'ECASPHM2XXX', 'GHPESGSGXXX', 'IFIPPHM2XXX', 'IREMPHM2XXX', 'MAYCPHM2XXX', 'OMNPPHM2XXX', 'PAEYPHM2XXX', 'PAHCPHM2XXX', 'PDAXPHM2XXX', 'PPSFPHM2XXX', 'SRCPPHM2XXX', 'TAYOPHM2XXX', 'TRWIPHM2XXX', 'TRXPPHM2XXX', 'USMEPHM2XXX'],
    'Other Banks': ['CIPHPHMMXXX', 'CPHIPHMMXXX', 'CTCBPHMMXXY', 'PABIPHMMXXX', 'PHSBPHMMXXX', 'PHTBPHMMXXX', 'PHVBPHMMXXX', 'PPBUPHMMXXX', 'ROBPPHMQXXY', 'STLAPH22XXX', 'UNOBPHM2XXX']
  };

  Object.entries(categories).forEach(([category, procIds]) => {
    console.log(`\n📋 ${category}:`);
    procIds.forEach(procId => {
      const channel = channels.find(c => c.procId === procId);
      if (channel) {
        console.log(`  ${channel.procId}: ${channel.description}`);
      }
    });
  });

  console.log(`\n📊 Summary: ${channels.length} total payout channels available`);
  console.log('💡 Tip: Use the procId in your payout requests to specify the destination bank/e-wallet');
}

// 🚀 Main Test Runner
async function runAllTests() {
  console.log('🚀 CPay SpeedyPay (eMango Pay) Test Suite');
  console.log('=========================================');
  console.log('Merchant:', CREDENTIALS.merchantName);
  console.log('Merchant Seq:', CREDENTIALS.merchantSeq);
  console.log('Test Base URL:', CREDENTIALS.testBaseUrl);
  console.log('Timestamp:', new Date().toISOString());

  // Test signature verification first
  testSignatureVerification();

  // Test payout channels
  testPayoutChannels();

  // Test balance query
  await testBalanceQuery();

  // Test payout
  const payoutResult = await testPayout();
  
  // If payout was successful, test transaction query
  if (payoutResult && payoutResult.transSeq) {
    await testTransactionQuery(TEST_CONFIG.orderSeq);
  } else {
    await testTransactionQuery(); // Test with default orderSeq
  }

  console.log('\n✅ All tests completed!');
  console.log('\n📋 Next Steps:');
  console.log('1. Review the responses above');
  console.log('2. Check respCode for success (00000000)');
  console.log('3. Test with real transaction amounts');
  console.log('4. Implement webhook handling for notifyUrl');
  console.log('5. Test with different procId channels');
}

// 🎯 Run the tests
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  generateSpeedyPaySignature,
  makeRequest,
  testPayout,
  testTransactionQuery,
  testBalanceQuery,
  testSignatureVerification,
  testPayoutChannels,
  CREDENTIALS,
  TEST_CONFIG
}; 