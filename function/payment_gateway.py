#/function/payment_gateway.py
from flask import Blueprint, request, jsonify,send_file,redirect
from requests.auth import HTTPBasicAuth
import requests
from functools import wraps
from models import db
from models.register_data import RegisterData,PaymentTransaction
import os,json
from function.config import flask_path
from function.socket_init import socketio
from password import API_KEY,COLLECTION_ID,BASE

from werkzeug.utils import secure_filename

payment_gateway_bp = Blueprint("payment_gateway", __name__)

@payment_gateway_bp.route("/ping", methods=["GET"])
def ping():
    return "pong"


auth = HTTPBasicAuth(API_KEY, "")


@payment_gateway_bp.route("/pay")
def create_bill():

    amount_myr = request.args.get("amount_myr")
    register_id = request.args.get("id")
    name = request.args.get("name") or "Anonymous"
    email = request.args.get("email") or "no-email@example.com"

    print("💰 用户本次付款金额(RM):", amount_myr)
    print("🆔 报名表 ID:", register_id)
    print("👤 用户姓名:", name)
    print("📩 用户 email:", email)

    credit_card_code = "MBU0227"

    url = f"{BASE}/v3/bills"

    data = {
        "collection_id": COLLECTION_ID,
        "email": email,
        "name": name,
        "amount": int(float(amount_myr) * 100),
        "description": f"Conference Registration #{register_id}",

        "redirect_url": "https://wbc-staging.ybam.org.my/static/templates/thankyou.html?id="+str(register_id),
        "callback_url": f"https://wbc-staging.ybam.org.my/payment_gateway/callback?register_id={register_id}",


        "reference_1_label": "Bank Code",
        "reference_1": credit_card_code,
        "reference_2_label": "Register ID",
        "reference_2": register_id,
        "reference_3_label": "Payer Email",
        "reference_3": email
    }

    resp = requests.post(url, auth=auth, data=data)
    bill = resp.json()
    bill_url = bill["url"] + "?auto_submit=true"
    return redirect(bill_url)



@payment_gateway_bp.route("/callback", methods=["POST"])
def callback():
    data = request.form.to_dict()
    register_id = request.args.get("register_id")
    bill_id = data.get("id")
    paid = data.get("paid") == "true"

    # ========== 保存 JSON 文件 ==========
    try:
        save_dir = os.path.join(flask_path, "uploads", "payments")
        os.makedirs(save_dir, exist_ok=True)
        save_path = os.path.join(save_dir, f"bill_{bill_id}.json")

        final_json = {
            "register_id": register_id,
            "bill_id": bill_id,
            "paid": paid,
            "bill_data": data
        }

        with open(save_path, "w", encoding="utf-8") as f:
            json.dump(final_json, f, ensure_ascii=False, indent=4)

    except Exception as e:
        print("❗保存 callback JSON 失败:", e)

    # ========== 保存进数据库 ==========
    try:
        db_record = PaymentTransaction(
            register_id=register_id,
            bill_id=bill_id,
            paid=paid,
            raw_json=json.dumps(final_json, ensure_ascii=False)
        )

        db.session.add(db_record)
        db.session.commit()

        print(f"💾 支付数据写入数据库 PaymentTransaction, ID={db_record.id}")

    except Exception as e:
        db.session.rollback()
        print("❗写入数据库失败：", e)

    return "OK", 200

