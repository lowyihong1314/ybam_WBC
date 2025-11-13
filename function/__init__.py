# function/__init__.py
from flask import Flask, render_template,send_file
from flask_socketio import SocketIO, send
from function.wbc import wbc_bp
import os
from models import db
from password import sql_username,sql_password,secret_key

socketio = SocketIO()

def create_app():
    app = Flask(__name__)
    app.config['SECRET_KEY'] = secret_key
    app.config['SQLALCHEMY_DATABASE_URI'] = f'mysql+pymysql://{sql_username}:{sql_password}@127.0.0.1/YBAM'
    
    db.init_app(app)
    # 注册蓝图
    app.register_blueprint(wbc_bp, url_prefix='/wbc')

    # 注册普通路由
    @app.route('/')
    def index():
        file_path = os.path.join('static', 'templates', 'index.html')
        return send_file(file_path)
    
    @app.route('/favicon.ico')
    def icon():
        return send_file('static/images/logo/YBAM_logo.ico')

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

