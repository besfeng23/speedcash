import { onRequest } from 'firebase-functions/v2/https';

export const simpleTest = onRequest({ region: 'asia-southeast1' }, (req, res) => {
  res.json({ 
    message: 'Simple test function working!',
    timestamp: new Date().toISOString()
  });
}); 