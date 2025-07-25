from flask import Flask, request, jsonify
from emango_pay_client import EMangoPayClient, _verify_signature, EMANGO_SECRET_KEY
import os

app = Flask(__name__)
client = EMangoPayClient()

@app.route('/emango/create_qr', methods=['POST'])
def create_qr():
    data = request.json
    try:
        url = client.create_direct_qr_payment(
            orderSeq=data['orderSeq'],
            amount=float(data['amount']),
            busiName=data['busiName'],
            notifyUrl=data['notifyUrl'],
            isRedirect=data.get('isRedirect', '0'),
        )
        return jsonify({'success': True, 'url': url})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/emango/create_personalized_qr', methods=['POST'])
def create_personalized_qr():
    data = request.json
    try:
        qr_code = client.create_personalized_qr_payment(
            orderSeq=data['orderSeq'],
            amount=float(data['amount']),
            busiName=data['busiName'],
            notifyUrl=data['notifyUrl'],
            isRedirect=data.get('isRedirect', '0'),
        )
        return jsonify({'success': True, 'qrCode': qr_code})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/emango/query_order', methods=['POST'])
def query_order():
    data = request.json
    try:
        result = client.query_order_status(orderSeq=data['orderSeq'])
        return jsonify({'success': True, 'result': result})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/emango/webhook', methods=['POST'])
def webhook():
    notification_data = request.get_json()
    is_valid = _verify_signature(notification_data, EMANGO_SECRET_KEY)
    if not is_valid:
        return {"respCode": "99999999", "respMessage": "Signature validation failed"}, 400
    # TODO: Update order status in your DB here
    return {"respCode": "00000000", "respMessage": "Success"}

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000))) 