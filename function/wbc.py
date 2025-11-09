from flask import Blueprint, request, jsonify

wbc_bp = Blueprint("wbc", __name__)

# 用于暂存报名资料（仅测试用）
wbc_registrations = []

# GET：查看目前暂存的报名数据
@wbc_bp.route('/wbc_register', methods=["GET"])
def wbc_register_get():
    return jsonify({
        "count": len(wbc_registrations),
        "data": wbc_registrations
    })

# POST：接收报名资料并存入内存变量
@wbc_bp.route('/wbc_register', methods=["POST"])
def wbc_register_post():
    data = request.get_json()
    if not data:
        return jsonify({"success": False, "error": "缺少 JSON 数据"}), 400

    # 存入列表
    wbc_registrations.append(data)

    return jsonify({
        "success": True,
        "message": "报名资料已暂存",
        "current_count": len(wbc_registrations)
    })