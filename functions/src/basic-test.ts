import { onRequest } from 'firebase-functions/v2/https';

export const basicTest = onRequest({ 
  region: 'asia-southeast1',
  timeoutSeconds: 60,
  memory: '256MiB'
}, (req, res) => {
  console.log('Basic test function called');
  res.json({ 
    message: 'Basic test function working!',
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url
  });
}); 