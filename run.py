# run.py

import eventlet
eventlet.monkey_patch()

from function import create_app, socketio
from models import db

app = create_app()
with app.app_context():
    db.create_all()

# 仅在直接运行 python run.py 时生效
if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5018 ,debug=True)

# deactivate

# sudo apt install python3-venv
# python3 -m venv venv
# source venv/bin/activate
# pip install -r requirements.txt
# sudo systemctl restart ybam.service

# git add .gitignore
# git add .
# git commit -m "更新:Payment Gateway 方面，和报名前端"
# git push -u origin main --force

# gunicorn -k eventlet -w 1 run:app --bind 0.0.0.0:5018

# 在服务器上路径 /home/YBAM/ 输入这个就可以替换代码了：
# rsync -avz \
#   --exclude='venv' \
#   --exclude='__pycache__' \
#   --exclude='.git' \
#   --exclude='instance' \
#   --exclude='uploads' \
#   --exclude='*.db' \
#   utba@utba.utbabuddha.com:/home/utba/flaskapp/YBAM/ \
#   .
