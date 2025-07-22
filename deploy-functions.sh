#!/bin/bash

# CPay Functions Deployment Script
# This script handles the deployment of Firebase Functions with proper CORS configuration

set -e

echo "🚀 Starting CPay Functions Deployment..."

# Check if we're in the right directory
if [ ! -f "firebase.json" ]; then
    echo "❌ Error: firebase.json not found. Please run this script from the project root."
    exit 1
fi

# Build the functions
echo "📦 Building functions..."
cd functions
npm run build
cd ..

# Set CORS configuration
echo "🔧 Setting CORS configuration..."
npx firebase functions:config:set cors.allowed_origins="https://cpay5--applez-dch9v.asia-east1.hosted.app,https://cpay-admin--applez-dch9v.asia-east1.hosted.app,http://localhost:3000,http://localhost:3001"

# Deploy functions
echo "🚀 Deploying functions..."
npx firebase deploy --only functions

echo "✅ Deployment completed successfully!"

# Test the deployment
echo "🧪 Testing CORS configuration..."
node test-cors.js

echo "🎉 All done! Your functions are deployed and CORS is configured." 