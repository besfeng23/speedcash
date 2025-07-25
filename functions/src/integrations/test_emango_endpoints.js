const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function testCreateQR() {
  try {
    const res = await axios.post(`${BASE_URL}/emango/create_qr`, {
      orderSeq: 'ORDER123',
      amount: 100.00,
      busiName: 'Test Business',
      notifyUrl: 'http://localhost:5000/emango/webhook',
    });
    console.log('Create QR:', res.data);
    return res.data.url;
  } catch (err) {
    console.error('Create QR failed:', err.response?.data || err.message);
  }
}

async function testCreatePersonalizedQR() {
  try {
    const res = await axios.post(`${BASE_URL}/emango/create_personalized_qr`, {
      orderSeq: 'ORDER124',
      amount: 50.00,
      busiName: 'Test Business',
      notifyUrl: 'http://localhost:5000/emango/webhook',
    });
    console.log('Create Personalized QR:', res.data);
    return res.data.qrCode;
  } catch (err) {
    console.error('Create Personalized QR failed:', err.response?.data || err.message);
  }
}

async function testQueryOrder() {
  try {
    const res = await axios.post(`${BASE_URL}/emango/query_order`, {
      orderSeq: 'ORDER123',
    });
    console.log('Query Order:', res.data);
  } catch (err) {
    console.error('Query Order failed:', err.response?.data || err.message);
  }
}

async function testWebhook() {
  try {
    const res = await axios.post(`${BASE_URL}/emango/webhook`, {
      orderSeq: 'ORDER123',
      transState: '00',
      sign: 'dummy', // This will fail signature check (for test)
    });
    console.log('Webhook:', res.data);
  } catch (err) {
    console.error('Webhook failed:', err.response?.data || err.message);
  }
}

(async () => {
  await testCreateQR();
  await testCreatePersonalizedQR();
  await testQueryOrder();
  await testWebhook();
})(); 