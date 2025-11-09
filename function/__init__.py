# function/__init__.py
from flask import Flask, render_template
from flask_socketio import SocketIO, send
from function.wbc import wbc_bp

socketio = SocketIO()

def create_app():
    app = Flask(__name__)
    app.config['SECRET_KEY'] = 'secret!'

    # 注册蓝图
    app.register_blueprint(wbc_bp, url_prefix='/wbc')

    # 注册普通路由
    @app.route('/')
    def index():
        return render_template('index.html')

    @app.route('/register_data')
    def register_data():
        return render_template('register_data.html')

    # 注册 SocketIO 事件
    @socketio.on('message')
    def handle_message(msg):
        print(f"收到消息: {msg}")
        send(f"服务器收到: {msg}", broadcast=True)

    # 初始化 socketio
    socketio.init_app(app)

    return app
