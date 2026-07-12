from flask_migrate import stamp, upgrade
from sqlalchemy import inspect, text

from models import db
from models.register_data import DEFAULT_DATA_VERSION


VERSIONED_TABLES = ("register_data", "payment_transaction")


def apply_migrations():
    """Bring the database schema up to date without touching data.

    - Database already managed by Alembic: run pending migrations.
    - Legacy database (pre-Alembic): top up missing tables/columns the old
      additive way one last time, then stamp it as current so Alembic takes
      over from here.
    - Fresh database: build everything through the Alembic migrations.
    """
    inspector = inspect(db.engine)
    tables = set(inspector.get_table_names())

    if "alembic_version" in tables:
        upgrade()
        return

    if "register_data" in tables:
        db.create_all()
        ensure_version_columns()
        stamp()
        return

    upgrade()


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

        optional_columns = {
            "registration_group": "VARCHAR(50)",
            "gender": "VARCHAR(20)",
            "state_region": "VARCHAR(100)",
            "organization": "VARCHAR(200)",
            "project_name": "VARCHAR(255)",
            "helper_count": "INTEGER",
            "helper_names": "TEXT",
            "special_request": "TEXT",
            "accommodation_required": "BOOLEAN",
            "roommate_name": "VARCHAR(100)",
            "roommate_doc_no": "VARCHAR(50)",
            "payment_currency": "VARCHAR(10)",
            "participant_category": "VARCHAR(50)",
            "original_payment_amount": "FLOAT",
            "original_payment_currency": "VARCHAR(10)",
            "exchange_rate": "FLOAT",
            "exchange_rate_date": "VARCHAR(20)",
        }

        inspector = inspect(connection)
        existing_columns = {column["name"] for column in inspector.get_columns("register_data")}
        for column_name, column_type in optional_columns.items():
            if column_name not in existing_columns:
                connection.execute(
                    text(f"ALTER TABLE register_data ADD COLUMN {column_name} {column_type}")
                )
