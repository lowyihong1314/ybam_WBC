from sqlalchemy import inspect, text

from models import db
from models.register_data import DEFAULT_DATA_VERSION


VERSIONED_TABLES = ("register_data", "payment_transaction")


def ensure_version_columns():
    with db.engine.begin() as connection:
        for table_name in VERSIONED_TABLES:
            inspector = inspect(connection)
            existing_columns = {column["name"] for column in inspector.get_columns(table_name)}

            if "version" not in existing_columns:
                connection.execute(
                    text(
                        f"ALTER TABLE {table_name} "
                        f"ADD COLUMN version VARCHAR(100) NOT NULL "
                        f"DEFAULT '{DEFAULT_DATA_VERSION}'"
                    )
                )

            connection.execute(
                text(
                    f"UPDATE {table_name} "
                    "SET version = :version "
                    "WHERE version IS NULL OR TRIM(version) = ''"
                ),
                {"version": DEFAULT_DATA_VERSION},
            )
