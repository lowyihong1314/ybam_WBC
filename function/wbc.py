from flask import Blueprint, request, jsonify, send_file, g
from functools import wraps
from datetime import datetime, timezone
from models import db
from models.register_data import RegisterData
import secrets
import os, json
import requests
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
KL_FREE_GROUPS = {"monastic", "academic_presenter", "creative_presenter"}
KL_PAID_GROUPS = {"vendor", "participant"}
DATA_GOV_EXCHANGE_RATE_URL = "https://api.data.gov.my/data-catalogue/"
COUNTRY_DIAL_CODES_URL = "https://restcountries.com/v3.1/all"
EXCHANGE_RATE_CACHE_PATH = os.path.join(flask_path, "instance", "exchange_rate_cache.json")
DEFAULT_COUNTRY_DIAL_CODES = {
    "Malaysia": "+60",
    "Singapore": "+65",
    "China": "+86",
}

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


def parse_optional_int(value):
    if value in (None, ""):
        return None

    try:
        parsed = int(value)
    except (TypeError, ValueError):
        return None

    return parsed if parsed > 0 else None


def parse_optional_float(value):
    if value in (None, ""):
        return None

    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def utc_now_iso():
    return datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")


def read_exchange_rate_cache():
    try:
        with open(EXCHANGE_RATE_CACHE_PATH, "r", encoding="utf-8") as file:
            return json.load(file)
    except (FileNotFoundError, OSError, json.JSONDecodeError):
        return None


def write_exchange_rate_cache(payload):
    os.makedirs(os.path.dirname(EXCHANGE_RATE_CACHE_PATH), exist_ok=True)
    temp_path = f"{EXCHANGE_RATE_CACHE_PATH}.tmp"
    with open(temp_path, "w", encoding="utf-8") as file:
        json.dump(payload, file, ensure_ascii=False, indent=2)
    os.replace(temp_path, EXCHANGE_RATE_CACHE_PATH)


def cached_exchange_rate_response(error=None):
    cached = read_exchange_rate_cache()
    if not cached:
        return None

    payload = {
        **cached,
        "success": True,
        "fallback": True,
    }
    if error:
        payload["warning"] = "Live exchange rate lookup failed; using the last saved rate."

    return jsonify(versioned_payload(payload))


@wbc_bp.route("/exchange_rate/<currency>", methods=["GET"])
def get_exchange_rate(currency):
    normalized_currency = (currency or "").strip().upper()
    if normalized_currency != "USD":
        return jsonify(versioned_payload({
            "success": False,
            "error": "Only USD exchange rate is currently supported",
        })), 400

    params = {
        "id": "exchangerates_daily_0900",
        "limit": 9,
        "sort": "-date",
    }

    lookup_error = None

    try:
        response = requests.get(DATA_GOV_EXCHANGE_RATE_URL, params=params, timeout=12)
        response.raise_for_status()
        payload = response.json()
    except (requests.RequestException, ValueError) as exc:
        lookup_error = f"Unable to fetch exchange rate: {exc}"
        cached = cached_exchange_rate_response(lookup_error)
        if cached:
            return cached
        return jsonify(versioned_payload({"success": False, "error": lookup_error})), 502

    if not isinstance(payload, list):
        lookup_error = "Exchange rate API returned an unexpected response"
        cached = cached_exchange_rate_response(lookup_error)
        if cached:
            return cached
        return jsonify(versioned_payload({"success": False, "error": lookup_error})), 502

    rate = next(
        (
            item
            for item in payload
            if item.get("rate_type") == "middle" and item.get(normalized_currency.lower()) is not None
        ),
        None,
    )

    if not rate:
        lookup_error = "Exchange rate API did not return a usable USD/MYR middle rate"
        cached = cached_exchange_rate_response(lookup_error)
        if cached:
            return cached
        return jsonify(versioned_payload({"success": False, "error": lookup_error})), 502

    exchange_payload = {
        "success": True,
        "currency": normalized_currency,
        "quote": "MYR",
        "rate": float(rate[normalized_currency.lower()]),
        "rate_type": "middle",
        "date": rate.get("date"),
        "rate_time": "09:00 MYT",
        "rate_datetime": f"{rate.get('date')} 09:00 MYT" if rate.get("date") else None,
        "last_updated": rate.get("date"),
        "fetched_at": utc_now_iso(),
        "fallback": False,
        "source": "data.gov.my / Bank Negara Malaysia",
        "source_url": "https://data.gov.my/data-catalogue/exchangerates_daily_0900",
    }

    try:
        write_exchange_rate_cache(exchange_payload)
    except OSError:
        pass

    return jsonify(versioned_payload(exchange_payload))


