#/function/guest_and_member.py
from flask import Blueprint, jsonify, request

from function.versioning import ACTIVE_DATA_VERSION, KL_DATA_VERSION, versioned_payload

guest_and_member_bp = Blueprint("guest_and_member", __name__)


def get_requested_version():
    version = (request.args.get("version") or ACTIVE_DATA_VERSION).strip()
    if version in {ACTIVE_DATA_VERSION, KL_DATA_VERSION}:
        return version
    return ACTIVE_DATA_VERSION


def empty_people_payload(title, subtitle, key, version):
    return {
        "title": title,
        "subtitle": subtitle,
        key: [],
        "version": version,
    }


def empty_programme_payload(version):
    return {
        "version": version,
        "day1": {"title": "", "items": []},
        "day2": {"title": "", "items": []},
    }


@guest_and_member_bp.route("/ping", methods=["GET"])
def ping():
    version = get_requested_version()
    return jsonify(versioned_payload({"message": "pong"}, version=version))


@guest_and_member_bp.route("/conference_members", methods=["GET"])
def conference_members():
    version = get_requested_version()
    if version == KL_DATA_VERSION:
        return jsonify(
            versioned_payload(
                empty_people_payload(
                    "Conference Technical and Editorial Member",
                    "Committee Members List",
                    "members",
                    version,
                ),
                version=version,
            )
        )

    data = {
        "title": "Conference Technical and Editorial Member",
        "subtitle": "Committee Members List",
        "version": version,
        "members": [
            {
                "name": "Associate Professor Ir Ts Dr Tan Chan Sin",
                "institution": "University Malaysia Perlis",
                "bio": None,
                "avatar": None,
            },
            {
                "name": "Dr Ng Hui Chen",
                "institution": "Asia Pacific University of Technology & Innovation",
                "bio": None,
                "avatar": None,
            },
            {
                "name": "Dr Lee Hoi Leong",
                "institution": "University Malaysia Perlis",
                "bio": None,
                "avatar": None,
            },
            {
                "name": "Dr Tan Lee Ooi",
                "institution": "Penang Institute",
                "bio": None,
                "avatar": None,
            },
            {
                "name": "Associate Professor Dr Toh Teong Chuan",
                "institution": "Universiti Tunku Abdul Rahman (UTAR)",
                "bio": None,
                "avatar": None,
            },
            {
                "name": "Ts Dr Lee Chen Kang",
                "institution": "Universiti Tunku Abdul Rahman (UTAR)",
                "bio": None,
                "avatar": None,
            },
            {
                "name": "Mr Goh Seng Tak Msc",
                "institution": "Md of Lloydtech, Head of AI of Trinitium",
                "bio": None,
                "avatar": None,
            },
            {
                "name": "Assoc. Prof. Ts. Dr. Tan Chi Wee",
                "institution": "Tunku Abdul Rahman University of Management and Technology (TAR UMT)",
                "bio": None,
                "avatar": None,
            },
        ],
    }
    return jsonify(versioned_payload(data, version=version))


