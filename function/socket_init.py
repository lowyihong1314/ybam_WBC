# function/socket_init.py
from flask_socketio import SocketIO

# 初始化 socketio，不绑定 app
socketio = SocketIO(
    cors_allowed_origins="*",
    async_mode="eventlet",
)
