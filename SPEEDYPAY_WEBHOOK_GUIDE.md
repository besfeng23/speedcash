# 🔄 SpeedyPay Webhook Implementation Guide

## 📋 **Overview**

This guide covers the complete webhook implementation for handling SpeedyPay (eMango Pay) transaction updates in real-time. The webhook system ensures that your CPay application stays synchronized with transaction status changes.

## 🏗️ **Architecture**

### **Components**
1. **Webhook Handler** (`speedypayWebhook`) - Main endpoint for receiving updates
2. **Signature Verification** - SHA256 HMAC validation
3. **Transaction Processing** - Database updates and notifications
4. **Monitoring & Analytics** - Performance tracking and statistics
5. **Health Checks** - System status monitoring

### **Data Flow**
```
SpeedyPay API → Webhook → Signature Verification → Database Update → Notifications
```

## 🔐 **Security Implementation**

### **Signature Verification Process**
1. **Filter Parameters**: Remove null values and sign field
2. **Sort Alphabetically**: Sort remaining parameters by key
3. **Concatenate**: Join key-value pairs with `&`
4. **Append Secret**: Add secret key to the end
5. **Generate Hash**: Create SHA256 hash
6. **Compare**: Verify against received signature

### **Security Features**
- ✅ **SHA256 HMAC Verification**
- ✅ **Merchant ID Validation**
- ✅ **Request Method Validation**
- ✅ **Comprehensive Error Handling**
- ✅ **Audit Logging**

## 📊 **Transaction States**

| Code | State | Description |
|------|-------|-------------|
| `00` | SUCCESS | Transaction completed successfully |
| `01` | FAILED | Transaction failed |
| `03` | PARTIAL_REFUND | Partial refund processed |
| `04` | FULL_REFUND | Full refund processed |
| `05` | FAILED_REFUND | Refund failed |
| `06` | IN_PROCESS | Transaction being processed |
| `07` | ORDER_TO_BE_PAID | Order pending payment |
| `08` | CANCELLED | Transaction cancelled |
| `09` | EXPIRED | Transaction expired |

## 🌐 **API Endpoints**

### **1. Main Webhook Handler**
```
POST /speedypayWebhook
```
**Purpose**: Receive transaction updates from SpeedyPay

**Request Body**:
```json
{
  "signType": "SHA256",
  "sign": "generated_signature",
  "timestamp": "2025-07-22 10:15:40",
  "merchSeq": "300000064613",
  "orderSeq": "TEST123456",
  "transSeq": "TRANS789012",
  "transState": "00",
  "amount": "1000.00",
  "currency": "PHP",
  "procId": "BOPIPHMMXXX",
  "procDetail": "1234567890",
  "purposes": "Salary Payment",
  "firstName": "John",
  "lastName": "Doe",
  "mobilePhone": "09123456789",
  "createTime": "2025-07-22 10:15:40",
  "notifyTime": "2025-07-22 10:16:00",
  "respCode": "00000000",
  "respMessage": "Transaction successful"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Webhook processed successfully",
  "timestamp": "2025-07-22T10:16:00.000Z",
  "processingTime": 150
}
```

### **2. Health Check**
```
GET /speedypayWebhookHealth
```
**Purpose**: Check webhook system status

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2025-07-22T10:15:40.000Z",
  "config": {
    "merchantSeq": "300000064613",
    "webhookPath": "/webhook/speedypay"
  },
  "transactionStates": 9,
  "signatureAlgorithm": "SHA256"
}
```

### **3. Statistics**
```
GET /speedypayWebhookStats
```
**Purpose**: Get webhook processing statistics

**Response**:
```json
{
  "success": true,
  "stats": {
    "totalWebhooks": 150,
    "successfulTransactions": 120,
    "failedTransactions": 20,
    "pendingTransactions": 10,
    "last24Hours": {
      "total": 25,
      "success": 20,
      "failed": 5
    }
  },
  "timestamp": "2025-07-22T10:15:40.000Z"
}
```

### **4. Test Data Generator**
```
GET /speedypayWebhookTest
```
**Purpose**: Generate test webhook data for testing

**Response**:
```json
{
  "success": true,
  "message": "Test webhook data generated",
  "webhookData": {
    "signType": "SHA256",
    "sign": "generated_signature",
    "timestamp": "2025-07-22 10:15:40",
    "merchSeq": "300000064613",
    "orderSeq": "TEST_1753151014314",
    "transSeq": "TRANS_1753151014314",
    "transState": "06",
    "amount": "100.00",
    "currency": "PHP",
    "procId": "GXCHPHM2XXX",
    "procDetail": "09123456789",
    "purposes": "Test Payout",
    "firstName": "John",
    "lastName": "Doe",
    "mobilePhone": "09123456789",
    "createTime": "2025-07-22 10:15:40",
    "notifyTime": "2025-07-22 10:15:40",
    "respCode": "00000000",
    "respMessage": "Success"
  },
  "instructions": "Use this data to test the webhook endpoint",
  "timestamp": "2025-07-22T10:15:40.000Z"
}
```

## 🔧 **Configuration**

### **Environment Variables**
```bash
# SpeedyPay Configuration
SPEEDYPAY_SECRET_KEY=uck6lo8sdjaarqf3sohdoovdvvn0kdnk
SPEEDYPAY_MERCHANT_SEQ=300000064613

# Firebase Configuration (auto-detected)
FIREBASE_PROJECT_ID=applez-dch9v
FIREBASE_REGION=us-central1
```

### **Firebase Functions Configuration**
```json
{
  "functions": {
    "source": "functions",
    "runtime": "nodejs18",
    "region": "us-central1"
  }
}
```

## 🧪 **Testing**

### **1. Run Complete Test Suite**
```bash
node test-speedypay-webhook.js
```

### **2. Individual Tests**
```javascript
const { testSuccessWebhook, testFailedWebhook } = require('./test-speedypay-webhook.js');

