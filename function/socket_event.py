from function.socket_init import socketio
from flask_socketio import join_room, leave_room, emit
from password import MASTER_TOKEN
from flask import request

# -------- 事件注册 ---------

@socketio.on("connect")
def on_connect():
    print("客户端已连接")

@socketio.on("disconnect")
def on_disconnect():
    print("客户端已断开")

@socketio.on("join_room")
def join_room_event(data):
    room = data.get("room")

    if room != MASTER_TOKEN:
        print("非法房间加入 attempt:", room)
        return

    join_room(room)
    sid = request.sid

    print(f"客户端 {sid} 加入房间: {room}")

    # 广播到 MASTER_TOKEN room
    emit("room_joined", {
        "sid": sid,
        "msg": f"{sid} 加入了房间"
    }, room=MASTER_TOKEN)

@socketio.on("leave_room")
def handle_leave_room(data):
    room = data.get("room")
    if not room:
        return

    leave_room(room)
    print(f"客户端离开房间: {room}")

    socketio.emit("system", {"msg": f"你离开了房间 {room}"}, room=room)
