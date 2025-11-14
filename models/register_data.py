# models/register_data.py
from models import db
from datetime import datetime

class RegisterData(db.Model):
    __tablename__ = 'register_data'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
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
    payment_amount = db.Column(db.Numeric(10, 2))
    payment_doc = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    deleted = db.Column(db.Boolean, default=False, nullable=False)  # ✅ 新字段

    def to_dict(self):
        if self.deleted:
            return {}
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
            "payment_amount": float(self.payment_amount or 0),
            "payment_doc": self.payment_doc,
            "created_at": self.created_at.strftime("%Y-%m-%d %H:%M:%S") if self.created_at else None
        }
