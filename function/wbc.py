from flask import Blueprint, request, jsonify, send_file, g
from functools import wraps
from models import db
from models.register_data import RegisterData
import secrets
import os, json
from function.config import flask_path
from function.socket_init import socketio
from function.versioning import (
    ACTIVE_DATA_VERSION,
    KL_DATA_VERSION,
    get_request_room,
    get_request_token,
    get_request_version,
    normalize_version_name,
    resolve_room_from_version,
    resolve_version_from_token,
    versioned_payload,
)

from werkzeug.utils import secure_filename

wbc_bp = Blueprint("wbc", __name__)

ACTIVE_SESSIONS = {}

SESSION_EXPIRE_TIME = 60 * 60 * 4  # 会话有效期 4 小时

@wbc_bp.route("/login_with_token", methods=["POST"])
def login_with_token():
    data = request.get_json()
    token = data.get("token") if data else None
    token = token.strip() if token else None
    version = resolve_version_from_token(token)

    if not version:
        return jsonify(versioned_payload({
            "success": False,
            "error": "无效 token",
            "error_type": "invalid_token"
        })), 403

    room = token
    return jsonify(versioned_payload({
        "success": True,
        "session_token": token,
        "room": room,
        "version": version
    }))

def session_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = get_request_token()

        if not token:
            return jsonify(versioned_payload({"success": False, "error": "缺少 token","error_type":"missing_token"})), 401

        version = resolve_version_from_token(token)
        if not version:
            return jsonify(versioned_payload({"success": False, "error": "缺少 token","error_type":"invalid_token"})), 403

        g.data_version = version
        g.room = token

        return f(*args, **kwargs)

    return decorated

@wbc_bp.route("/get_all_register_data", methods=["GET"])
@session_required
def get_all_register_data():
    try:
        data_version = get_request_version()
        records = RegisterData.query.filter_by(version=data_version).order_by(RegisterData.id.desc()).all()
        return jsonify(versioned_payload({
            "success": True,
            "count": len(records),
            "room": get_request_room(),
            "data": [r.to_dict() for r in records]
        }, version=data_version))
    except Exception as e:
        db.session.rollback()
        return jsonify(versioned_payload({"success": False, "error": str(e)})), 500


@wbc_bp.route("/export_all_data", methods=["GET"])
@session_required
def export_all_data():
    return jsonify(versioned_payload({
        "success": False,
        "error": "Excel export has moved to the Vite frontend.",
        "error_type": "frontend_export_only",
    })), 410

@wbc_bp.route("/get_register_data", methods=["GET"])
@session_required
def get_register_data():
    record_id = request.args.get("id", type=int)
    if not record_id:
        return jsonify(versioned_payload({"success": False, "error": "缺少 id 参数"})), 400

    try:
        record = RegisterData.query.filter_by(id=record_id, version=get_request_version()).first()
        if not record:
            return jsonify(versioned_payload({"success": False, "error": f"未找到 ID {record_id} 的报名资料"})), 404
        return jsonify(versioned_payload({"success": True, "data": record.to_dict()}, version=get_request_version()))
    except Exception as e:
        return jsonify(versioned_payload({"success": False, "error": str(e)})), 500

@wbc_bp.route("/register/<int:record_id>/delete", methods=["POST"])
@session_required
def delete_register_data(record_id):
    record = RegisterData.query.filter_by(id=record_id, version=get_request_version()).first()
    if not record:
        return jsonify(versioned_payload({"success": False, "error": "记录不存在"})), 404

    try:
        record.deleted = True
        db.session.commit()
        return jsonify(versioned_payload({"success": True, "message": "已标记为删除"}))
    except Exception as e:
        db.session.rollback()
        return jsonify(versioned_payload({"success": False, "error": str(e)})), 500

@wbc_bp.route("/register/<int:record_id>/review", methods=["POST"])
@session_required
def review_register_data(record_id):
    record = RegisterData.query.filter_by(
        id=record_id,
        version=get_request_version(),
        deleted=False
    ).first()

    if not record:
        return jsonify(versioned_payload({
            "success": False,
            "error": "Record not found"
        })), 404

    data = request.get_json(silent=True) or {}
    action = data.get("action")

    if action not in ("accept", "reject"):
        return jsonify(versioned_payload({
            "success": False,
            "error": "Invalid action, must be 'accept' or 'reject'"
        })), 400

    # 可选：防止重复操作
    if action == "accept" and record.validfy:
        return jsonify(versioned_payload({
            "success": False,
            "error": "Already accepted"
        })), 400

    if action == "accept":
        record.validfy = True
        message = "审核已通过"
    else:
        record.validfy = False
        message = "审核已拒绝"

    db.session.commit()

    return jsonify(versioned_payload({
        "success": True,
        "message": message,
        "data": record.to_dict()
    }))

@wbc_bp.route("/register/image/student_card/<int:record_id>", methods=["GET"])
def get_register_student_card_img(record_id):
    version = resolve_version_from_token(get_request_token()) or ACTIVE_DATA_VERSION
    record = RegisterData.query.filter_by(id=record_id, version=version).first()
    if not record or record.deleted:
        return jsonify(versioned_payload({"success": False, "error": "记录不存在或已删除"})), 404

    if not record.is_student or not record.student_card_image:
        return jsonify(versioned_payload({"success": False, "error": "没有学生证文件"})), 404

    student_card_path = os.path.join(
        flask_path,
        "uploads",
        "student_card",
        str(record_id),
        record.student_card_image
    )

    if not os.path.isfile(student_card_path):
        return jsonify(versioned_payload({"success": False, "error": "学生证文件不存在"})), 404

    try:
        return send_file(student_card_path)
    except Exception as e:
        return jsonify(versioned_payload({"success": False, "error": str(e)})), 500

