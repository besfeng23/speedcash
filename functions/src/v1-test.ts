import * as functions from 'firebase-functions';

export const v1Test = functions.https.onRequest({ 
  region: 'asia-southeast1' 
}, (req, res) => {
  console.log('V1 test function called');
  
  // Set CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }
  
  // Simple response
  res.status(200).json({ 
    success: true,
    message: 'V1 test function working!',
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    version: 'v1'
  });
}); 