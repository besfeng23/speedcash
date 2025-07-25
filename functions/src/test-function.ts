import { onRequest } from 'firebase-functions/v2/https';

export const function3 = onRequest({ region: 'asia-southeast1' }, (req, res) => {
  console.log('Test function called');
  res.json({ 
    message: 'Test function working!',
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url
  });
}); 