# function/socket_init.py
from flask_socketio import SocketIO

# 初始化 socketio，不绑定 app
socketio = SocketIO(
    cors_allowed_origins="*",
    async_mode="eventlet",
    message_queue="redis://127.0.0.1:6379/0",  # Redis 消息队列
)
