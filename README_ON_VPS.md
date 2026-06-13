# YBAM WBC VPS Deployment

这个项目是 Flask + Flask-SocketIO + Eventlet 后端，Vite/React 前端。Live server 使用 PostgreSQL；本地开发如果没有设置 `DATABASE_URL`，会 fallback 到 SQLite `instance/ybam.db`。

## 1. 准备 `.env`

在项目根目录建立 `.env`，不要 commit。可以从 `.env.example` 复制：

```bash
cp .env.example .env
```

需要设置的主要变量：

```env
SECRET_KEY="change-this"
WBC_PENANG_2026_TOKEN="backend-token-for-penang"
WBC_KL_2026_TOKEN="backend-token-for-kl"
BILLPLZ_API_KEY="billplz-api-key"
BILLPLZ_COLLECTION_ID="billplz-collection-id"
BILLPLZ_BASE_URL="https://www.billplz.com/api"
DATABASE_URL="postgresql+psycopg2://ybam_user:strong_password@127.0.0.1:5432/ybam_wbc"
PORT="5018"
FLASK_DEBUG="0"
```

代码已经不再读取 `password.py`。

## 2. Python 依赖

```bash
sudo apt install python3-venv
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

`requirements.txt` 已移除 `pandas`、`openpyxl`、`redis`、`pymysql`。Excel 导出现在由 Vite 前端在浏览器生成，后端不再生成 workbook。

## 3. PostgreSQL

Live server 需要在 `.env` 设置：

```env
DATABASE_URL="postgresql+psycopg2://ybam_user:strong_password@127.0.0.1:5432/ybam_wbc"
```

应用启动时会执行 `db.create_all()`，缺少的表会自动建立。

如果要从现有 SQLite 搬数据到 PostgreSQL：

```bash
source venv/bin/activate
python migrate_sqlite_to_postgres.py --source instance/ybam.db
```

如果 PostgreSQL 目标库已经有旧数据，并且确定要覆盖：

```bash
python migrate_sqlite_to_postgres.py --source instance/ybam.db --replace
```

上传文件仍在 `uploads/`，迁移数据库不会移动文件；因为脚本保留原 `id`，现有 `uploads/papers/<id>/`、`uploads/student_card/<id>/` 路径可以继续对应。

## 4. 前端 Build

VPS 不需要长期跑 Vite dev server。部署前只需要 build：

```bash
cd frontend
npm install
npm run build
cd ..
```

后端会优先服务 `frontend/dist`。不要部署或同步 `frontend/node_modules/`。

## 5. Gunicorn + Eventlet

临时测试：

```bash
gunicorn -k eventlet -w 1 run:app --bind 0.0.0.0:5018
```

Systemd：`/etc/systemd/system/ybam.service`

```ini
[Unit]
Description=YBAM WBC Flask Application
After=network.target postgresql.service

[Service]
User=www-data
WorkingDirectory=/home/YBAM_WBC
EnvironmentFile=/home/YBAM_WBC/.env
ExecStart=/home/YBAM_WBC/venv/bin/gunicorn -k eventlet -w 1 run:app --bind 127.0.0.1:5018
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

启用：

```bash
sudo systemctl daemon-reload
sudo systemctl enable ybam.service
sudo systemctl restart ybam.service
sudo systemctl status ybam.service
```

## 6. 低资源 VPS 注意事项

- Gunicorn 先保持 `-w 1`，这个报名系统流量下比较稳。
- 不要在 live server 跑 `npm run dev`。
- PostgreSQL 可以开在同一台机器，但要限制连接池；默认配置是 `pool_size=3`、`max_overflow=2`。
- `uploads/`、`instance/`、`.env` 不要进 Git。
- 更新代码后：重建前端、安装 Python 依赖、重启 systemd。
