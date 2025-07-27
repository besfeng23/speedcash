# 🚀 SpeedyPay Webhook Deployment Guide

## 📋 **Overview**

This guide provides step-by-step instructions for deploying the SpeedyPay webhook functions to Firebase Functions, including troubleshooting for common deployment issues.

## 🔧 **Prerequisites**

### **1. Firebase CLI Setup**
```bash
# Install Firebase CLI globally
npm install -g firebase-tools

# Login to Firebase
firebase login

# Verify project access
firebase projects:list
```

### **2. Project Configuration**
Ensure you have the correct Firebase project selected:
```bash
# Set the project
firebase use applez-dch9v

# Verify project configuration
firebase projects:list
```

## 🚀 **Deployment Steps**

### **Step 1: Fix TypeScript Compilation Issues**

The deployment is failing due to TypeScript compilation errors. Let's fix them:

#### **1.1 Update tsconfig.json**
```bash
cd functions
```

Edit `functions/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "lib",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "lib"]
}
```

#### **1.2 Fix Dispatcher Errors**
Edit `functions/src/dispatcher.ts`:
```typescript
// Remove unused import
// import { auditLog } from './utils/audit';

// Fix monitoring call
monitoring.logApiCall(req, action, true);
```

### **Step 2: Build Functions**
```bash
cd functions
npm run build
```

### **Step 3: Deploy Functions**

#### **Option A: Deploy All Functions**
```bash
firebase deploy --only functions
```

#### **Option B: Deploy Specific Webhook Functions**
```bash
firebase deploy --only functions:speedypayWebhook,functions:speedypayWebhookHealth,functions:speedypayWebhookStats,functions:speedypayWebhookTest
```

#### **Option C: Deploy with Build Service Account (If Required)**
If you encounter "Build service account needs to be specified due to Org Policies":

```bash
# Set build service account
firebase functions:config:set build.service_account="your-service-account@your-project.iam.gserviceaccount.com"

# Deploy with service account
firebase deploy --only functions --service-account="your-service-account@your-project.iam.gserviceaccount.com"
```

## 🔐 **Environment Configuration**

### **1. Set Environment Variables**
```bash
# SpeedyPay Configuration
firebase functions:config:set speedypay.secret_key="uck6lo8sdjaarqf3sohdoovdvvn0kdnk"
firebase functions:config:set speedypay.merchant_seq="300000064613"

# Webhook URL
firebase functions:config:set speedypay.webhook_url="https://asia-southeast1-applez-dch9v.cloudfunctions.net/speedypayWebhook"
```

### **2. Verify Configuration**
```bash
firebase functions:config:get
```

## 🌐 **Webhook URL Configuration**

### **1. Get Function URLs**
After successful deployment, get your webhook URLs:
```bash
firebase functions:list
```

### **2. Update SpeedyPay Dashboard**
Configure the webhook URL in your SpeedyPay dashboard:
```
https://asia-southeast1-applez-dch9v.cloudfunctions.net/speedypayWebhook
```

## 🧪 **Testing Deployment**

### **1. Test Health Check**
```bash
curl -X GET "https://asia-southeast1-applez-dch9v.cloudfunctions.net/speedypayWebhookHealth"
```

### **2. Test Webhook Endpoint**
```bash
curl -X POST "https://asia-southeast1-applez-dch9v.cloudfunctions.net/speedypayWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "signType": "SHA256",
    "sign": "test_signature",
    "timestamp": "2025-07-22 10:15:40",
    "merchSeq": "300000064613",
    "orderSeq": "TEST123456",
    "transSeq": "TRANS789012",
    "transState": "06",
    "amount": "100.00",
    "currency": "PHP",
    "procId": "GXCHPHM2XXX",
    "procDetail": "09123456789",
    "purposes": "Test",
    "firstName": "John",
    "lastName": "Doe",
    "mobilePhone": "09123456789",
    "respCode": "00000000",
    "respMessage": "Success"
  }'
```

