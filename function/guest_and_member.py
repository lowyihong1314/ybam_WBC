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


def kl_speaker_avatar(filename):
    return f"/static/images/speaker/kl/{filename}"


def kl_speaker_groups():
    return [
        {
            "key": "keynote",
            "title": "主题讲师",
            "date": "12月5日至6日",
            "subtitle": "新科技时代佛教教育转型与实践",
            "speakers": [
                {
                    "name": "惠敏法师",
                    "role": "法鼓文理学院前校长",
                    "bio": "国立台北艺术大学及法鼓文理学院名誉教授 · 东京大学文学博士 · 台北医学院药学系学士",
                    "topic": "主题演讲：AI时代的佛教教育转型与实践",
                    "avatar": kl_speaker_avatar("HuiMin.jpeg"),
                },
            ],
        },
        {
            "key": "sub1",
            "title": "副题（一）",
            "date": "12月5日",
            "subtitle": "终身学习与教育的可持续性",
            "speakers": [
                {
                    "name": "释法源法师",
                    "role": "云阳寺住持",
                    "bio": "世界佛教教育协会创办人 · 法鼓文理学院及僧伽大学讲师",
                    "avatar": kl_speaker_avatar("Fayuan.jpg"),
                },
                {
                    "name": "黄先炳博士",
                    "role": "拉曼大学佛教研究中心主任",
                    "bio": "彭亨佛教会总务 · 长期致力推动佛教教育与大专佛青培育",
                    "avatar": kl_speaker_avatar("WongSienBiang.jpeg"),
                },
                {
                    "name": "魏德东教授",
                    "role": "中国人民大学哲学院教授",
                    "bio": "国际佛学研究中心主任 · 美国哥伦比亚大学客座研究员",
                    "avatar": kl_speaker_avatar("WeiDedong.jpg"),
                },
            ],
        },
        {
            "key": "sub2",
            "title": "副题（二）",
            "date": "12月5日",
            "subtitle": "跨界融合与学佛的多元探索",
            "speakers": [
                {
                    "name": "释有灯法师",
                    "role": "马来亚大学教育心理学博士",
                    "bio": "东禅佛教学院教师 · 马大人间佛教研究中心研究员及顾问",
                    "avatar": kl_speaker_avatar("YouDeng.jpg"),
                },
                {
                    "name": "宓雄老师",
                    "role": "泰国国家教学佛教创研中心 CEO",
                    "bio": "香港网龙数学生命教育研究部 CEO",
                    "avatar": kl_speaker_avatar("MiXiong.jpg"),
                },
                {
                    "name": "林德明博士",
                    "role": "拉曼大学理学院院长",
                    "bio": "马来西亚有机电化学哲学博士 · 英国皇家化学学会会士",
                    "avatar": kl_speaker_avatar("LimTuckMeng.jpeg"),
                },
                {
                    "name": "曾毓林居士",
                    "role": "星洲日报副执行总编辑",
                    "bio": "策划与推动超过一千场文化、教育、医疗及社会关怀活动",
                    "avatar": kl_speaker_avatar("ChenYokeLim.jpeg"),
                },
            ],
        },
        {
            "key": "sub3",
            "title": "副题（三）",
            "date": "12月6日",
            "subtitle": "儿童生命教育的模式创新",
            "speakers": [
                {
                    "name": "纪洁芳教授",
                    "role": "生命教育与生死关怀专家",
                    "bio": "台湾彰化师范大学教授（退休）· 南华大学兼任教授 · 长期在香港、澳门及大陆培育生命教育种子教师",
                    "avatar": kl_speaker_avatar("ChiChiehFang.jpg"),
                },
                {
                    "name": "郭史光宏老师",
                    "role": "马来西亚儿童文学协会会长",
                    "bio": "怡保师范学院华文组讲师 · 第八届吴德芳杰出华文讲师奖得主",
                    "avatar": kl_speaker_avatar("KuekSerKuangHong.jpeg"),
                },
                {
                    "name": "王冰教授",
                    "role": "香港大学哲学博士",
                    "bio": "香港珠海学院佛学研究中心助理教授及副总监 · 晨曦青少年文教基金会暨文教中心发起人",
                    "avatar": kl_speaker_avatar("WangBing.jpg"),
                },
            ],
        },
        {
            "key": "sub4",
            "title": "副题（四）",
            "date": "12月6日",
            "subtitle": "算法时代的青年心理韧性与价值重建",
            "speakers": [
                {
                    "name": "释宗平法师",
                    "role": "马佛青宗教顾问",
                    "bio": "马六甲八蚌佛子舍住持",
                    "avatar": kl_speaker_avatar("ZongPing.jpg"),
                },
                {
                    "name": "杨蓓教授",
                    "role": "法鼓文理学院特聘副教授",
                    "bio": "美国田纳西州大学教育心理与辅导博士 · 第14届台湾心理治疗与心理卫生联合会终生成就奖得主",
                    "avatar": kl_speaker_avatar("YangPei.jpg"),
                },
                {
                    "name": "李志祥博士",
                    "role": "马来西亚国民大学辅导学博士",
                    "bio": "注册心理辅导师/督导师 · IN-全人心理创办人",
                    "avatar": kl_speaker_avatar("LeeCheeSiang.jpg"),
                },
            ],
        },
    ]


@guest_and_member_bp.route("/speakers", methods=["GET"])
def speakers():
    version = get_requested_version()
    if version == KL_DATA_VERSION:
        payload = empty_people_payload(
            "讲师资料",
            "Conference Speakers & Workshop Facilitator",
            "speakers",
            version,
        )
        payload["groups"] = kl_speaker_groups()
        return jsonify(versioned_payload(payload, version=version))

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
