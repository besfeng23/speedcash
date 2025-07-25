# CPay Node.js SDK

Official Node.js SDK for the CPay Payment Platform API. This SDK provides a simple and intuitive way to integrate CPay's payment services into your Node.js applications.

## Features

- 🚀 **Easy Integration**: Simple API methods for all CPay services
- 🔒 **Secure**: Built-in webhook signature verification
- 📝 **TypeScript Support**: Full TypeScript definitions included
- 🧪 **Test Environment**: Support for both test and live environments
- 📚 **Comprehensive**: Covers all CPay API endpoints

## Installation

```bash
npm install @cpay/nodejs-sdk
```

## Quick Start

```javascript
const { CPaySDK } = require('@cpay/nodejs-sdk');

// Initialize the SDK
const cpay = new CPaySDK({
  secretKey: 'sk_test_your_secret_key_here',
  environment: 'test' // or 'live'
});

// Test your connection
const isConnected = await cpay.testConnection();
console.log('Connected:', isConnected);

// Get wallet balance
const balance = await cpay.getWalletBalance('user_123');
console.log('Balance:', balance.balances);
```

## Configuration

```javascript
const config = {
  secretKey: 'sk_test_your_secret_key_here', // Required
  environment: 'test', // Optional: 'test' or 'live' (default: 'test')
  baseUrl: 'https://custom-api-url.com', // Optional: custom API URL
  timeout: 30000 // Optional: request timeout in milliseconds (default: 30000)
};

const cpay = new CPaySDK(config);
```

## API Methods

### Wallet Operations

#### Get Wallet Balance
```javascript
const balance = await cpay.getWalletBalance('user_123');
// Returns: { balances: { PHP: 15000.50, KRW: 250000 } }
```

#### Get User Profile
```javascript
const profile = await cpay.getUserProfile('user_123');
// Returns user information including KYC status
```

### Transaction Operations

#### P2P Transfer
```javascript
const transaction = await cpay.initiateP2PTransfer({
  senderUid: 'user_123',
  receiverMobileNumber: '+639123456789',
  amount: 1000,
  currency: 'PHP',
  description: 'Payment for services'
});
```

#### Cash In
```javascript
const transaction = await cpay.initiateCashIn({
  uid: 'user_123',
  amount: 5000,
  currency: 'PHP',
  method: 'bank_transfer',
  bankCode: 'BDO',
  accountNumber: '1234567890'
});
```

#### Cash Out
```javascript
const transaction = await cpay.initiateCashOut({
  uid: 'user_123',
  amount: 2000,
  currency: 'PHP',
  method: 'instapay',
  bankCode: 'BDO',
  accountNumber: '1234567890',
  accountName: 'John Doe'
});
```

#### InstaPay Transfer
```javascript
const transaction = await cpay.initiateInstaPayTransfer({
  uid: 'user_123',
  amount: 1500,
  currency: 'PHP',
  bankCode: 'BDO',
  accountNumber: '1234567890',
  accountName: 'Jane Smith',
  description: 'Payment for goods'
});
```

#### PesoNet Transfer
```javascript
const transaction = await cpay.initiatePesoNetTransfer({
  uid: 'user_123',
  amount: 3000,
  currency: 'PHP',
  bankCode: 'BPI',
  accountNumber: '0987654321',
  accountName: 'Bob Johnson',
  description: 'Business payment'
});
```

#### International Remittance
```javascript
const transaction = await cpay.initiateRemittance({
  uid: 'user_123',
  amount: 50000,
  currency: 'PHP',
  recipientName: 'Kim Min-jun',
  recipientPhone: '+82-10-1234-5678',
  recipientAddress: '123 Gangnam-gu, Seoul, South Korea',
  recipientBank: 'Shinhan Bank',
  recipientAccount: '123-456-789012',
  purpose: 'Family support',
  description: 'Monthly remittance to family'
});
```

#### Buy Load
```javascript
const transaction = await cpay.initiateBuyLoad({
  uid: 'user_123',
  amount: 100,
  currency: 'PHP',
  mobileNumber: '+639123456789',
  provider: 'Smart',
  loadType: 'Regular'
});
```

#### Bill Payment
```javascript
const transaction = await cpay.initiateBillPayment({
  uid: 'user_123',
  amount: 2500,
  currency: 'PHP',
  billType: 'electricity',
  provider: 'Meralco',
  accountNumber: '1234567890',
  customerName: 'John Doe',
  dueDate: '2024-01-15'
});
```

