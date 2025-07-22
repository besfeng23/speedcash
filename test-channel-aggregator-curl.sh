#!/bin/bash

# 🔐 CPay Channel Aggregator Test Script
# ======================================

# Configuration
MERCHANT_NO="300000064613"
SHA256_KEY="uck6lo8sdjaarqf3sohdoovdvvn0kdnk"
BASE_URL="https://sandbox.e-mango.ph/api"
TIMESTAMP=$(date +%s)000
REFERENCE="TEST$(date +%s)"

echo "🚀 CPay Channel Aggregator Test Script"
echo "======================================"
echo "Merchant No: $MERCHANT_NO"
echo "Timestamp: $TIMESTAMP"
echo "Reference: $REFERENCE"
echo ""

# Function to generate signature
generate_signature() {
    local payload="$1"
    local timestamp="$2"
    local key="$3"
    local raw_string="${payload}${timestamp}${key}"
    echo -n "$raw_string" | openssl dgst -sha256 -hex | sed 's/^.* //'
}

# Test 1: Payment Initiation
echo "🧪 TEST 1: Payment Initiation"
echo "=============================="

PAYLOAD='{"amount":1000,"currency":"PHP","reference":"'$REFERENCE'","description":"CPay Test Payment","callback_url":"https://applez-dch9v.web.app/webhook/channel-aggregator"}'
SIGNATURE=$(generate_signature "$PAYLOAD" "$TIMESTAMP" "$SHA256_KEY")

echo "Payload: $PAYLOAD"
echo "Signature: $SIGNATURE"
echo ""

curl -X POST "$BASE_URL/payment/initiation/json" \
  -H "Content-Type: application/json" \
  -H "X-Merchant-No: $MERCHANT_NO" \
  -H "X-Timestamp: $TIMESTAMP" \
  -H "X-Signature: $SIGNATURE" \
  -d "$PAYLOAD" \
  -w "\nHTTP Status: %{http_code}\n" \
  -s

echo ""
echo ""

# Test 2: Transaction Status Check
echo "🧪 TEST 2: Transaction Status Check"
echo "==================================="

TIMESTAMP2=$(date +%s)000
STATUS_PAYLOAD='{"transaction_id":"TEST_TXN_'$(date +%s)'"}'
STATUS_SIGNATURE=$(generate_signature "$STATUS_PAYLOAD" "$TIMESTAMP2" "$SHA256_KEY")

echo "Payload: $STATUS_PAYLOAD"
echo "Signature: $STATUS_SIGNATURE"
echo ""

curl -X POST "$BASE_URL/payment/status/json" \
  -H "Content-Type: application/json" \
  -H "X-Merchant-No: $MERCHANT_NO" \
  -H "X-Timestamp: $TIMESTAMP2" \
  -H "X-Signature: $STATUS_SIGNATURE" \
  -d "$STATUS_PAYLOAD" \
  -w "\nHTTP Status: %{http_code}\n" \
  -s

echo ""
echo ""

# Test 3: Get Available Channels
echo "🧪 TEST 3: Get Available Channels"
echo "================================="

TIMESTAMP3=$(date +%s)000
CHANNELS_PAYLOAD='{}'
CHANNELS_SIGNATURE=$(generate_signature "$CHANNELS_PAYLOAD" "$TIMESTAMP3" "$SHA256_KEY")

echo "Payload: $CHANNELS_PAYLOAD"
echo "Signature: $CHANNELS_SIGNATURE"
echo ""

curl -X POST "$BASE_URL/channels/list/json" \
  -H "Content-Type: application/json" \
  -H "X-Merchant-No: $MERCHANT_NO" \
  -H "X-Timestamp: $TIMESTAMP3" \
  -H "X-Signature: $CHANNELS_SIGNATURE" \
  -d "$CHANNELS_PAYLOAD" \
  -w "\nHTTP Status: %{http_code}\n" \
  -s

echo ""
echo ""

# Test 4: Signature Verification
echo "🧪 TEST 4: Signature Verification"
echo "================================="

TEST_PAYLOAD='{"amount":1000,"currency":"PHP","reference":"SIG_TEST_123"}'
TEST_TIMESTAMP="1721632471000"
EXPECTED_SIGNATURE=$(generate_signature "$TEST_PAYLOAD" "$TEST_TIMESTAMP" "$SHA256_KEY")

echo "Test Payload: $TEST_PAYLOAD"
echo "Test Timestamp: $TEST_TIMESTAMP"
echo "Expected Signature: $EXPECTED_SIGNATURE"
echo ""

# Verify signature
CALCULATED_SIGNATURE=$(generate_signature "$TEST_PAYLOAD" "$TEST_TIMESTAMP" "$SHA256_KEY")
if [ "$CALCULATED_SIGNATURE" = "$EXPECTED_SIGNATURE" ]; then
    echo "✅ Signature verification: PASSED"
else
    echo "❌ Signature verification: FAILED"
    echo "Calculated: $CALCULATED_SIGNATURE"
    echo "Expected: $EXPECTED_SIGNATURE"
fi

echo ""
echo "✅ All tests completed!"
echo ""
echo "📋 Next Steps:"
echo "1. Review the responses above"
echo "2. Check HTTP status codes"
echo "3. Verify response data format"
echo "4. Test with real transaction IDs"
echo "5. Implement webhook handling" 