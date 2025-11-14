from flask import Blueprint, request, jsonify,send_file
from functools import wraps
from models import db
from models.register_data import RegisterData
import secrets
import time
from password import MASTER_TOKEN
import os
from function.config import flask_path

from werkzeug.utils import secure_filename

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

@wbc_bp.route("/register/<int:record_id>/delete", methods=["POST"])
def delete_register_data(record_id):
    record = RegisterData.query.get(record_id)
    if not record:
        return jsonify({"success": False, "error": "记录不存在"}), 404

    try:
        record.deleted = True
        db.session.commit()
        return jsonify({"success": True, "message": "已标记为删除"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)}), 500

@wbc_bp.route("/register/<int:record_id>/edit", methods=["POST"])
def edit_register_data(record_id):
    record = RegisterData.query.get(record_id)
    if not record or record.deleted:
        return jsonify({"success": False, "error": "记录不存在或已删除"}), 404

    form = request.form
    try:
        record.name = form.get("name", record.name)
        record.name_cn = form.get("name_cn", record.name_cn)
        record.phone = form.get("phone", record.phone)
        record.email = form.get("email", record.email)
        record.country = form.get("country", record.country)
        record.age = form.get("age", record.age)
        record.medical_information = form.get("medical_information", record.medical_information)
        record.emergency_contact = form.get("emergency_contact", record.emergency_contact)
        record.doc_type = form.get("doc_type", record.doc_type)
        record.doc_no = form.get("doc_no", record.doc_no)
        record.payment_amount = form.get("payment_amount", record.payment_amount)

        file = request.files.get("payment_doc")
        if file:
            upload_dir = os.path.join(flask_path, "uploads")
            os.makedirs(upload_dir, exist_ok=True)
            filename = secure_filename(file.filename)
            saved_file_path = os.path.join(upload_dir, filename)
            file.save(saved_file_path)
            record.payment_doc = saved_file_path

        db.session.commit()
        return jsonify({"success": True, "message": "编辑成功", "data": record.to_dict()})
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)}), 500

@wbc_bp.route("/register/image/<int:record_id>", methods=["GET"])
def get_register_data_img(record_id):
    record = RegisterData.query.get(record_id)
    if not record or record.deleted:
        return jsonify({"success": False, "error": "记录不存在或已删除"}), 404

    if not record.payment_doc or not os.path.isfile(record.payment_doc):
        return jsonify({"success": False, "error": "没有上传文件"}), 404

    try:
        return send_file(record.payment_doc)
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@wbc_bp.route("/register", methods=["POST"])
def register():
    try:
        # 1. 接收普通字段
        form = request.form
        
        # 2. 接收文件字段
        file = request.files.get("payment_doc")

        saved_file_path = None

        if file:
            # 3. 确保上传目录存在
            upload_dir = os.path.join(flask_path, "uploads")
            os.makedirs(upload_dir, exist_ok=True)

            # 4. 保存文件
            filename = secure_filename(file.filename)
            saved_file_path = os.path.join(upload_dir, filename)
            file.save(saved_file_path)

        # 5. 创建数据库记录
        new_record = RegisterData(
            doc_no=form.get("doc_no"),
            name=form.get("name"),
            name_cn=form.get("name_cn"),
            phone=form.get("phone"),
            email=form.get("email"),
            country=form.get("country"),
            age=form.get("age"),
            medical_information=form.get("medical_information"),
            emergency_contact=form.get("emergency_contact"),
            doc_type=form.get("doc_type"),
            payment_amount=form.get("payment_amount"),
            payment_doc=saved_file_path  # 保存文件路径到数据库
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
