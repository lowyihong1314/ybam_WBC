import os 

# 当前文件路径（例如 /app/routes/register.py）
current_file_path = os.path.abspath(__file__)

# 上一级目录（例如 /app）
flask_path = os.path.dirname(os.path.dirname(current_file_path))
