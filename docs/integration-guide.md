# CPay Integration Guide

Welcome to the CPay Integration Guide! This comprehensive guide will help you integrate CPay's payment services into your application quickly and securely.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Authentication](#authentication)
3. [SDK Installation](#sdk-installation)
4. [Basic Integration](#basic-integration)
5. [Payment Processing](#payment-processing)
6. [Webhook Integration](#webhook-integration)
7. [Testing](#testing)
8. [Production Deployment](#production-deployment)
9. [Best Practices](#best-practices)
10. [Troubleshooting](#troubleshooting)

## Getting Started

### Prerequisites

- Node.js 16+ or Python 3.8+
- HTTPS endpoint for webhooks
- Valid business registration
- CPay partner account

### Quick Start

1. **Sign up for a CPay Partner Account**
   - Visit [partner.cpay.com](https://partner.cpay.com)
   - Complete the self-service registration
   - Verify your business (KYB process)

2. **Get Your API Credentials**
   - Access your partner dashboard
   - Navigate to Developer → API Keys
   - Copy your test and live API keys

3. **Install the SDK**
   ```bash
   # Node.js
   npm install @cpay/nodejs-sdk
   
   # Python
   pip install cpay-python-sdk
   ```

## Authentication

All API requests require authentication using your API secret key.

### Direct API Call Example
```javascript
const CPAY_API_URL = 'https://asia-southeast1-applez-dch9v.cloudfunctions.net/cpayDispatcher';

async function callCPayAPI(action, payload, authToken) {
  const response = await fetch(CPAY_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}` // Firebase Auth token
    },
    body: JSON.stringify({
      action: action,
      payload: payload
    })
  });
  
  if (!response.ok) {
    throw new Error(`CPay API error: ${response.status}`);
  }
  
  return response.json();
}
```

### Node.js Helper Class
```javascript
class CPayAPI {
  constructor(baseURL = 'https://asia-southeast1-applez-dch9v.cloudfunctions.net/cpayDispatcher') {
    this.baseURL = baseURL;
  }
  
  async request(action, payload, authToken) {
    const response = await fetch(this.baseURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ action, payload })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'API request failed');
    }
    
    return data;
  }
}

const cpay = new CPayAPI();
```

## SDK Installation

### Node.js SDK

```bash
npm install @cpay/nodejs-sdk
```

```javascript
const { CPaySDK } = require('@cpay/nodejs-sdk');

const cpay = new CPaySDK({
  secretKey: process.env.CPAY_SECRET_KEY,
  environment: process.env.CPAY_ENVIRONMENT || 'test'
});

// Test connection
const isConnected = await cpay.testConnection();
console.log('Connected:', isConnected);
```

### Python SDK

```bash
pip install cpay-python-sdk
```

```python
from cpay import CPaySDK

cpay = CPaySDK(
    secret_key=os.getenv('CPAY_SECRET_KEY'),
    environment=os.getenv('CPAY_ENVIRONMENT', 'test')
)

# Test connection
is_connected = cpay.test_connection()
print(f"Connected: {is_connected}")
```

## Basic Integration

### 1. Initialize the SDK

```javascript
// Node.js
const { CPaySDK } = require('@cpay/nodejs-sdk');

const cpay = new CPaySDK({
  secretKey: 'sk_test_your_secret_key_here',
  environment: 'test'
});

// Test your connection
const isConnected = await cpay.testConnection();
if (!isConnected) {
  throw new Error('Failed to connect to CPay API');
}
```

### 2. Get User Wallet Balance

```javascript
// Get wallet balance
const balance = await cpay.request('getWalletBalance', {
  uid: 'user_123'
}, userAuthToken);

console.log('Balance:', balance.balances);
// Output: { PHP: 15000.50, KRW: 250000 }
```

### 3. Get User Profile

```javascript
// Get user profile  
const profile = await cpay.request('getUserProfile', {
  uid: 'user_123'
}, userAuthToken);

console.log('Profile:', profile);
// Output: { uid: 'user_123', displayName: 'John Doe', email: 'john@example.com', ... }
```

## Payment Processing

### P2P Transfer

```javascript
// Send money to another user
const transaction = await cpay.request('initiateP2PTransfer', {
  senderUid: 'user_123',
  receiverMobileNumber: '+639123456789',
  amount: 1000,
  currency: 'PHP',
  description: 'Payment for services'
}, userAuthToken);

console.log('Transaction:', transaction);
// Output: { transactionId: 'txn_123', status: 'PENDING', ... }
```

### Bank Transfer (InstaPay)

```javascript
// Send money to any Philippine bank
const transaction = await cpay.request('initiateInstaPayTransfer', {
  uid: 'user_123',
  amount: 1500,
  currency: 'PHP',
  bankCode: 'BDO',
  accountNumber: '1234567890',
  accountName: 'Jane Smith',
  description: 'Payment for goods'
}, userAuthToken);
```

### International Remittance

```javascript
// Send money to Korea
const transaction = await cpay.request('initiateRemittance', {
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
}, userAuthToken);
```

### Bill Payment

```javascript
// Pay utility bills
const transaction = await cpay.request('initiateBillPayment', {
  uid: 'user_123',
  amount: 2500,
  currency: 'PHP',
  billType: 'electricity',
  provider: 'Meralco',
  accountNumber: '1234567890',
  customerName: 'John Doe',
  dueDate: '2024-01-15'
}, userAuthToken);
```

### Mobile Load Purchase

```javascript
// Buy mobile load
const transaction = await cpay.request('initiateBuyLoad', {
  uid: 'user_123',
  amount: 100,
  currency: 'PHP',
  mobileNumber: '+639123456789',
  provider: 'Smart',
  loadType: 'Regular'
}, userAuthToken);
```

## Webhook Integration

### 1. Set Up Webhook Endpoint

Create an endpoint to receive webhook events:

```javascript
// Express.js example
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
    // Verify webhook signature
    const event = cpay.parseWebhookEvent(payload, signature, 'your_webhook_secret');
    
    // Handle different event types
    switch (event.type) {
      case 'payment.succeeded':
        console.log('Payment succeeded:', event.data);
        // Update your database, send confirmation email, etc.
        break;
        
      case 'payment.failed':
        console.log('Payment failed:', event.data);
        // Handle failed payment
        break;
        
      case 'transfer.completed':
        console.log('Transfer completed:', event.data);
        // Update transfer status
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

### 2. Configure Webhook URL

In your CPay partner dashboard:

1. Go to Developer → Webhooks
2. Set your webhook URL: `https://your-domain.com/webhooks/cpay`
3. Select the events you want to receive
4. Copy your webhook signing secret

### 3. Webhook Event Types

| Event Type | Description | When Triggered |
|------------|-------------|----------------|
| `payment.succeeded` | Payment completed successfully | After successful payment processing |
| `payment.failed` | Payment failed | When payment processing fails |
| `transfer.completed` | Transfer completed | After successful bank transfer |
| `kyc.verified` | KYC verification completed | When user KYC is approved |
| `kyc.rejected` | KYC verification rejected | When user KYC is rejected |
| `payout.initiated` | Payout initiated | When partner initiates payout |
| `payout.completed` | Payout completed | When payout is successful |
| `payout.failed` | Payout failed | When payout fails |

### 4. Webhook Security

Always verify webhook signatures:

```javascript
// Verify webhook signature
const isValid = cpay.verifyWebhookSignature(
  payload,
  signature,
  webhookSecret
);

if (!isValid) {
  throw new Error('Invalid webhook signature');
}
```

## Testing

### 1. Test Environment

Use the test environment for development:

```javascript
const cpay = new CPaySDK({
  secretKey: 'sk_test_your_test_key_here',
  environment: 'test'
});
```

### 2. Test Transactions

```javascript
// Test P2P transfer
const testTransaction = await cpay.initiateP2PTransfer({
  senderUid: 'test_user_123',
  receiverMobileNumber: '+639123456789',
  amount: 100,
  currency: 'PHP',
  description: 'Test payment'
});

console.log('Test transaction:', testTransaction);
```

### 3. Test Webhooks

Use the webhook testing tool in your partner dashboard:

1. Go to Developer → Webhooks → Testing
2. Select an event type
3. Click "Send Test Event"
4. Check your webhook endpoint receives the event

### 4. Test Data

Use these test values:

- **Test User ID**: `test_user_123`
- **Test Mobile Number**: `+639123456789`
- **Test Amounts**: 100, 500, 1000 PHP
- **Test Bank Codes**: `BDO`, `BPI`, `MBTC`

## Production Deployment

### 1. Environment Setup

```bash
# Production environment variables
CPAY_SECRET_KEY=sk_live_your_live_key_here
CPAY_ENVIRONMENT=live
CPAY_WEBHOOK_SECRET=whsec_your_live_webhook_secret
```

### 2. Security Checklist

- [ ] Use HTTPS for all webhook endpoints
- [ ] Verify webhook signatures
- [ ] Implement idempotency
- [ ] Use environment variables for secrets
- [ ] Enable rate limiting
- [ ] Monitor webhook delivery
- [ ] Implement retry logic

### 3. Monitoring

```javascript
// Monitor webhook delivery
app.post('/webhooks/cpay', (req, res) => {
  const startTime = Date.now();
  
  try {
    // Process webhook
    const event = cpay.parseWebhookEvent(payload, signature, secret);
    
    // Log success
    console.log(`Webhook processed: ${event.type} in ${Date.now() - startTime}ms`);
    
    res.json({ received: true });
  } catch (error) {
    // Log error
    console.error(`Webhook error: ${error.message} in ${Date.now() - startTime}ms`);
    res.status(400).send('Error');
  }
});
```

## Best Practices

### 1. Error Handling

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

### 2. Idempotency

```javascript
// Use unique IDs to prevent duplicate transactions
const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const transaction = await cpay.initiateP2PTransfer({
  senderUid: 'user_123',
  receiverMobileNumber: '+639123456789',
  amount: 1000,
  currency: 'PHP',
  idempotencyKey: transactionId
});
```

### 3. Rate Limiting

```javascript
// Implement rate limiting
const rateLimiter = new Map();

function checkRateLimit(userId, limit = 100, windowMs = 60000) {
  const now = Date.now();
  const userRequests = rateLimiter.get(userId) || [];
  
  // Remove old requests
  const recentRequests = userRequests.filter(time => now - time < windowMs);
  
  if (recentRequests.length >= limit) {
    throw new Error('Rate limit exceeded');
  }
  
  recentRequests.push(now);
  rateLimiter.set(userId, recentRequests);
}
```

### 4. Logging

```javascript
// Comprehensive logging
const logger = {
  info: (message, data) => console.log(`[INFO] ${message}`, data),
  error: (message, error) => console.error(`[ERROR] ${message}`, error),
  warn: (message, data) => console.warn(`[WARN] ${message}`, data)
};

// Log all API calls
const originalRequest = cpay.request.bind(cpay);
cpay.request = async function(action, data) {
  logger.info(`API Call: ${action}`, data);
  
  try {
    const result = await originalRequest(action, data);
    logger.info(`API Success: ${action}`, result);
    return result;
  } catch (error) {
    logger.error(`API Error: ${action}`, error);
    throw error;
  }
};
```

## Troubleshooting

### Common Issues

#### 1. Authentication Errors

**Problem**: `401 Unauthorized`
**Solution**: Check your API key and ensure it's correct for the environment (test/live)

#### 2. Webhook Signature Verification Fails

**Problem**: `Invalid webhook signature`
**Solution**: 
- Verify you're using the correct webhook secret
- Ensure the payload hasn't been modified
- Check that you're reading the raw body

#### 3. Rate Limit Exceeded

**Problem**: `429 Too Many Requests`
**Solution**: Implement rate limiting and retry with exponential backoff

#### 4. Invalid Parameters

**Problem**: `400 Bad Request`
**Solution**: Check the API documentation for required parameters and their formats

### Debug Mode

Enable debug mode for detailed logging:

```javascript
const cpay = new CPaySDK({
  secretKey: 'sk_test_your_secret_key_here',
  environment: 'test',
  debug: true // Enable debug logging
});
```

### Support

- **Documentation**: [docs.cpay.com](https://docs.cpay.com)
- **API Reference**: [docs.cpay.com/api](https://docs.cpay.com/api)
- **Support Email**: support@cpay.com
- **Status Page**: [status.cpay.com](https://status.cpay.com)

## Next Steps

1. **Complete the integration** using the examples above
2. **Test thoroughly** in the test environment
3. **Set up monitoring** and alerting
4. **Go live** with production credentials
5. **Monitor performance** and optimize as needed

For additional help, check out our [Postman Collection](docs/CPay_API_Postman_Collection.json) and [SDK Examples](https://github.com/cpay/sdk-examples). 