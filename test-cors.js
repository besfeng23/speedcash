// Test script to verify CORS configuration
const https = require('https');
const http = require('http');

async function testCors() {
  // Updated to use the correct region where cpayDispatcher is deployed
  const url = 'https://asia-southeast1-applez-dch9v.cloudfunctions.net/cpayDispatcher';
  
  console.log('Testing CORS configuration...');
  console.log('Testing URL:', url);
  
  try {
    // Test OPTIONS request (preflight)
    console.log('\n1. Testing OPTIONS request (preflight):');
    const optionsResponse = await makeRequest(url, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://cpay-admin--applez-dch9v.asia-east1.hosted.app',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization'
      }
    });
    
    console.log('Status:', optionsResponse.status);
    console.log('CORS Headers:');
    console.log('- Access-Control-Allow-Origin:', optionsResponse.headers['access-control-allow-origin']);
    console.log('- Access-Control-Allow-Methods:', optionsResponse.headers['access-control-allow-methods']);
    console.log('- Access-Control-Allow-Headers:', optionsResponse.headers['access-control-allow-headers']);
    console.log('- Access-Control-Allow-Credentials:', optionsResponse.headers['access-control-allow-credentials']);
    
    // Test POST request
    console.log('\n2. Testing POST request:');
    const postResponse = await makeRequest(url, {
      method: 'POST',
      headers: {
        'Origin': 'https://cpay-admin--applez-dch9v.asia-east1.hosted.app',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'adminGetDashboardStats',
        payload: {}
      })
    });
    
    console.log('Status:', postResponse.status);
    console.log('CORS Headers:');
    console.log('- Access-Control-Allow-Origin:', postResponse.headers['access-control-allow-origin']);
    console.log('- Access-Control-Allow-Methods:', postResponse.headers['access-control-allow-methods']);
    console.log('- Access-Control-Allow-Headers:', postResponse.headers['access-control-allow-headers']);
    console.log('- Access-Control-Allow-Credentials:', postResponse.headers['access-control-allow-credentials']);
    
    console.log('Response:', postResponse.body.substring(0, 200) + '...');
    
  } catch (error) {
    console.error('Error testing CORS:', error.message);
  }
}

function makeRequest(url, options) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method,
      headers: options.headers || {}
    };
    
    const req = client.request(requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

testCors(); 