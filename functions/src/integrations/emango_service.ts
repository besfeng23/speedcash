import axios from 'axios';

const BASE_URL = process.env.EMANGO_MICROSERVICE_URL || 'http://localhost:5000';

export class EmangoService {
  static async createQR(orderSeq: string, amount: number, busiName: string, notifyUrl: string, isRedirect = '0') {
    const res = await axios.post(`${BASE_URL}/emango/create_qr`, {
      orderSeq, amount, busiName, notifyUrl, isRedirect,
    });
    if (!res.data.success) throw new Error(res.data.error);
    return res.data.url;
  }

  static async createPersonalizedQR(orderSeq: string, amount: number, busiName: string, notifyUrl: string, isRedirect = '0') {
    const res = await axios.post(`${BASE_URL}/emango/create_personalized_qr`, {
      orderSeq, amount, busiName, notifyUrl, isRedirect,
    });
    if (!res.data.success) throw new Error(res.data.error);
    return res.data.qrCode;
  }

  static async queryOrder(orderSeq: string) {
    const res = await axios.post(`${BASE_URL}/emango/query_order`, { orderSeq });
    if (!res.data.success) throw new Error(res.data.error);
    return res.data.result;
  }
}

// Example usage:
// const url = await EmangoService.createQR('ORDER123', 100, 'Test Business', 'https://yourdomain.com/webhooks/emango_pay_notify');
// const qrCode = await EmangoService.createPersonalizedQR('ORDER124', 50, 'Test Business', 'https://yourdomain.com/webhooks/emango_pay_notify');
// const orderStatus = await EmangoService.queryOrder('ORDER123'); 