import { onRequest } from 'firebase-functions/v2/https';
import express from 'express';

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Main endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Express test function working!',
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url
  });
});

// POST endpoint
app.post('/', (req, res) => {
  res.json({ 
    message: 'Express POST endpoint working!',
    timestamp: new Date().toISOString(),
    body: req.body
  });
});

export const expressTest = onRequest({ 
  region: 'asia-southeast1',
  timeoutSeconds: 30,
  memory: '128MiB',
  minInstances: 0,
  maxInstances: 1
}, app); 