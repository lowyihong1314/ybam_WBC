# models/register_data.py
from models import db
from datetime import datetime
import json


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

    payment_amount = db.Column(db.Float)

    paper_presentation = db.Column(db.Boolean, default=False)
    paper_files = db.Column(db.Text)
    payment_doc = db.Column(db.String(255))

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

            "payment_amount": self.payment_amount,

            "paper_presentation": self.paper_presentation,

            # ⭐ 新增字段（可为 null）
            "paper_title": self.paper_title,
            "abstract": self.abstract,
            "validfy": self.validfy,   # ✅ 新增

            "paper_files": json.loads(self.paper_files) if self.paper_files else [],
            "payment_doc": self.payment_doc,
            "created_at": self.created_at.strftime("%Y-%m-%d %H:%M:%S"),

            "payment_transactions": [t.to_dict() for t in self.transactions]
        }


class PaymentTransaction(db.Model):
    __tablename__ = 'payment_transaction'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    register_id = db.Column(db.Integer, db.ForeignKey('register_data.id'), nullable=False)
    bill_id = db.Column(db.String(100))
    paid = db.Column(db.Boolean, default=False)
    raw_json = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "register_id": self.register_id,
            "bill_id": self.bill_id,
            "paid": self.paid,
            "raw_json": json.loads(self.raw_json) if self.raw_json else None,
            "created_at": self.created_at.strftime("%Y-%m-%d %H:%M:%S")
        }