### **3. Run Complete Test Suite**
```bash
node test-speedypay-webhook.js
```

## 🔍 **Troubleshooting**

### **Common Issues & Solutions**

#### **1. Build Service Account Error**
**Error**: `Build service account needs to be specified due to Org Policies`

**Solutions**:
```bash
# Option 1: Use default service account
firebase deploy --only functions --service-account="applez-dch9v@appspot.gserviceaccount.com"

# Option 2: Create custom service account
# Go to Google Cloud Console > IAM & Admin > Service Accounts
# Create new service account with Cloud Functions Developer role
```

#### **2. TypeScript Compilation Errors**
**Error**: `TS6133: 'auditLog' is declared but its value is never read`

**Solution**: Comment out unused imports in `dispatcher.ts`

#### **3. Function Not Found Error**
**Error**: `No function matches given --only filters`

**Solution**: Ensure functions are properly exported in `index.ts`

#### **4. Permission Denied**
**Error**: `Permission denied on resource`

**Solution**: 
```bash
# Check current user
firebase auth:list

# Re-authenticate if needed
firebase logout
firebase login
```

#### **5. Memory/Timeout Issues**
**Error**: Function timeout or memory exceeded

**Solution**: Update `firebase.json`:
```json
{
  "functions": {
    "source": "functions",
    "runtime": "nodejs20",
    "memory": "256MB",
    "timeoutSeconds": 60
  }
}
```

## 📊 **Monitoring & Logs**

### **1. View Function Logs**
```bash
# View recent logs
firebase functions:log --only speedypayWebhook --limit 50

# Follow logs in real-time
firebase functions:log --follow

# Filter by error level
firebase functions:log --only speedypayWebhook --level error
```

### **2. Monitor Function Performance**
```bash
# Check function status
firebase functions:list

# View function details
firebase functions:describe speedypayWebhook
```

## 🔄 **Alternative Deployment Methods**

### **1. Manual Deployment via Google Cloud Console**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to Cloud Functions
3. Create new function manually
4. Upload the compiled code from `functions/lib/`

### **2. GitHub Actions Deployment**
Create `.github/workflows/deploy-functions.yml`:
```yaml
name: Deploy Firebase Functions

on:
  push:
    branches: [main]
    paths: ['functions/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: |
          cd functions
          npm install
          
      - name: Build functions
        run: |
          cd functions
          npm run build
          
      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          projectId: applez-dch9v
          channelId: live
```

## ✅ **Verification Checklist**

After deployment, verify:

- [ ] **Health Check**: `GET /speedypayWebhookHealth` returns 200
- [ ] **Test Endpoint**: `GET /speedypayWebhookTest` returns test data
- [ ] **Webhook Handler**: `POST /speedypayWebhook` accepts requests
- [ ] **Statistics**: `GET /speedypayWebhookStats` returns stats
- [ ] **Logs**: No errors in Firebase Functions logs
- [ ] **Configuration**: Environment variables are set correctly
- [ ] **Webhook URL**: Configured in SpeedyPay dashboard

## 🚨 **Emergency Rollback**

If deployment causes issues:

```bash
# List function versions
firebase functions:list --only speedypayWebhook

# Rollback to previous version
firebase functions:rollback speedypayWebhook --version-id PREVIOUS_VERSION_ID

# Or delete and redeploy
firebase functions:delete speedypayWebhook --force
firebase deploy --only functions:speedypayWebhook
```

## 📞 **Support**

### **Firebase Support**
- [Firebase Documentation](https://firebase.google.com/docs/functions)
- [Firebase Console](https://console.firebase.google.com/project/applez-dch9v/functions)

### **Google Cloud Support**
- [Cloud Functions Documentation](https://cloud.google.com/functions/docs)
- [Google Cloud Console](https://console.cloud.google.com/functions)

---

**Last Updated**: 2025-07-22
**Status**: Ready for Deployment 