# 📌 YBAM Conference Registration System

一个基于 Flask + Socket.IO + Eventlet + Gunicorn + Systemd 的线上报名系统，支持实时更新、文件上传、支付记录与后台管理界面。

## 🚀 Features

前端/后端完全分离

Socket.IO 实时推送新报名数据

支持 PDF 文件上传（投稿论文）

支持支付记录储存与查看

管理端支持搜索、分页、导出 CSV

Systemd 守护运行

Rsync 部署同步（自动忽略特定目录）

完整的虚拟环境隔离

## 📁 项目结构
YBAM/
 ├── function/
 ├── models/
 ├── static/
 │    ├── js/
 │    └── templates/
 ├── uploads/          ← 存储上传文件（不进 Git）
 ├── instance/         ← Flask instance 数据（也不进 Git）
 ├── venv/             ← 虚拟环境（不进 Git）
 ├── run.py
 ├── requirements.txt
 ├── README.md

## 🏗 安装依赖（本地）
sudo apt install python3-venv
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

## ▶ 本地运行开发者模式
source venv/bin/activate
python run.py

## 🚀 部署 — Gunicorn + Eventlet + Systemd
### 🔧 手动临时运行（测试）
gunicorn -k eventlet -w 1 run:app --bind 0.0.0.0:5018

### 🛠 生产环境 systemd 配置

文件：/etc/systemd/system/ybam.service

[Unit]
Description=YBAM Flask Application
After=network.target

[Service]
User=root
WorkingDirectory=/home/YBAM
ExecStart=/home/YBAM/venv/bin/gunicorn -k eventlet -w 1 run:app --bind 0.0.0.0:5018
Restart=always

[Install]
WantedBy=multi-user.target


启用并启动：

sudo systemctl daemon-reload
sudo systemctl enable ybam.service
sudo systemctl restart ybam.service


查看运行状态：

sudo systemctl status ybam.service

## 🔄 部署更新（Rsync）

在服务器 /home/YBAM/ 执行：

rsync -avz --delete \
  --exclude='venv' \
  --exclude='__pycache__' \
  --exclude='.git' \
  --exclude='instance' \
  --exclude='uploads' \
  --exclude='*.db' \
  utba@utba.utbabuddha.com:/home/utba/flaskapp/YBAM/ \
  .


## 🔁 更新后重启服务
sudo systemctl restart ybam.service

## 🧹 数据库（自动创建）

run.py 会在启动时自动执行：

with app.app_context():
    db.create_all()


不需要人工干预。

## 📡 Socket.IO 实时更新

前端会在后台管理界面中自动连接：

const socket = io("/");
socket.emit("join_room", { room: GLOBAL_ROOM });


后端推送新报名数据：

socketio.emit("register_update", item, to=room)


前端会即时收到并自动加到管理界面。

## 🔒 安全说明

instance/ 与 uploads/ 永远不要同步到服务器

venv 绝对不要上传

不要把密码、API key 放进 Git

使用 .gitignore 排除敏感文件

## ✔ 建议再新增：deploy.sh

你可以添加一个一键部署脚本：

#!/bin/bash

rsync -avz \
  --exclude='venv' \
  --exclude='__pycache__' \
  --exclude='.git' \
  --exclude='instance' \
  --exclude='uploads' \
  --exclude='*.db' \
  utba@utba.utbabuddha.com:/home/utba/flaskapp/YBAM/ \
  .

sudo systemctl restart ybam.service
echo "Deployment completed!"


执行：

chmod +x deploy.sh
./deploy.sh


git add .gitignore
git add .
git commit -m "更新"
git push -u origin main --force
