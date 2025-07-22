# CORS Troubleshooting Guide

## Problem Description
You're experiencing a CORS (Cross-Origin Resource Sharing) error when your frontend application tries to make requests to your backend API. The error message indicates:

```
Access to fetch at 'https://cpaydispatcher-n4f73lnkeq-uc.a.run.app/' from origin 'https://cpay-admin--applez-dch9v.asia-east1.hosted.app' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## Root Cause Analysis

The issue occurs because:
1. Your frontend is making requests from `https://cpay-admin--applez-dch9v.asia-east1.hosted.app`
2. Your backend API at `https://cpaydispatcher-n4f73lnkeq-uc.a.run.app/` is not configured to allow requests from this origin
3. The CORS headers are not being set properly in the response

## Immediate Solutions

### Solution 1: Manual CORS Configuration (Recommended)

1. **Update your dispatcher function** (already done):
   - The `functions/src/dispatcher.ts` file has been updated with proper CORS handling
   - CORS headers are now set for all requests, including error responses
   - Preflight OPTIONS requests are handled correctly

2. **Deploy the updated functions**:
   ```bash
   cd functions
   npm run build
   cd ..
   npx firebase deploy --only functions
   ```

3. **If deployment fails due to organization policies**, try:
   ```bash
   # Set the service account explicitly
   npx firebase functions:config:set cors.allowed_origins="https://cpay5--applez-dch9v.asia-east1.hosted.app,https://cpay-admin--applez-dch9v.asia-east1.hosted.app,http://localhost:3000,http://localhost:3001"
   
   # Then deploy
   npx firebase deploy --only functions
   ```

### Solution 2: Alternative Deployment Method

If the standard deployment fails, you can:

1. **Use the deployment script**:
   ```bash
   chmod +x deploy-functions.sh
   ./deploy-functions.sh
   ```

2. **Or deploy manually with specific configuration**:
   ```bash
   # Build functions
   cd functions && npm run build && cd ..
   
   # Deploy with specific region
   npx firebase deploy --only functions --project applez-dch9v
   ```

### Solution 3: Test CORS Configuration

Run the test script to verify CORS is working:
```bash
node test-cors.js
```

## CORS Configuration Details

### Allowed Origins
The following origins are now configured as allowed:
- `https://cpay5--applez-dch9v.asia-east1.hosted.app` (main app)
- `https://cpay-admin--applez-dch9v.asia-east1.hosted.app` (admin app)
- `http://localhost:3000` (local development)
- `http://localhost:3001` (local development)

### CORS Headers Set
- `Access-Control-Allow-Origin`: Set to the requesting origin
- `Access-Control-Allow-Methods`: GET, POST, PUT, DELETE, OPTIONS
- `Access-Control-Allow-Headers`: Content-Type, Authorization, X-Requested-With, Accept, Origin
- `Access-Control-Allow-Credentials`: true
- `Access-Control-Max-Age`: 3600
- `Vary`: Origin

## Monitoring and Debugging

### Enhanced Logging
The updated dispatcher now includes comprehensive logging:
- All incoming requests are logged
- CORS requests are specifically tracked
- API call performance is monitored
- Errors are logged with full context

### Viewing Logs
```bash
# View function logs
npx firebase functions:log

# View recent logs in the Firebase console
# Go to Functions > Logs in the Firebase console
```

### Testing CORS Manually
You can test CORS manually using curl:
```bash
# Test OPTIONS request (preflight)
curl -X OPTIONS \
  -H "Origin: https://cpay-admin--applez-dch9v.asia-east1.hosted.app" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type, Authorization" \
  https://cpaydispatcher-n4f73lnkeq-uc.a.run.app/

# Test POST request
curl -X POST \
  -H "Origin: https://cpay-admin--applez-dch9v.asia-east1.hosted.app" \
  -H "Content-Type: application/json" \
  -d '{"action":"adminGetDashboardStats","payload":{}}' \
  https://cpaydispatcher-n4f73lnkeq-uc.a.run.app/
```

## Common Issues and Solutions

### Issue 1: Deployment Fails Due to Organization Policies
**Solution**: Contact your organization's Firebase admin to:
- Grant the necessary permissions to your service account
- Configure the build service account for Cloud Functions
- Or use a different project for development

### Issue 2: CORS Still Fails After Deployment
**Solution**: 
1. Clear browser cache and try again
2. Check if the function URL has changed
3. Verify the origin is exactly matching (no trailing slashes)
4. Check browser developer tools for detailed error messages

### Issue 3: Function Not Responding
**Solution**:
1. Check if the function is deployed correctly
2. Verify the function URL in your frontend code
3. Check function logs for errors
4. Ensure the function is in the correct region

## Prevention and Best Practices

### 1. Environment-Specific Configuration
Use environment variables to manage different origins:
```javascript
const allowedOrigins = process.env.NODE_ENV === 'production' 
  ? ['https://cpay5--applez-dch9v.asia-east1.hosted.app', 'https://cpay-admin--applez-dch9v.asia-east1.hosted.app']
  : ['http://localhost:3000', 'http://localhost:3001'];
```

### 2. Regular Testing
- Test CORS configuration after every deployment
- Use automated tests to verify CORS headers
- Monitor CORS-related errors in logs

### 3. Security Considerations
- Only allow necessary origins
- Use HTTPS in production
- Implement proper authentication
- Log and monitor CORS requests

## Next Steps

1. **Deploy the updated functions** using one of the methods above
2. **Test the CORS configuration** using the test script
3. **Monitor the logs** to ensure everything is working correctly
4. **Update your frontend** if needed to handle the new CORS configuration

## Support

If you continue to experience issues:
1. Check the Firebase Functions logs
2. Review the browser's network tab for detailed error information
3. Test with the provided curl commands
4. Contact your Firebase admin for organization policy issues 