@guest_and_member_bp.route("/speakers", methods=["GET"])
def speakers():
    version = get_requested_version()
    if version == KL_DATA_VERSION:
        return jsonify(
            versioned_payload(
                empty_people_payload(
                    "Speakers",
                    "Conference Speakers & Workshop Facilitator",
                    "speakers",
                    version,
                ),
                version=version,
            )
        )

    avatar_container_style = (
        "width:96px;"
        "height:96px;"
        "margin:0 auto 12px;"
        "display:flex;"
        "align-items:center;"
        "justify-content:center;"
        "overflow:hidden;"
        "border-radius:50%;"
        "background:#f2f2f2;"
    )

    avatar_img_style = (
        "width:100%;"
        "height:100%;"
        "object-fit:cover;"
        "object-position:center center;"
    )
    lower_face_img_style = (
        "width:100%;"
        "height:100%;"
        "object-fit:cover;"
        "object-position:center 5%;"
    )
    data = {
        "title": "Speakers",
        "subtitle": "Conference Speakers & Workshop Facilitator",
        "version": version,
        "speakers": [
            {
                "name": "Prof. Minseok Kim",
                "role": "Speaker",
                "country": "Korea",
                "university": "Korea Advanced Institute of Science and Technology",
                "topic": "Buddhism in the Digital Age: The Implementation of Artificial Intelligence and Virtual Reality",
                "time": "11:00 a.m. - 12:00 p.m.",
                "avatar": "/static/images/speaker/Prof_Minseok_Kim.jpeg",
                "avatar_container_style": avatar_container_style,
                "avatar_img_style": avatar_img_style,
            },
            {
                "name": "Prof. Asanga Thiakarante",
                "role": "Speaker",
                "country": "Sri Lanka",
                "university": "University of Kelaniya",
                "topic": "Whose knowledge and who is responsible? : Revisiting the concept of knowledge in the age of AI",
                "time": "9:00 a.m. - 10:00 a.m.",
                "avatar": "/static/images/speaker/Prof_Asanga.jpg",
                "avatar_container_style": avatar_container_style,
                "avatar_img_style": avatar_img_style,
            },
            {
                "name": "Prof. Soraj Hongladarom",
                "role": "Keynote Speaker",
                "country": "Thailand",
                "university": "Mahachulalongkornrajavidyalaya University",
                "topic": "Buddhism and AI: Ethical and Ontological Aspects",
                "time": "10:00 a.m. - 11:00 a.m.",
                "avatar": "/static/images/speaker/Soraj_Hongladarom.jpeg",
                "avatar_container_style": avatar_container_style,
                "avatar_img_style": avatar_img_style + "transform:scale(2);",
            },
            {
                "name": "Dr Janaka Low",
                "role": "Speaker",
                "country": "Malaysia",
                "university": "Vitrox College",
                "topic": "The Middle Way of AI Adoption: What Buddhist Organizations Can Learn From Industry",
                "time": "10:00 a.m. - 11:00 a.m.",
                "avatar": "/static/images/speaker/Dr_Janaka_Low.png",
                "avatar_container_style": avatar_container_style,
                "avatar_img_style": avatar_img_style,
            },
            {
                "name": "Ts Dr Saw Seow Hui",
                "role": "AR Workshop Speaker",
                "country": "Malaysia",
                "university": "Universiti Tunku Abdul Rahman",
                "topic": "Beyond the Screen: Creating Immersive Dharma Content with Augmented Reality",
                "time": "2:00 p.m. - 4:30 p.m.",
                "avatar": "/static/images/speaker/Ts_Dr_Saw_Seow_Hui.jpeg",
                "avatar_container_style": avatar_container_style + "transform:translateY(15px);",
                "avatar_img_style": lower_face_img_style,
            },
            {
                "name": "Bro. Teh Jia Shyan",
                "role": "Photo & Video workshop speaker",
                "country": "Malaysia",
                "university": "Founder of Storytelling.my - Creative Corporate Content Branding, Malaysia",
                "topic": "Dharma in the Digital Age: Crafting Buddhist Media with Generative AI",
                "time": "2:00 p.m. - 5.00 p.m.",
                "avatar": "/static/images/speaker/Bro _Teh.png",
                "avatar_container_style": avatar_container_style + "transform:translateY(15px);",
                "avatar_img_style": lower_face_img_style,
            },
        ],
    }
    return jsonify(versioned_payload(data, version=version))


@guest_and_member_bp.route("/programme", methods=["GET"])
def programme():
    version = get_requested_version()
    if version == KL_DATA_VERSION:
        return jsonify(versioned_payload(empty_programme_payload(version), version=version))

    data = {
        "version": version,
        "day1": {
            "title": "Day 1 - 14 March 2026",
            "items": [
                {"time": "9:00 AM – 10:00 AM", "title": "Opening Ceremony"},
                {"time": "10:00 AM – 10:45 AM", "title": "Keynote Speech", "highlight": True},
                {"time": "10:45 AM – 11:00 AM", "title": "Q&A Session"},
                {"time": "11:00 AM – 11:45 AM", "title": "Invited Speaker Talk"},
                {"time": "11:45 AM – 12:00 PM", "title": "Q&A Session"},
                {"time": "12:00 PM – 2:00 PM", "title": "Lunch & Networking", "type": "break"},
                {"time": "2:00 PM – 5:00 PM", "title": "Workshop 1 / Parallel Session with Paper Presentation", "highlight": True},
            ],
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
                {"time": "4:30 PM – 5:00 PM", "title": "Closing Ceremony"},
            ],
        },
    }

    return jsonify(versioned_payload(data, version=version))
