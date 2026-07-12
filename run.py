# run.py

import eventlet
eventlet.monkey_patch()

import os

from function import create_app, socketio
from models.schema_migration import apply_migrations

app = create_app()
with app.app_context():
    apply_migrations()

# 仅在直接运行 python run.py 时生效
if __name__ == '__main__':
    port = int(os.environ.get("PORT", "5018"))
    debug = os.environ.get("FLASK_DEBUG", "0") == "1"
    socketio.run(app, host='0.0.0.0', port=port, debug=debug)
