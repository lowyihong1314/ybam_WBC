# models/register_data.py
from models import db
from datetime import datetime
import json

DEFAULT_DATA_VERSION = "WBC_Penang_2026"


## 帮我在 mariadb 创建 YBAM 数据库 ，然后创建这些表
class RegisterData(db.Model):
    __tablename__ = 'register_data'

    id = db.Column(db.Integer, primary_key=True)

    doc_no = db.Column(db.String(50), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    name_cn = db.Column(db.String(100))
    phone = db.Column(db.String(20))
    email = db.Column(db.String(100))
    country = db.Column(db.String(100))
    age = db.Column(db.Integer)
    medical_information = db.Column(db.Text)
    emergency_contact = db.Column(db.String(255))
    doc_type = db.Column(db.String(50))
    registration_group = db.Column(db.String(50))
    gender = db.Column(db.String(20))
    state_region = db.Column(db.String(100))
    organization = db.Column(db.String(200))
    project_name = db.Column(db.String(255))
    helper_count = db.Column(db.Integer)
    helper_names = db.Column(db.Text)
    special_request = db.Column(db.Text)

    accommodation_required = db.Column(db.Boolean, default=False)
    roommate_name = db.Column(db.String(100))
    roommate_doc_no = db.Column(db.String(50))
    accommodation_paid = db.Column(db.Boolean, default=False)
    accommodation_bill_id = db.Column(db.String(100))
    accommodation_bill_url = db.Column(db.String(255))

    payment_amount = db.Column(db.Float)
    payment_currency = db.Column(db.String(10))
    participant_category = db.Column(db.String(50))
    original_payment_amount = db.Column(db.Float)
    original_payment_currency = db.Column(db.String(10))
    exchange_rate = db.Column(db.Float)
    exchange_rate_date = db.Column(db.String(20))

    paper_presentation = db.Column(db.Boolean, default=False)
    paper_files = db.Column(db.Text)
    payment_doc = db.Column(db.String(255))
    version = db.Column(db.String(100), nullable=False, default=DEFAULT_DATA_VERSION)

    # =============================
    # Student fields（新增）
    # =============================
    is_student = db.Column(db.Boolean, default=False)
    student_card_no = db.Column(db.String(100))
    student_card_expiry = db.Column(db.String(20))  # 或 db.Date
    student_school = db.Column(db.String(200))
    student_card_image = db.Column(db.String(255))  # 只存文件名

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    deleted = db.Column(db.Boolean, default=False)

    paper_title = db.Column(db.String(300), nullable=True)
    abstract = db.Column(db.Text, nullable=True)
    validfy = db.Column(db.Boolean, default=False)

    # ----------- 关系 ------------
    transactions = db.relationship(
        "PaymentTransaction",
        backref="register",
        lazy=True,
        cascade="all, delete-orphan"
    )

    def to_dict(self):
        return {
            "id": self.id,
            "doc_no": self.doc_no,
            "name": self.name,
            "name_cn": self.name_cn,
            "phone": self.phone,
            "email": self.email,
            "country": self.country,
            "age": self.age,
            "medical_information": self.medical_information,
            "emergency_contact": self.emergency_contact,
            "doc_type": self.doc_type,
            "registration_group": self.registration_group,
            "gender": self.gender,
            "state_region": self.state_region,
            "organization": self.organization,
            "project_name": self.project_name,
            "helper_count": self.helper_count,
            "helper_names": self.helper_names,
            "special_request": self.special_request,

            "accommodation_required": self.accommodation_required,
            "roommate_name": self.roommate_name,
            "roommate_doc_no": self.roommate_doc_no,
            "accommodation_paid": self.accommodation_paid,
            "accommodation_bill_id": self.accommodation_bill_id,
            "accommodation_bill_url": self.accommodation_bill_url,

            "payment_amount": self.payment_amount,
            "payment_currency": self.payment_currency,
            "participant_category": self.participant_category,
            "original_payment_amount": self.original_payment_amount,
            "original_payment_currency": self.original_payment_currency,
            "exchange_rate": self.exchange_rate,
            "exchange_rate_date": self.exchange_rate_date,

            "paper_presentation": self.paper_presentation,

            # -------- Student --------
            "is_student": self.is_student,
            "student_card_no": self.student_card_no,
            "student_card_expiry": self.student_card_expiry,
            "student_school": self.student_school,
            "student_card_image": self.student_card_image,

            # -------- Paper --------
            "paper_title": self.paper_title,
            "abstract": self.abstract,
            "validfy": self.validfy,

            "paper_files": json.loads(self.paper_files) if self.paper_files else [],
            "payment_doc": self.payment_doc,
            "version": self.version,
            "created_at": self.created_at.strftime("%Y-%m-%d %H:%M:%S") if self.created_at else "",
            "deleted": self.deleted,

            "payment_transactions": [t.to_dict() for t in self.transactions]
        }


class PaymentTransaction(db.Model):
    __tablename__ = 'payment_transaction'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    register_id = db.Column(db.Integer, db.ForeignKey('register_data.id'), nullable=False)
    bill_id = db.Column(db.String(100))
    paid = db.Column(db.Boolean, default=False)
    raw_json = db.Column(db.Text)
    purpose = db.Column(db.String(30), default="registration")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    version = db.Column(db.String(100), nullable=False, default=DEFAULT_DATA_VERSION)

    def to_dict(self):
        return {
            "id": self.id,
            "register_id": self.register_id,
            "bill_id": self.bill_id,
            "paid": self.paid,
            "raw_json": json.loads(self.raw_json) if self.raw_json else None,
            "purpose": self.purpose,
            "created_at": self.created_at.strftime("%Y-%m-%d %H:%M:%S"),
            "version": self.version
        }