@wbc_bp.route("/register/image/<int:record_id>", methods=["GET"])
def get_register_data_img(record_id):
    version = resolve_version_from_token(get_request_token()) or ACTIVE_DATA_VERSION
    record = RegisterData.query.filter_by(id=record_id, version=version).first()
    if not record or record.deleted:
        return jsonify(versioned_payload({"success": False, "error": "记录不存在或已删除"})), 404

    if not record.payment_doc or not os.path.isfile(record.payment_doc):
        return jsonify(versioned_payload({"success": False, "error": "没有上传文件"})), 404

    try:
        return send_file(record.payment_doc)
    except Exception as e:
        return jsonify(versioned_payload({"success": False, "error": str(e)})), 500

@wbc_bp.route("/register", methods=["POST"])
def register():
    public_version = ACTIVE_DATA_VERSION
    try:
        form = request.form
        public_version = normalize_version_name(
            form.get("version") or request.args.get("version")
        )

        if public_version != KL_DATA_VERSION:
            return jsonify(
                versioned_payload(
                    {
                        "success": False,
                        "error": "活动已过期或不存在",
                        "error_type": "conference_unavailable",
                    },
                    version=public_version,
                )
            ), 404

        # =============================
        # Student fields
        # =============================
        is_student = (form.get("is_student") or "no").lower() == "yes"
        student_card_no = form.get("student_card_no")
        student_card_expiry = form.get("student_card_expiry")
        student_school = form.get("student_school")
        student_card_file = request.files.get("student_card_image")
        student_card_filename = None

        # =============================
        # Payment amount
        # =============================
        payment_amount = form.get("payment_amount")
        try:
            payment_amount = float(payment_amount)
        except:
            payment_amount = None

        # =============================
        # Paper presentation?
        # =============================
        paper_present = form.get("paper_presentation") == "true"

        # =============================
        # Save payment_doc
        # =============================
        payment_file = request.files.get("payment_doc")
        payment_doc_filename = None

        if payment_file:
            payment_dir = os.path.join(flask_path, "uploads", "payments")
            os.makedirs(payment_dir, exist_ok=True)

            payment_doc_filename = secure_filename(payment_file.filename)
            payment_file.save(os.path.join(payment_dir, payment_doc_filename))

        # =============================
        # Write to DB (initial)
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

            paper_presentation=paper_present,
            paper_title=form.get("paper_title"),
            abstract=form.get("abstract"),
            payment_doc=payment_doc_filename,

            is_student=is_student,
            student_card_no=student_card_no,
            student_card_expiry=student_card_expiry,
            student_school=student_school,
            student_card_image=None,
            version=public_version,
        )

        db.session.add(new_record)
        db.session.commit()
        register_id = new_record.id

        # =============================
        # Save student card image
        # =============================
        if is_student:
            if not student_card_file:
                return jsonify(
                    versioned_payload(
                        {"success": False, "error": "Missing student card image"},
                        version=public_version,
                    )
                ), 400

            student_dir = os.path.join(
                flask_path, "uploads", "student_card", str(register_id)
            )
            os.makedirs(student_dir, exist_ok=True)

            student_card_filename = secure_filename(student_card_file.filename)
            student_card_file.save(os.path.join(student_dir, student_card_filename))

            new_record.student_card_image = student_card_filename
            db.session.commit()

        # =============================
        # Save paper PDFs
        # =============================
        if paper_present:
            paper_files = request.files.getlist("paper_files")

            paper_dir = os.path.join(flask_path, "uploads", "papers", str(register_id))
            os.makedirs(paper_dir, exist_ok=True)

            saved_names = []
            for f in paper_files:
                fname = secure_filename(f.filename)
                f.save(os.path.join(paper_dir, fname))
                saved_names.append(fname)

            new_record.paper_files = json.dumps(saved_names)
            db.session.commit()

        socketio.emit(
            "register_update",
            new_record.to_dict(),
            room=resolve_room_from_version(new_record.version),
        )

        return jsonify(versioned_payload({
            "success": True,
            "message": "报名数据已写入数据库",
            "data": new_record.to_dict()
        }, version=public_version))

    except Exception as e:
        db.session.rollback()
        return jsonify(
            versioned_payload(
                {"success": False, "error": str(e)},
                version=public_version,
            )
        ), 500

@wbc_bp.route("/get_paper_file")
def get_paper_file():
    register_id = request.args.get("id", type=int)
    filename = request.args.get("filename")

    if not register_id or not filename:
        return jsonify(versioned_payload({"success": False, "error": "Missing id or filename"})), 400

    version = resolve_version_from_token(get_request_token()) or ACTIVE_DATA_VERSION
    record = RegisterData.query.filter_by(
        id=register_id,
        version=version,
        deleted=False
    ).first()
    if not record:
        return jsonify(versioned_payload({"success": False, "error": "记录不存在或版本不匹配"})), 404

    file_path = os.path.join(
        flask_path, "uploads", "papers", str(register_id), filename
    )

    if not os.path.exists(file_path):
        return jsonify(versioned_payload({"success": False, "error": "File not found"})), 404

    return send_file(file_path, as_attachment=True)
