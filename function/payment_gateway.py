#/function/payment_gateway.py
from flask import Blueprint, request, jsonify,send_file,redirect
from requests.auth import HTTPBasicAuth
import requests
from models import db
from models.register_data import RegisterData,PaymentTransaction
import os,json
from function.config import flask_path
from function.settings import (
    BILLPLZ_API_KEY,
    BILLPLZ_BASE_URL,
    BILLPLZ_COLLECTION_ID,
)
from function.versioning import ACTIVE_DATA_VERSION, normalize_version_name, versioned_payload

payment_gateway_bp = Blueprint("payment_gateway", __name__)

@payment_gateway_bp.route("/ping", methods=["GET"])
def ping():
    return jsonify(versioned_payload({"message": "pong"}))


auth = HTTPBasicAuth(BILLPLZ_API_KEY, "")


def external_url(path):
    prefix = request.headers.get("X-Forwarded-Prefix", "").rstrip("/")
    scheme = request.headers.get("X-Forwarded-Proto", request.scheme)
    host = request.headers.get("Host", request.host)
    clean_path = path if path.startswith("/") else f"/{path}"
    return f"{scheme}://{host}{prefix}{clean_path}"


@payment_gateway_bp.route("/pay")
def create_bill():

    amount_myr = request.args.get("amount_myr")
    register_id = request.args.get("id", type=int)
    name = request.args.get("name") or "Anonymous"
    email = request.args.get("email") or "no-email@example.com"
    requested_version = request.args.get("version")
    register_query = RegisterData.query.filter_by(id=register_id, deleted=False)
    if requested_version:
        register_query = register_query.filter_by(
            version=normalize_version_name(requested_version)
        )

    register_record = register_query.first()

    if not register_record:
        return jsonify(versioned_payload({
            "success": False,
            "error": "报名记录不存在或版本不匹配"
        })), 404

    active_version = normalize_version_name(register_record.version)

    print("💰 用户本次付款金额(RM):", amount_myr)
    print("🆔 报名表 ID:", register_id)
    print("👤 用户姓名:", name)
    print("📩 用户 email:", email)

    credit_card_code = "MBU0227"

    url = f"{BILLPLZ_BASE_URL}/v3/bills"

    data = {
        "collection_id": BILLPLZ_COLLECTION_ID,
        "email": email,
        "name": name,
        "amount": int(float(amount_myr) * 100),
        "description": f"{active_version} Registration #{register_id}",

        "redirect_url": external_url(
            f"/static/templates/thankyou.html?id={register_id}&version={active_version}"
        ),
        "callback_url": external_url(
            f"/payment_gateway/callback?register_id={register_id}&version={active_version}"
        ),


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
    register_id = request.args.get("register_id", type=int)
    version = normalize_version_name(request.args.get("version"), ACTIVE_DATA_VERSION)
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
            "version": version,
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
            raw_json=json.dumps(final_json, ensure_ascii=False),
            version=version
        )

        db.session.add(db_record)
        db.session.commit()

        print(f"💾 支付数据写入数据库 PaymentTransaction, ID={db_record.id}")

    except Exception as e:
        db.session.rollback()
        print("❗写入数据库失败：", e)

    return "OK", 200
