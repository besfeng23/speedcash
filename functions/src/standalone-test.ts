import { onRequest } from 'firebase-functions/v2/https';

export const standaloneTest = onRequest({ 
  region: 'asia-southeast1',
  timeoutSeconds: 30,
  memory: '128MiB',
  minInstances: 0,
  maxInstances: 1
}, (req, res) => {
  console.log('Standalone test function called');
  
  // Simple response without any external dependencies
  res.status(200).json({ 
    success: true,
    message: 'Standalone test function working!',
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    headers: {
      'content-type': req.headers['content-type'],
      'user-agent': req.headers['user-agent']
    }
  });
}); 