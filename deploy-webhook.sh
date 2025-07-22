#!/bin/bash

# 🚀 SpeedyPay Webhook Deployment Script
# This script deploys the SpeedyPay webhook handlers to Firebase Functions

echo "🚀 Deploying SpeedyPay Webhook Functions..."
echo "=========================================="

# 🔍 Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI is not installed. Please install it first:"
    echo "npm install -g firebase-tools"
    exit 1
fi

# 🔍 Check if user is logged in
if ! firebase projects:list &> /dev/null; then
    echo "❌ Not logged in to Firebase. Please login first:"
    echo "firebase login"
    exit 1
fi

# 📁 Navigate to functions directory
cd functions

# 📦 Install dependencies
echo "📦 Installing dependencies..."
npm install

# 🔧 Set environment variables
echo "🔧 Setting environment variables..."
firebase functions:config:set speedypay.secret_key="uck6lo8sdjaarqf3sohdoovdvvn0kdnk"
firebase functions:config:set speedypay.merchant_seq="300000064613"

# 🚀 Deploy webhook functions
echo "🚀 Deploying webhook functions..."
firebase deploy --only functions:speedypayWebhook,functions:speedypayWebhookHealth,functions:speedypayWebhookStats,functions:speedypayWebhookTest

# ✅ Check deployment status
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Webhook deployment successful!"
    echo ""
    echo "📋 Deployed Functions:"
    echo "  - speedypayWebhook (Main webhook handler)"
    echo "  - speedypayWebhookHealth (Health check)"
    echo "  - speedypayWebhookStats (Statistics)"
    echo "  - speedypayWebhookTest (Test data generator)"
    echo ""
    echo "🌐 Webhook URL:"
    echo "  https://us-central1-applez-dch9v.cloudfunctions.net/speedypayWebhook"
    echo ""
    echo "🧪 Test the webhook:"
    echo "  node test-speedypay-webhook.js"
    echo ""
    echo "📊 Monitor logs:"
    echo "  firebase functions:log --only speedypayWebhook"
    echo ""
    echo "🔍 Health check:"
    echo "  curl -X GET https://us-central1-applez-dch9v.cloudfunctions.net/speedypayWebhookHealth"
else
    echo "❌ Webhook deployment failed!"
    echo "Check the error messages above and try again."
    exit 1
fi

# 🔙 Return to root directory
cd ..

echo "🎉 Deployment complete!" 