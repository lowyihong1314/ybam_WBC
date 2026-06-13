# function/__init__.py
from flask import Flask, redirect, request, send_file, send_from_directory
from function.wbc import wbc_bp
from function.guest_and_member import guest_and_member_bp
from function.payment_gateway import payment_gateway_bp
import os
from models import db
from function.socket_init import socketio
from function.config import (
    configure_sqlite_engine,
    get_database_uri,
    get_sqlalchemy_engine_options,
)
from function.settings import SECRET_KEY
from function.versioning import VALID_VERSION_NAMES

def create_app():
    app = Flask(__name__)
    database_uri = get_database_uri()

    app.config['SECRET_KEY'] = SECRET_KEY
    app.config['SQLALCHEMY_DATABASE_URI'] = database_uri
    app.config['SQLALCHEMY_ENGINE_OPTIONS'] = get_sqlalchemy_engine_options(database_uri)
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['MAX_CONTENT_LENGTH'] = int(os.environ.get("MAX_CONTENT_LENGTH", 16 * 1024 * 1024))

    db.init_app(app)

    with app.app_context():
        configure_sqlite_engine(db.engine)

    # 注册蓝图
    app.register_blueprint(wbc_bp, url_prefix='/wbc')
    app.register_blueprint(guest_and_member_bp, url_prefix='/guest_and_member')
    app.register_blueprint(payment_gateway_bp, url_prefix='/payment_gateway')

    base_dir = os.path.dirname(os.path.dirname(__file__))
    frontend_dist = os.path.join(base_dir, 'frontend', 'dist')
    frontend_index = os.path.join(frontend_dist, 'index.html')

    def has_frontend_dist():
        return os.path.exists(frontend_index)

    def serve_frontend_index():
        if has_frontend_dist():
            return send_from_directory(frontend_dist, 'index.html')

        file_path = os.path.join('static', 'templates', 'index.html')
        return send_file(file_path)

    # 注册普通路由
    @app.route('/')
    def index():
        return serve_frontend_index()

    @app.route('/backend')
    @app.route('/backend/')
    def backend():
        if has_frontend_dist():
            return serve_frontend_index()

        return send_file('static/templates/register_data.html')

    @app.route('/register')
    @app.route('/register/')
    def register_frontend():
        if has_frontend_dist():
            return serve_frontend_index()

        return send_file('static/templates/register.html')

    @app.route('/assets/<path:filename>')
    def frontend_assets(filename):
        return send_from_directory(os.path.join(frontend_dist, 'assets'), filename)

    @app.route('/kl-assets/<path:filename>')
    def frontend_kl_assets(filename):
        return send_from_directory(os.path.join(frontend_dist, 'kl-assets'), filename)

    @app.route('/<version>')
    def version_site(version):
        if version in VALID_VERSION_NAMES:
            return serve_frontend_index()

        if has_frontend_dist():
            candidate = os.path.join(frontend_dist, version)
            if os.path.isfile(candidate):
                return send_from_directory(frontend_dist, version)

        file_path = os.path.join('static', 'templates', 'index.html')
        return send_file(file_path)

    @app.route('/<version>/register')
    @app.route('/<version>/register/')
    def version_register_site(version):
        if version in VALID_VERSION_NAMES and has_frontend_dist():
            return serve_frontend_index()

        return send_file('static/templates/register.html')

    @app.route('/favicon.ico')
    def icon():
        return send_file('static/images/logo/YBAM_logo.ico')

    @app.route('/register_data')
    def register_data():
        if has_frontend_dist():
            prefix = request.headers.get('X-Forwarded-Prefix', '').rstrip('/')
            return redirect(f'{prefix}/backend' if prefix else '/backend')

        return send_file('static/templates/register_data.html')

    # 初始化 socketio
    socketio.init_app(app)
    import function.socket_event  


    return app
