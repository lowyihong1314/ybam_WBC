# function/__init__.py
from flask import Flask, render_template,send_file
from flask_socketio import SocketIO, send
from function.wbc import wbc_bp
from function.guest_and_member import guest_and_member_bp
from function.payment_gateway import payment_gateway_bp
import os
from models import db
from password import sql_username,sql_password,secret_key
from function.socket_init import socketio

def create_app():
    app = Flask(__name__)
    app.config['SECRET_KEY'] = secret_key
    app.config['SQLALCHEMY_DATABASE_URI'] = f'mysql+pymysql://{sql_username}:{sql_password}@127.0.0.1/YBAM'
    
    db.init_app(app)
    # 注册蓝图
    app.register_blueprint(wbc_bp, url_prefix='/wbc')
    app.register_blueprint(guest_and_member_bp, url_prefix='/guest_and_member')
    app.register_blueprint(payment_gateway_bp, url_prefix='/payment_gateway')

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
        return send_file('static/templates/register_data.html')

    # 初始化 socketio
    socketio.init_app(app)
    import function.socket_event  


    return app

