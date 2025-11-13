from flask import Blueprint, request, jsonify
from functools import wraps
from models import db
from models.register_data import RegisterData
import secrets
import time
from password import MASTER_TOKEN

wbc_bp = Blueprint("wbc", __name__)

ACTIVE_SESSIONS = {}

SESSION_EXPIRE_TIME = 60 * 60 * 4  # 会话有效期 4 小时

@wbc_bp.route("/login_with_token", methods=["POST"])
def login_with_token():
    data = request.get_json()
    token = data.get("token") if data else None

    if not token:
        return jsonify({"success": False, "error": "缺少 token"}), 400

    if token != MASTER_TOKEN:
        return jsonify({"success": False, "error": "无效 token"}), 403

    # 生成随机 session token
    session_token = secrets.token_hex(32)
    now = time.time()

    ACTIVE_SESSIONS[session_token] = {
        "created": now,
        "expires": now + SESSION_EXPIRE_TIME
    }

    return jsonify({
        "success": True,
        "session_token": session_token,
        "expires_in": SESSION_EXPIRE_TIME
    })

def session_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get("Authorization") or request.args.get("token")

        if not token:
            return jsonify({
                "success": False,
                "error": "缺少 token",
                "error_type": "missing_token"  # 🔹 前端可识别类型
            }), 401

        if token.startswith("Bearer "):
            token = token.replace("Bearer ", "").strip()

        session_info = ACTIVE_SESSIONS.get(token)
        if not session_info:
            return jsonify({
                "success": False,
                "error": "无效或已过期 session",
                "error_type": "invalid_token"  # 🔹 无效或不存在
            }), 403

        if session_info["expires"] < time.time():
            del ACTIVE_SESSIONS[token]
            return jsonify({
                "success": False,
                "error": "session 已过期，请重新登录",
                "error_type": "expired_session"  # 🔹 已过期
            }), 403

        return f(*args, **kwargs)

    return decorated

@wbc_bp.route("/get_all_register_data", methods=["GET"])
@session_required
def get_all_register_data():
    try:
        records = RegisterData.query.order_by(RegisterData.id.desc()).all()
        return jsonify({
            "success": True,
            "count": len(records),
            "data": [r.to_dict() for r in records]
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)}), 500

@wbc_bp.route("/get_register_data", methods=["GET"])
@session_required
def get_register_data():
    record_id = request.args.get("id", type=int)
    if not record_id:
        return jsonify({"success": False, "error": "缺少 id 参数"}), 400

    try:
        record = RegisterData.query.get(record_id)
        if not record:
            return jsonify({"success": False, "error": f"未找到 ID {record_id} 的报名资料"}), 404
        return jsonify({"success": True, "data": record.to_dict()})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@wbc_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    if not data:
        return jsonify({"success": False, "error": "缺少 JSON 数据"}), 400

    try:
        new_record = RegisterData(
            doc_no=data.get("doc_no"),
            name=data.get("name"),
            name_cn=data.get("name_cn"),
            phone=data.get("phone"),
            email=data.get("email"),
            country=data.get("country"),
            age=data.get("age"),
            medical_information=data.get("medical_information"),
            emergency_contact=data.get("emergency_contact"),
            doc_type=data.get("doc_type"),
            payment_amount=data.get("payment_amount"),
            payment_doc=data.get("payment_doc")
        )

        db.session.add(new_record)
        db.session.commit()

        return jsonify({
            "success": True,
            "message": "报名资料已写入数据库",
            "data": new_record.to_dict()
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)}), 500