@wbc_bp.route("/country_dial_codes", methods=["GET"])
def get_country_dial_codes():
    try:
        response = requests.get(
            COUNTRY_DIAL_CODES_URL,
            params={"fields": "name,idd"},
            timeout=12,
        )
        response.raise_for_status()
        countries = response.json()
    except (requests.RequestException, ValueError):
        return jsonify(versioned_payload({
            "success": True,
            "data": DEFAULT_COUNTRY_DIAL_CODES,
            "fallback": True,
        }))

    if not isinstance(countries, list):
        return jsonify(versioned_payload({
            "success": True,
            "data": DEFAULT_COUNTRY_DIAL_CODES,
            "fallback": True,
        }))

    result = {}
    for country in countries:
        if not isinstance(country, dict):
            continue

        name = ((country.get("name") or {}).get("common") or "").strip()
        idd = country.get("idd") or {}
        root = idd.get("root")
        suffixes = idd.get("suffixes") or []
        suffix = suffixes[0] if suffixes else None
        if name and root and suffix:
            result[name] = f"{root}{suffix}"

    return jsonify(versioned_payload({
        "success": True,
        "data": result or DEFAULT_COUNTRY_DIAL_CODES,
        "fallback": not bool(result),
    }))


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
        # Registration group / free access
        # =============================
        registration_group = (form.get("registration_group") or "").strip()
        paper_present = form.get("paper_presentation") == "true"
        if public_version == KL_DATA_VERSION and registration_group not in (KL_FREE_GROUPS | KL_PAID_GROUPS):
            return jsonify(
                versioned_payload(
                    {
                        "success": False,
                        "error": "请选择有效的报名组别",
                        "error_type": "invalid_registration_group",
                    },
                    version=public_version,
                )
            ), 400

        if public_version == KL_DATA_VERSION and registration_group == "vendor":
            required_vendor_fields = {
                "country": "国籍",
                "state_region": "目前所在州属 / 地区",
                "phone": "联络号码",
                "project_name": "所负责摊位的创意教学项目名称",
            }
            missing_vendor_fields = [
                label
                for key, label in required_vendor_fields.items()
                if not (form.get(key) or "").strip()
            ]
            if missing_vendor_fields:
                return jsonify(
                    versioned_payload(
                        {
                            "success": False,
                            "error": f"摊主 / 摊位协助人员报名缺少资料：{', '.join(missing_vendor_fields)}",
                            "error_type": "missing_vendor_profile",
                        },
                        version=public_version,
                    )
                ), 400

        is_kl_free_registration = (
            public_version == KL_DATA_VERSION and registration_group in KL_FREE_GROUPS
        )

        if is_kl_free_registration:
            payment_amount = 0

        # =============================
        # Hotel accommodation (all groups)
        # 免费组别只记录需求（工作人员线下对接）；付费组别审核通过后由 Billplz 发住宿账单
        # =============================
        accommodation_required = False
        roommate_name = None
        roommate_doc_no = None

        if public_version == KL_DATA_VERSION:
            accommodation_required = form.get("accommodation_required") == "true"

            if accommodation_required:
                if not (form.get("doc_no") or "").strip():
                    return jsonify(
                        versioned_payload(
                            {
                                "success": False,
                                "error": "申请住宿需要填写身份证号码（IC）/ 护照号码",
                                "error_type": "missing_accommodation_doc_no",
                            },
                            version=public_version,
                        )
                    ), 400

                if registration_group in KL_PAID_GROUPS and not (form.get("email") or "").strip():
                    return jsonify(
                        versioned_payload(
                            {
                                "success": False,
                                "error": "申请住宿需要填写 Email（用于接收 Billplz 住宿付款账单）",
                                "error_type": "missing_accommodation_email",
                            },
                            version=public_version,
                        )
                    ), 400

                roommate_name = (form.get("roommate_name") or "").strip() or None
                roommate_doc_no = (form.get("roommate_doc_no") or "").strip() or None

                if roommate_name and not roommate_doc_no:
                    return jsonify(
                        versioned_payload(
                            {
                                "success": False,
                                "error": "请填写同房对象的身份证号码（IC）/ 护照号码",
                                "error_type": "missing_roommate_doc_no",
                            },
                            version=public_version,
                        )
                    ), 400

        if public_version == KL_DATA_VERSION and registration_group in KL_PAID_GROUPS:
            if payment_amount is None or payment_amount <= 0:
                return jsonify(
                    versioned_payload(
                        {
                            "success": False,
                            "error": "付费报名组别缺少有效付款金额",
                            "error_type": "invalid_payment_amount",
                        },
                        version=public_version,
                    )
                ), 400
            if (form.get("payment_currency") or "RM").upper() != "RM":
                return jsonify(
                    versioned_payload(
                        {
                            "success": False,
                            "error": "付费金额必须先换算成 MYR 后才能提交 Billplz",
                            "error_type": "payment_currency_must_be_myr",
                        },
                        version=public_version,
                    )
                ), 400

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
            doc_no=form.get("doc_no") or f"{registration_group or 'KL'}-{secrets.token_hex(6)}",
            name=form.get("name") or form.get("dharma_name") or form.get("name_cn"),
            name_cn=form.get("name_cn"),
            phone=form.get("phone"),
            email=form.get("email"),
            country=form.get("country"),
            age=form.get("age"),
            medical_information=form.get("medical_information"),
            emergency_contact=form.get("emergency_contact"),
            doc_type=form.get("doc_type") or "Internal",
            registration_group=registration_group or None,
            gender=form.get("gender"),
            state_region=form.get("state_region"),
            organization=form.get("organization"),
            project_name=form.get("project_name"),
            helper_count=parse_optional_int(form.get("helper_count")),
            helper_names=form.get("helper_names"),
            special_request=form.get("special_request"),

            accommodation_required=accommodation_required,
            roommate_name=roommate_name,
            roommate_doc_no=roommate_doc_no,

            payment_amount=payment_amount,
            payment_currency=(form.get("payment_currency") or "RM").upper(),
            participant_category=form.get("participant_category"),
            original_payment_amount=parse_optional_float(form.get("original_payment_amount")),
            original_payment_currency=(form.get("original_payment_currency") or "").upper() or None,
            exchange_rate=parse_optional_float(form.get("exchange_rate")),
            exchange_rate_date=form.get("exchange_rate_date"),

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