// Test success webhook
await testSuccessWebhook();

// Test failed webhook
await testFailedWebhook();
```

### **3. Manual Testing with cURL**
```bash
# Health check
curl -X GET "https://us-central1-applez-dch9v.cloudfunctions.net/speedypayWebhookHealth"

# Send test webhook
curl -X POST "https://us-central1-applez-dch9v.cloudfunctions.net/speedypayWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "signType": "SHA256",
    "sign": "generated_signature",
    "timestamp": "2025-07-22 10:15:40",
    "merchSeq": "300000064613",
    "orderSeq": "TEST123456",
    "transSeq": "TRANS789012",
    "transState": "00",
    "amount": "1000.00",
    "currency": "PHP",
    "procId": "BOPIPHMMXXX",
    "procDetail": "1234567890",
    "purposes": "Test Payment",
    "firstName": "John",
    "lastName": "Doe",
    "mobilePhone": "09123456789",
    "respCode": "00000000",
    "respMessage": "Success"
  }'
```

## 📊 **Monitoring & Analytics**

### **Metrics Tracked**
- **Webhook Reception Rate**
- **Processing Time**
- **Success/Failure Rates**
- **Transaction State Distribution**
- **Error Rates**

### **Alerts**
- **High Error Rate**: >5% webhook failures
- **Slow Processing**: >5 seconds average
- **Invalid Signatures**: Security alerts
- **Orphaned Webhooks**: Missing transactions

### **Logs**
- **Info**: Successful webhook processing
- **Warning**: Orphaned webhooks
- **Error**: Invalid signatures, processing failures
- **Audit**: All security events

## 🔔 **Notifications**

### **Success Notifications**
- **Email**: Transaction completion confirmation
- **Push**: Mobile app notification
- **SMS**: Optional SMS confirmation

### **Failure Notifications**
- **Email**: Transaction failure details
- **Admin Alert**: Critical failure notification
- **Retry Logic**: Automatic retry for transient failures

### **Admin Alerts**
- **Failed Transactions**: Immediate notification
- **Cancelled Orders**: Business impact alerts
- **Expired Transactions**: System health alerts

## 🚀 **Deployment**

### **1. Deploy to Firebase Functions**
```bash
# Deploy all functions
firebase deploy --only functions

# Deploy specific function
firebase deploy --only functions:speedypayWebhook
```

### **2. Set Environment Variables**
```bash
firebase functions:config:set speedypay.secret_key="uck6lo8sdjaarqf3sohdoovdvvn0kdnk"
firebase functions:config:set speedypay.merchant_seq="300000064613"
```

### **3. Configure Webhook URL**
Update your SpeedyPay dashboard with the webhook URL:
```
https://us-central1-applez-dch9v.cloudfunctions.net/speedypayWebhook
```

## 🔍 **Troubleshooting**

### **Common Issues**

#### **1. Invalid Signature Error**
**Symptoms**: 401 Unauthorized response
**Causes**: 
- Incorrect secret key
- Malformed request data
- Clock skew

**Solutions**:
- Verify secret key configuration
- Check request data format
- Ensure timestamp accuracy

#### **2. Transaction Not Found**
**Symptoms**: Orphaned webhook warnings
**Causes**:
- Transaction not created in database
- OrderSeq mismatch

**Solutions**:
- Verify transaction creation
- Check OrderSeq consistency
- Review database queries

#### **3. Slow Processing**
**Symptoms**: High processing times
**Causes**:
- Database connection issues
- High load
- Network latency

**Solutions**:
- Optimize database queries
- Scale Firebase Functions
- Monitor resource usage

### **Debug Commands**
```bash
# Check function logs
firebase functions:log --only speedypayWebhook

# Test webhook health
curl -X GET "https://us-central1-applez-dch9v.cloudfunctions.net/speedypayWebhookHealth"

# Monitor real-time logs
firebase functions:log --follow
```

## 📈 **Performance Optimization**

### **Best Practices**
1. **Async Processing**: Non-blocking webhook handling
2. **Batch Updates**: Group database operations
3. **Connection Pooling**: Optimize database connections
4. **Caching**: Cache frequently accessed data
5. **Monitoring**: Real-time performance tracking

### **Scaling Considerations**
- **Auto-scaling**: Firebase Functions auto-scale
- **Memory Allocation**: Optimize function memory
- **Timeout Settings**: Configure appropriate timeouts
- **Concurrency**: Handle multiple webhooks simultaneously

## 🔒 **Security Best Practices**

### **Data Protection**
- **Encryption**: All sensitive data encrypted
- **Access Control**: Role-based permissions
- **Audit Logging**: Complete audit trail
- **Input Validation**: Strict data validation

### **Network Security**
- **HTTPS Only**: All communications encrypted
- **Signature Verification**: Every request verified
- **Rate Limiting**: Prevent abuse
- **IP Whitelisting**: Optional IP restrictions

## 📞 **Support**

### **Monitoring Dashboard**
Access real-time monitoring at:
```
https://console.firebase.google.com/project/applez-dch9v/functions
```

### **Logs & Debugging**
```bash
# View recent logs
firebase functions:log --only speedypayWebhook --limit 50

# Filter by error level
firebase functions:log --only speedypayWebhook --level error
```

### **Contact Information**
- **Technical Issues**: Check Firebase Console
- **SpeedyPay Support**: Contact SpeedyPay technical team
- **CPay Development**: Internal development team

---

**Last Updated**: 2025-07-22
**Version**: 1.0
**Status**: Production Ready 