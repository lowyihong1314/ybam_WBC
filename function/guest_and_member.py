#/function/guest_and_member.py
from flask import Blueprint, request, jsonify,send_file
from functools import wraps
from models import db
from models.register_data import RegisterData
import secrets
import time
from password import MASTER_TOKEN
import os
from function.config import flask_path
from function.socket_init import socketio

from werkzeug.utils import secure_filename

guest_and_member_bp = Blueprint("guest_and_member", __name__)

@guest_and_member_bp.route("/ping", methods=["GET"])
def ping():
    return "pong"

@guest_and_member_bp.route("/conference_members", methods=["GET"])
def conference_members():
    data = {
        "title": "Conference Technical and Editorial Member",
        "subtitle": "Committee Members List",
        "members": [
            {
                "name": "Associate Professor Ir Ts Dr Tan Chan Sin",
                "institution": "University Malaysia Perlis",
                "bio": None,
                "avatar": None
            },
            {
                "name": "Dr Ng Hui Chen",
                "institution": "Asia Pacific University of Technology & Innovation",
                "bio": None,
                "avatar": None
            },
            {
                "name": "Dr Lee Hoi Leong",
                "institution": "University Malaysia Perlis",
                "bio": None,
                "avatar": None
            },
            {
                "name": "Dr Tan Lee Ooi",
                "institution": "Penang Institute",
                "bio": None,
                "avatar": None
            },
            {
                "name": "Associate Professor Dr Toh Teong Chuan",
                "institution": "Universiti Tunku Abdul Rahman (UTAR)",
                "bio": None,
                "avatar": None
            },
            {
                "name": "Ts Dr Lee Chen Kang",
                "institution": "Universiti Tunku Abdul Rahman (UTAR)",
                "bio": None,
                "avatar": None
            },
            {
                "name": "Mr Goh Seng Tak Msc",
                "institution": "Md of Lloydtech, Head of AI of Trinitium",
                "bio": None,
                "avatar": None
            },
            {
                "name": "Assoc. Prof. Ts. Dr. Tan Chi Wee",
                "institution": "Tunku Abdul Rahman University of Management and Technology (TAR UMT)",
                "bio": None,
                "avatar": None
            }
        ]
    }
    return jsonify(data)


@guest_and_member_bp.route("/speakers", methods=["GET"])
def speakers():
    data = {
        "title": "主讲嘉宾",
        "subtitle": "我们荣幸邀请到以下杰出的佛教领袖和学者",
        "speakers": [
            {
                "name": "释慧光法师",
                "title": "国际佛教联合会会长",
                "bio": "致力于推动佛教现代化发展，在可持续发展领域有深入研究",
                "avatar": None
            },
            {
                "name": "陈明德教授",
                "title": "佛学研究院院长",
                "bio": "专注于佛教伦理与社会福祉研究，著有多部学术专著",
                "avatar": None
            },
            {
                "name": "释觉明法师",
                "title": "禅修中心导师",
                "bio": "推广正念禅修，致力于将佛教智慧应用于心理健康领域",
                "avatar": None
            },
            {
                "name": "林慧珊博士",
                "title": "环境伦理学专家",
                "bio": "研究佛教生态观与环境保护，倡导绿色佛教理念",
                "avatar": None
            },
            {
                "name": "释智慧法师",
                "title": "青年佛教协会主席",
                "bio": "致力于佛教青年培养，推动宗教间对话与和平建设",
                "avatar": None
            }
        ]
    }
    return jsonify(data)
