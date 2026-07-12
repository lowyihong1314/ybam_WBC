#/function/payment_gateway.py
from flask import Blueprint, request, jsonify, redirect
from requests.auth import HTTPBasicAuth
import requests
from models import db
from models.register_data import RegisterData, PaymentTransaction
import os, json
from function.config import flask_path
from function.settings import (
    BILLPLZ_API_KEY,
    BILLPLZ_BASE_URL,
    BILLPLZ_COLLECTION_ID,
)
from function.versioning import (
    ACTIVE_DATA_VERSION,
    get_request_token,
    normalize_version_name,
    resolve_version_from_token,
    versioned_payload,
)

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


def parse_amount_myr(value):
    try:
        amount = float(value)
    except (TypeError, ValueError):
        return None

    if amount <= 0:
        return None

    return round(amount, 2)


def post_billplz_bill(data):
    resp = requests.post(f"{BILLPLZ_BASE_URL}/v3/bills", auth=auth, data=data, timeout=20)
    payload = resp.json()
    if not resp.ok or "url" not in payload:
        error = payload.get("error")
        if isinstance(error, dict):
            message = error.get("message")
        else:
            message = error
        raise RuntimeError(message or payload.get("message") or "Billplz bill creation failed")

    return payload


ACCOMMODATION_FEE_MYR = 280


def create_accommodation_bill(record):
    version = normalize_version_name(record.version)
    email = (record.email or "").strip()
    name = record.name or record.name_cn or "Anonymous"

    data = {
        "collection_id": BILLPLZ_COLLECTION_ID,
        "email": email,
        "name": name,
        "amount": int(ACCOMMODATION_FEE_MYR * 100),
        "description": f"{version} Hotel Accommodation #{record.id}",

        "redirect_url": external_url(
            f"/static/templates/thankyou.html?id={record.id}&version={version}&purpose=accommodation"
        ),
        "callback_url": external_url(
            f"/payment_gateway/callback?register_id={record.id}&version={version}&purpose=accommodation"
        ),

        "reference_1_label": "Purpose",
        "reference_1": f"Accommodation RM{ACCOMMODATION_FEE_MYR}",
        "reference_2_label": "Register ID",
        "reference_2": record.id,
        "reference_3_label": "Payer Email",
        "reference_3": email,
    }

    return post_billplz_bill(data)


@payment_gateway_bp.route("/pay")
def create_bill():

    register_id = request.args.get("id", type=int)
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
    amount_myr = register_record.payment_amount
    payment_currency = (getattr(register_record, "payment_currency", None) or "RM").upper()
    name = register_record.name or register_record.name_cn or request.args.get("name") or "Anonymous"
    email = register_record.email or request.args.get("email") or "no-email@example.com"

    if amount_myr is None or amount_myr <= 0:
        return jsonify(versioned_payload({
            "success": False,
            "error": "报名记录没有有效付款金额"
        }, version=active_version)), 400

    if payment_currency != "RM":
        return jsonify(versioned_payload({
            "success": False,
            "error": "Billplz 付款金额目前只支持 RM；此报名组别的币种需要先配置换算或外币付款方案",
            "currency": payment_currency,
            "amount": amount_myr,
        }, version=active_version)), 400

    print("💰 用户本次付款金额(RM):", amount_myr)
    print("🆔 报名表 ID:", register_id)
    print("👤 用户姓名:", name)
    print("📩 用户 email:", email)

    credit_card_code = "MBU0227"

    data = {
        "collection_id": BILLPLZ_COLLECTION_ID,
        "email": email,
        "name": name,
        "amount": int(round(float(amount_myr) * 100)),
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

    bill = post_billplz_bill(data)
    bill_url = bill["url"] + "?auto_submit=true"
    return redirect(bill_url)


@payment_gateway_bp.route("/manual_bill", methods=["POST"])
def create_manual_bill():
    token = get_request_token()
    version = resolve_version_from_token(token)
    if not version:
        return jsonify(versioned_payload({
            "success": False,
            "error": "无效 token",
            "error_type": "invalid_token",
        })), 403

    payload = request.get_json(silent=True) or {}
    amount_myr = parse_amount_myr(payload.get("amount_myr"))
    if amount_myr is None:
        return jsonify(versioned_payload({
            "success": False,
            "error": "请输入有效的收款金额",
            "error_type": "invalid_amount",
        }, version=version)), 400

    name = (payload.get("name") or "").strip() or "YBAM Supporter"
    email = (payload.get("email") or "").strip() or "no-email@example.com"
    description = (payload.get("description") or "").strip() or "YBAM Other Collection"
    credit_card_code = "MBU0227"

    data = {
        "collection_id": BILLPLZ_COLLECTION_ID,
        "email": email,
        "name": name,
        "amount": int(round(amount_myr * 100)),
        "description": description,
        "redirect_url": external_url(
            f"/static/templates/thankyou.html?purpose=manual&version={version}"
        ),
        "callback_url": external_url(
            f"/payment_gateway/callback?purpose=manual&version={version}"
        ),
        "reference_1_label": "Bank Code",
        "reference_1": credit_card_code,
        "reference_2_label": "Purpose",
        "reference_2": "Other Collection",
        "reference_3_label": "Created From",
        "reference_3": "YBAM Backend",
    }

    try:
        bill = post_billplz_bill(data)
    except Exception as exc:
        return jsonify(versioned_payload({
            "success": False,
            "error": str(exc),
            "error_type": "billplz_create_failed",
        }, version=version)), 502

    bill_url = f"{bill['url']}?auto_submit=true"
    return jsonify(versioned_payload({
        "success": True,
        "bill_id": bill.get("id"),
        "bill_url": bill_url,
        "amount_myr": amount_myr,
    }, version=version))



@payment_gateway_bp.route("/callback", methods=["POST"])
def callback():
    data = request.form.to_dict()
    register_id = request.args.get("register_id", type=int)
    version = normalize_version_name(request.args.get("version"), ACTIVE_DATA_VERSION)
    bill_id = data.get("id")
    paid = data.get("paid") == "true"
    purpose = request.args.get("purpose") or ("registration" if register_id else "manual")

    final_json = {
        "register_id": register_id,
        "bill_id": bill_id,
        "paid": paid,
        "purpose": purpose,
        "version": version,
        "bill_data": data
    }

    # ========== 保存 JSON 文件 ==========
    try:
        save_dir = os.path.join(flask_path, "uploads", "payments")
        os.makedirs(save_dir, exist_ok=True)
        save_path = os.path.join(save_dir, f"bill_{bill_id}.json")

        with open(save_path, "w", encoding="utf-8") as f:
            json.dump(final_json, f, ensure_ascii=False, indent=4)

    except Exception as e:
        print("❗保存 callback JSON 失败:", e)

    # ========== 保存进数据库 ==========
    if not register_id:
        print(f"💾 其他收款 callback 已保存 JSON, bill_id={bill_id}")
        return "OK", 200

    try:
        db_record = PaymentTransaction(
            register_id=register_id,
            bill_id=bill_id,
            paid=paid,
            raw_json=json.dumps(final_json, ensure_ascii=False),
            purpose=purpose,
            version=version
        )

        db.session.add(db_record)

        if purpose == "accommodation" and paid:
            record = RegisterData.query.filter_by(id=register_id, deleted=False).first()
            if record:
                record.accommodation_paid = True

        db.session.commit()

        print(f"💾 支付数据写入数据库 PaymentTransaction, ID={db_record.id}")

    except Exception as e:
        db.session.rollback()
        print("❗写入数据库失败：", e)

    return "OK", 200
