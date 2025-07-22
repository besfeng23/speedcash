# CORS Issue Solution

## Problem
Your CPay application is experiencing CORS (Cross-Origin Resource Sharing) errors when trying to access the Firebase Functions. The error shows:

```
Access to fetch at 'https://asia-southeast1-applez-dch9v.cloudfunctions.net/cpayDispatcher' 
from origin 'https://cpay5--applez-dch9v.asia-east1.hosted.app' has been blocked by CORS policy: 
Response to preflight request doesn't pass access control check: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## Root Cause
1. **Firebase Function CORS Configuration**: The deployed Firebase Function doesn't have proper CORS headers
2. **Organizational Policy Issue**: Firebase deployment is blocked due to organizational policies requiring specific service accounts
3. **Region Mismatch**: The function is deployed in `asia-southeast1` but the frontend expects it in a different region

## Solution Implemented

### 1. CORS Proxy API Route
I've created a CORS proxy at `/api/cors-proxy` that:
- Receives requests from your frontend
- Forwards them to the Firebase Function
- Adds proper CORS headers to the response
- Handles authentication tokens

**File**: `src/app/api/cors-proxy/route.ts`

### 2. Updated API Hook
I've updated your `useApi.ts` hook to:
- Use the CORS proxy instead of calling Firebase Functions directly
- Maintain the same API interface
- Handle errors properly

**File**: `src/hooks/useApi.ts`

### 3. Test Endpoint
I've created a test endpoint at `/api/test-cors` to verify CORS is working.

**File**: `src/app/api/test-cors/route.ts`

## How It Works

```
Frontend (cpay5--applez-dch9v.asia-east1.hosted.app)
    ↓ (API call to /api/cors-proxy)
Next.js API Route (/api/cors-proxy)
    ↓ (forwards request with CORS headers)
Firebase Function (asia-southeast1-applez-dch9v.cloudfunctions.net/cpayDispatcher)
    ↓ (response)
Next.js API Route (adds CORS headers)
    ↓ (response with proper CORS headers)
Frontend (receives response successfully)
```

## Benefits

1. **Immediate Fix**: No need to redeploy Firebase Functions
2. **No Organizational Policy Issues**: Works with existing deployment
3. **Maintains Security**: Authentication tokens are preserved
4. **Production Ready**: Can be used in production environment
5. **Easy to Remove**: Can be removed once Firebase Functions are properly configured

## Testing

### Test the CORS Proxy
```bash
# Test GET request
curl -X GET https://cpay5--applez-dch9v.asia-east1.hosted.app/api/test-cors

# Test POST request
curl -X POST https://cpay5--applez-dch9v.asia-east1.hosted.app/api/test-cors \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

### Test API Calls
Your existing API calls should now work without CORS errors. The frontend will automatically use the CORS proxy.

## Long-term Solution

To fix this permanently, you need to:

1. **Configure Firebase Project**: Set up proper service accounts and organizational policies
2. **Update Firebase Function**: Add proper CORS configuration
3. **Deploy Updated Function**: Deploy the function with correct CORS headers

### Firebase Function CORS Configuration
```typescript
export const cpayDispatcher = onRequest({ 
  region: 'asia-southeast1',
  cors: true // Enable CORS at function level
}, async (req, res) => {
  // Set CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }
  
  // ... rest of your function logic
});
```

## Environment Variables

You can configure the API base URL using environment variables:

```env
# .env.local
NEXT_PUBLIC_API_BASE_URL=/api/cors-proxy
```

## Monitoring

The CORS proxy includes logging to help monitor:
- Request/response status
- Error handling
- Performance metrics

Check your browser's developer console and server logs for any issues.

## Next Steps

1. **Test the Solution**: Verify that your API calls now work without CORS errors
2. **Monitor Performance**: Check if the proxy adds any noticeable latency
3. **Plan Migration**: Once Firebase Functions are properly configured, you can remove the proxy
4. **Update Documentation**: Update your API documentation to reflect the new endpoint

## Troubleshooting

If you still experience issues:

1. **Check Network Tab**: Look for failed requests in browser dev tools
2. **Verify Proxy Route**: Ensure `/api/cors-proxy` is accessible
3. **Check Authentication**: Verify that auth tokens are being passed correctly
4. **Review Logs**: Check server logs for any errors

The CORS proxy solution should resolve your immediate issue while providing a path to a permanent fix. 