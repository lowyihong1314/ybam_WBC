import os

from sqlalchemy import event

from function.settings import load_environment


load_environment()

# 当前文件路径（例如 /app/routes/register.py）
current_file_path = os.path.abspath(__file__)

# 上一级目录（例如 /app）
flask_path = os.path.dirname(os.path.dirname(current_file_path))


def get_database_uri():
    uri = os.environ.get("DATABASE_URL") or os.environ.get("SQLALCHEMY_DATABASE_URI")
    if not uri:
        return "sqlite:///ybam.db"

    if uri.startswith("postgres://"):
        return uri.replace("postgres://", "postgresql+psycopg2://", 1)

    if uri.startswith("postgresql://"):
        return uri.replace("postgresql://", "postgresql+psycopg2://", 1)

    return uri


def get_sqlalchemy_engine_options(database_uri):
    if database_uri.startswith("sqlite"):
        return {"connect_args": {"check_same_thread": False}}

    return {
        "pool_pre_ping": True,
        "pool_recycle": int(os.environ.get("DB_POOL_RECYCLE", "1800")),
        "pool_size": int(os.environ.get("DB_POOL_SIZE", "3")),
        "max_overflow": int(os.environ.get("DB_MAX_OVERFLOW", "2")),
    }


def configure_sqlite_engine(engine):
    if not engine.url.drivername.startswith("sqlite"):
        return

    @event.listens_for(engine, "connect")
    def set_sqlite_pragmas(dbapi_connection, _connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA synchronous=NORMAL")
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()
