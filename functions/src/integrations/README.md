# eMango Pay Python Microservice

This microservice wraps the eMango Pay API integration for use with the CPay system. It exposes HTTP endpoints for QR creation, order query, and webhook handling.

## Quick Start (Zero-Effort)

### Option 1: Docker (Recommended)

1. Copy your `.env` file with credentials into this directory.
2. Build and run:
   ```bash
   docker build -t emango-pay .
   docker run --env-file .env -p 5000:5000 emango-pay
   ```
3. The service will be available at `http://localhost:5000`.

### Option 2: Windows Batch Script

1. Run the setup script:
   ```
   setup_emango_env.bat
   ```
2. Fill in `.env` with your credentials.
3. Run everything (service + test):
   ```
   run_all.bat
   ```

## API Endpoints

- `POST /emango/create_qr`  
  **Body:** `{ orderSeq, amount, busiName, notifyUrl, isRedirect? }`  
  **Returns:** `{ success, url }`

- `POST /emango/create_personalized_qr`  
  **Body:** `{ orderSeq, amount, busiName, notifyUrl, isRedirect? }`  
  **Returns:** `{ success, qrCode }`

- `POST /emango/query_order`  
  **Body:** `{ orderSeq }`  
  **Returns:** `{ success, result }`

- `POST /emango/webhook`  
  **Body:** eMango Pay notification payload  
  **Returns:** eMango Pay response

## Integration with Node.js/TypeScript

Call these endpoints from your backend using `fetch`, `axios`, or any HTTP client. Example:

```js
// Node.js example
const axios = require('axios');
const res = await axios.post('http://localhost:5000/emango/create_qr', {
  orderSeq: 'ORDER123',
  amount: 100.00,
  busiName: 'Test Business',
  notifyUrl: 'https://yourdomain.com/webhooks/emango_pay_notify',
});
console.log(res.data);
```

## Webhook Handling

Configure your eMango Pay account to send notifications to your public `/emango/webhook` endpoint. The service will verify the signature and you should update your order status in the `# TODO` section of the handler. 