#### Get Transaction History
```javascript
const history = await cpay.getTransactionHistory({
  uid: 'user_123',
  limit: 10,
  offset: 0,
  type: 'all'
});
// Returns: { transactions: [...] }
```

### KYC Operations

#### Submit KYC
```javascript
const kyc = await cpay.submitKyc({
  fullName: 'John Doe',
  dateOfBirth: '1990-01-01',
  address: '123 Main Street, Manila, Philippines',
  documentUrls: [
    'https://example.com/id_front.jpg',
    'https://example.com/id_back.jpg'
  ]
});
```

### Partner Operations

#### Get Dashboard Stats
```javascript
const stats = await cpay.getPartnerDashboardStats();
// Returns partner statistics and metrics
```

#### Initiate Test Payout
```javascript
const result = await cpay.initiateTestPayout({
  partnerId: 'partner_123',
  amount: 5000,
  channel: 'instapay',
  accountNumber: '1234567890',
  accountName: 'Partner Business'
});
```

### Webhook Operations

#### Verify Webhook Signature
```javascript
const isValid = cpay.verifyWebhookSignature(
  payload,
  signature,
  webhookSecret
);
```

#### Parse Webhook Event
```javascript
const event = cpay.parseWebhookEvent(
  payload,
  signature,
  webhookSecret
);
```

## Webhook Integration

### Express.js Example
```javascript
const express = require('express');
const { CPaySDK } = require('@cpay/nodejs-sdk');

const app = express();
const cpay = new CPaySDK({
  secretKey: 'sk_test_your_secret_key_here'
});

app.post('/webhooks/cpay', express.raw({ type: 'application/json' }), (req, res) => {
  const signature = req.headers['x-cpay-signature'];
  const payload = req.body.toString();
  
  try {
    const event = cpay.parseWebhookEvent(payload, signature, 'your_webhook_secret');
    
    switch (event.type) {
      case 'payment.succeeded':
        console.log('Payment succeeded:', event.data);
        break;
      case 'payment.failed':
        console.log('Payment failed:', event.data);
        break;
      default:
        console.log('Unhandled event type:', event.type);
    }
    
    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).send('Webhook signature verification failed');
  }
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

## Error Handling

```javascript
try {
  const transaction = await cpay.initiateP2PTransfer({
    senderUid: 'user_123',
    receiverMobileNumber: '+639123456789',
    amount: 1000,
    currency: 'PHP'
  });
} catch (error) {
  if (error.name === 'CPayError') {
    console.error('CPay Error:', error.message);
    console.error('Status Code:', error.statusCode);
    console.error('Details:', error.details);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## TypeScript Support

```typescript
import { CPaySDK, WalletBalance, Transaction } from '@cpay/nodejs-sdk';

const cpay = new CPaySDK({
  secretKey: 'sk_test_your_secret_key_here'
});

async function getBalance(uid: string): Promise<WalletBalance> {
  return await cpay.getWalletBalance(uid);
}

async function sendMoney(params: {
  senderUid: string;
  receiverMobileNumber: string;
  amount: number;
  currency: 'PHP' | 'KRW';
}): Promise<Transaction> {
  return await cpay.initiateP2PTransfer(params);
}
```

## Testing

```javascript
// Test your API connection
const isConnected = await cpay.testConnection();
if (isConnected) {
  console.log('✅ API connection successful');
} else {
  console.log('❌ API connection failed');
}

// Get SDK configuration
const config = cpay.getConfig();
console.log('SDK Config:', config);
```

## Environment Variables

```bash
# .env file
CPAY_SECRET_KEY=sk_test_your_secret_key_here
CPAY_ENVIRONMENT=test
CPAY_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

```javascript
require('dotenv').config();

const cpay = new CPaySDK({
  secretKey: process.env.CPAY_SECRET_KEY,
  environment: process.env.CPAY_ENVIRONMENT
});
```

## Support

- **Documentation**: https://docs.cpay.com/sdk/nodejs
- **API Reference**: https://docs.cpay.com/api
- **Support**: support@cpay.com
- **GitHub Issues**: https://github.com/cpay/sdk-nodejs/issues

## License

MIT License - see [LICENSE](LICENSE) file for details. 