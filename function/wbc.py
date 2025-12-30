from flask import Blueprint, request, jsonify,send_file
from functools import wraps
from models import db
from models.register_data import RegisterData
import secrets
import time
from password import MASTER_TOKEN
import os,json
from function.config import flask_path
from function.socket_init import socketio

from werkzeug.utils import secure_filename

wbc_bp = Blueprint("wbc", __name__)

ACTIVE_SESSIONS = {}

SESSION_EXPIRE_TIME = 60 * 60 * 4  # 会话有效期 4 小时

@wbc_bp.route("/rate")
def rate():
    import requests
    r = requests.get("https://sim-ray.com/ocr/get_new_rate")
    return jsonify(r.json())

@wbc_bp.route("/login_with_token", methods=["POST"])
def login_with_token():
    data = request.get_json()
    token = data.get("token") if data else None

    if token != MASTER_TOKEN:
        return jsonify({
            "success": False,
            "error": "无效 token",
            "error_type": "invalid_token"
        }), 403

    # 所有用户房间就是 MASTER_TOKEN
    return jsonify({
        "success": True,
        "session_token": MASTER_TOKEN,
        "room": MASTER_TOKEN
    })

def session_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get("Authorization") or request.args.get("token")

        if not token:
            return jsonify({"success": False, "error": "缺少 token","error_type":"missing_token"}), 401

        if token.startswith("Bearer "):
            token = token.replace("Bearer ", "").strip()

        if token != MASTER_TOKEN:
            return jsonify({"success": False, "error": "缺少 token","error_type":"invalid_token"}), 403

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
            "room": MASTER_TOKEN,
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

@wbc_bp.route("/register/<int:record_id>/review", methods=["POST"])
def review_register_data(record_id):
    record = RegisterData.query.filter_by(
        id=record_id,
        deleted=False
    ).first()

    if not record:
        return jsonify({
            "success": False,
            "error": "Record not found"
        }), 404

    data = request.get_json(silent=True) or {}
    action = data.get("action")

    if action not in ("accept", "reject"):
        return jsonify({
            "success": False,
            "error": "Invalid action, must be 'accept' or 'reject'"
        }), 400

    # 可选：防止重复操作
    if action == "accept" and record.validfy:
        return jsonify({
            "success": False,
            "error": "Already accepted"
        }), 400

    if action == "accept":
        record.validfy = True
        message = "审核已通过"
    else:
        record.validfy = False
        message = "审核已拒绝"

    db.session.commit()

    return jsonify({
        "success": True,
        "message": message,
        "data": record.to_dict()
    })


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
        form = request.form

        # =============================
        # 支付字段 — 来自 hidden input
        # =============================
        payment_amount = form.get("payment_amount")
        try:
            payment_amount = float(payment_amount)
        except:
            payment_amount = None

        # =============================
        # 是否投稿
        # =============================
        paper_present = form.get("paper_presentation") == "true"

        # =============================
        # 保存 payment_doc
        # =============================
        payment_file = request.files.get("payment_doc")
        payment_doc_filename = None

        if payment_file:
            upload_dir = os.path.join(flask_path, "uploads", "payments")
            os.makedirs(upload_dir, exist_ok=True)

            payment_doc_filename = secure_filename(payment_file.filename)
            save_path = os.path.join(upload_dir, payment_doc_filename)
            payment_file.save(save_path)

        # =============================
        # 写入数据库
        # =============================
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

            payment_amount=payment_amount,

            # ⭐新增
            paper_presentation=paper_present,
            paper_title=form.get("paper_title"),
            abstract=form.get("abstract"),

            payment_doc=payment_doc_filename  # ⭐只存文件名
        )


        db.session.add(new_record)
        db.session.commit()
        register_id = new_record.id

        # =============================
        # 保存 paper PDF 文件
        # =============================
        if paper_present:
            paper_files = request.files.getlist("paper_files")

            paper_dir = os.path.join(flask_path, "uploads", "papers", str(register_id))
            os.makedirs(paper_dir, exist_ok=True)

            saved_names = []

            for f in paper_files:
                fname = secure_filename(f.filename)
                save_path = os.path.join(paper_dir, fname)
                f.save(save_path)

                # ⭐ 只存文件名
                saved_names.append(fname)

            new_record.paper_files = json.dumps(saved_names)
            db.session.commit()

        socketio.emit("register_update", new_record.to_dict(), room=MASTER_TOKEN)

        return jsonify({
            "success": True,
            "message": "报名数据已写入数据库",
            "data": new_record.to_dict()
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)}), 500

@wbc_bp.route("/get_paper_file")
def get_paper_file():
    register_id = request.args.get("id")
    filename = request.args.get("filename")

    if not register_id or not filename:
        return "Missing id or filename", 400

    file_path = os.path.join(
        flask_path, "uploads", "papers", str(register_id), filename
    )

    if not os.path.exists(file_path):
        return "File not found", 404

    return send_file(file_path, as_attachment=True)
