# run.py
from function import create_app, socketio

app = create_app()

# 仅在直接运行 python run.py 时生效
if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5017)


# python3 -m venv venv
# source venv/bin/activate
# pip install -r requirements.txt
# sudo systemctl start ybam.service
