import os
import hashlib
import hmac
import time
import requests
from typing import Dict, Any

# --- Configuration ---
EMANGO_MERCH_SEQ = os.getenv('EMANGO_MERCH_SEQ')
EMANGO_SECRET_KEY = os.getenv('EMANGO_SECRET_KEY')
EMANGO_API_BASE_URL = os.getenv('EMANGO_API_BASE_URL', 'https://test.e-mango.ph')

ENDPOINT_QR_DIRECT = "/cashier/qrPay.do"
ENDPOINT_QR_PERSONALIZED = "/cashier/qrPayB.do"
ENDPOINT_QUERY_ORDER = "/cashier/qryOrder.do"
ENDPOINT_QUERY_BALANCE = "/cashier/qryBalance.do"

# --- Signature Helpers ---
def _generate_signature(params: Dict[str, Any], secret_key: str) -> str:
    sorted_keys = sorted(params.keys())
    concatenated_pairs = []
    for key in sorted_keys:
        if params[key] is not None and params[key] != "":
            concatenated_pairs.append(f"{key}={params[key]}")
    concatenated_string = "&".join(concatenated_pairs)
    string_to_sign = f"{concatenated_string}&{secret_key}"
    signature = hashlib.sha256(string_to_sign.encode('utf-8')).hexdigest()
    return signature

def _verify_signature(response_data: Dict[str, Any], secret_key: str) -> bool:
    if "sign" not in response_data:
        return False
    received_signature = response_data["sign"]
    params_to_verify = response_data.copy()
    del params_to_verify["sign"]
    expected_signature = _generate_signature(params_to_verify, secret_key)
    return hmac.compare_digest(expected_signature, received_signature)

# --- API Client ---
class EMangoPayClient:
    def __init__(self, merch_seq=None, secret_key=None, base_url=None):
        self.merch_seq = merch_seq or EMANGO_MERCH_SEQ
        self.secret_key = secret_key or EMANGO_SECRET_KEY
        self.base_url = base_url or EMANGO_API_BASE_URL
        self.http_client = requests

    def create_direct_qr_payment(self, orderSeq: str, amount: float, busiName: str, notifyUrl: str, **kwargs):
        request_params = {
            "merchSeq": self.merch_seq,
            "orderSeq": orderSeq,
            "orderDate": time.strftime("%Y-%m-%d"),
            "amount": f"{amount:.2f}",
            "currency": "PHP",
            "busiName": busiName,
            "busiType": "1",
            "notifyUrl": notifyUrl,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "signType": "SHA256",
            "fee": "0.00",
            "dueTime": "0",
            "isRedirect": kwargs.get("isRedirect", "0"),
        }
        request_params["sign"] = _generate_signature(request_params, self.secret_key)
        response = self.http_client.post(self.base_url + ENDPOINT_QR_DIRECT, json=request_params)
        response_data = response.json()
        if not _verify_signature(response_data, self.secret_key):
            raise Exception("Invalid signature on eMango Pay response.")
        if response_data.get("respCode") != "00000000":
            raise Exception(f"eMango Pay Error: {response_data.get('respMessage')}")
        return response_data["url"]

    def create_personalized_qr_payment(self, orderSeq: str, amount: float, busiName: str, notifyUrl: str, **kwargs):
        request_params = {
            "merchSeq": self.merch_seq,
            "orderSeq": orderSeq,
            "orderDate": time.strftime("%Y-%m-%d"),
            "amount": f"{amount:.2f}",
            "currency": "PHP",
            "busiName": busiName,
            "busiType": "1",
            "notifyUrl": notifyUrl,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "signType": "SHA256",
            "fee": "0.00",
            "dueTime": "0",
            "isRedirect": kwargs.get("isRedirect", "0"),
        }
        request_params["sign"] = _generate_signature(request_params, self.secret_key)
        response = self.http_client.post(self.base_url + ENDPOINT_QR_PERSONALIZED, json=request_params)
        response_data = response.json()
        if not _verify_signature(response_data, self.secret_key):
            raise Exception("Invalid signature on eMango Pay response.")
        if response_data.get("respCode") != "00000000":
            raise Exception(f"eMango Pay Error: {response_data.get('respMessage')}")
        return response_data["qrCode"]

    def query_order_status(self, orderSeq: str):
        request_params = {
            "merchSeq": self.merch_seq,
            "orderSeq": orderSeq,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "signType": "SHA256",
        }
        request_params["sign"] = _generate_signature(request_params, self.secret_key)
        response = self.http_client.post(self.base_url + ENDPOINT_QUERY_ORDER, json=request_params)
        response_data = response.json()
        if not _verify_signature(response_data, self.secret_key):
            raise Exception("Invalid signature on eMango Pay query response.")
        return response_data

# --- Webhook Handler Example (Flask) ---
# from flask import Flask, request, jsonify
# app = Flask(__name__)
#
# @app.route("/webhooks/emango_pay_notify", methods=["POST"])
# def handle_emango_notification():
#     notification_data = request.get_json()
#     is_valid = _verify_signature(notification_data, EMANGO_SECRET_KEY)
#     if not is_valid:
#         return {"respCode": "99999999", "respMessage": "Signature validation failed"}, 400
#     order_seq = notification_data.get("orderSeq")
#     trans_state = notification_data.get("transState")
#     # Update order status in DB here
#     return {"respCode": "00000000", "respMessage": "Success"} 