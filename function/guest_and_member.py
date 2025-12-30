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
        "title": "Keynote Speakers",
        "subtitle": "We are honoured to invite the following distinguished Buddhist leaders and scholars",
        "speakers": [
            {
                "name": "Venerable Hui Guang",
                "title": "President of the International Buddhist Federation",
                "bio": "Dedicated to promoting the modern development of Buddhism, with extensive research in sustainable development.",
                "avatar": None
            },
            {
                "name": "Professor Chan Ming Te",
                "title": "Director of the Institute of Buddhist Studies",
                "bio": "Specialises in Buddhist ethics and social welfare, and has authored multiple academic publications.",
                "avatar": None
            },
            {
                "name": "Venerable Jue Ming",
                "title": "Meditation Centre Instructor",
                "bio": "Promotes mindfulness meditation and applies Buddhist wisdom in the field of mental health.",
                "avatar": None
            },
            {
                "name": "Dr. Lim Hui Shan",
                "title": "Environmental Ethics Expert",
                "bio": "Studies Buddhist ecological perspectives and environmental protection, advocating the concept of Green Buddhism.",
                "avatar": None
            },
            {
                "name": "Venerable Zhi Hui",
                "title": "President of the Buddhist Youth Association",
                "bio": "Committed to nurturing Buddhist youth and promoting interfaith dialogue and peacebuilding.",
                "avatar": None
            }
        ]
    }
    return jsonify(data)

@guest_and_member_bp.route("/programme", methods=["GET"])
def programme():
    data = {
        "day1": {
            "title": "Day 1 - 14 March 2026",
            "items": [
                {"time": "9:00 AM – 10:00 AM", "title": "Opening Ceremony"},
                {"time": "10:00 AM – 10:45 AM", "title": "Keynote Speech", "highlight": True},
                {"time": "10:45 AM – 11:00 AM", "title": "Q&A Session"},
                {"time": "11:00 AM – 11:45 AM", "title": "Invited Speaker Talk"},
                {"time": "11:45 AM – 12:00 PM", "title": "Q&A Session"},
                {"time": "12:00 PM – 2:00 PM", "title": "Lunch & Networking", "type": "break"},
                {"time": "2:00 PM – 5:00 PM", "title": "Workshop 1 / Parallel Session with Paper Presentation", "highlight": True}
            ]
        },
        "day2": {
            "title": "Day 2 – 15 March 2026",
            "items": [
                {"time": "9:00 AM – 9:45 AM", "title": "Invited Speaker Talk"},
                {"time": "9:45 AM – 10:00 AM", "title": "Q&A Session"},
                {"time": "10:00 AM – 10:45 AM", "title": "Invited Speaker Talk"},
                {"time": "10:45 AM – 11:00 AM", "title": "Q&A Session"},
                {"time": "11:00 AM – 11:45 AM", "title": "Invited Speaker Talk"},
                {"time": "11:45 AM – 12:00 PM", "title": "Q&A Session"},
                {"time": "12:00 PM – 2:00 PM", "title": "Lunch & Networking", "type": "break"},
                {"time": "2:00 PM – 4:30 PM", "title": "Workshop 2", "highlight": True},
                {"time": "4:30 PM – 5:00 PM", "title": "Closing Ceremony"}
            ]
        }
    }

    return jsonify(data)
