#!/usr/bin/env python3
import argparse
import os
import sys
from pathlib import Path

from sqlalchemy import Boolean, DateTime, Float, Integer, create_engine, func, inspect, select, text

from models import db
import models.register_data  # noqa: F401


ROOT = Path(__file__).resolve().parent
TABLE_NAMES = {"register_data", "payment_transaction"}


def normalize_postgres_uri(uri):
    if not uri:
        return None
    if uri.startswith("postgres://"):
        return uri.replace("postgres://", "postgresql+psycopg2://", 1)
    if uri.startswith("postgresql://"):
        return uri.replace("postgresql://", "postgresql+psycopg2://", 1)
    return uri


def default_sqlite_path():
    for candidate in (ROOT / "instance" / "ybam.db", ROOT / "ybam.db"):
        if candidate.exists():
            return candidate
    return ROOT / "instance" / "ybam.db"


def parse_args():
    parser = argparse.ArgumentParser(
        description="Copy YBAM data from SQLite into PostgreSQL while preserving IDs."
    )
    parser.add_argument(
        "--source",
        default=os.environ.get("SOURCE_SQLITE_PATH") or str(default_sqlite_path()),
        help="SQLite database path. Defaults to instance/ybam.db, then ybam.db.",
    )
    parser.add_argument(
        "--target",
        default=os.environ.get("TARGET_DATABASE_URL") or os.environ.get("DATABASE_URL"),
        help="PostgreSQL SQLAlchemy URL. Defaults to TARGET_DATABASE_URL or DATABASE_URL.",
    )
    parser.add_argument(
        "--replace",
        action="store_true",
        help="Delete target table rows before importing. Without this, non-empty targets abort.",
    )
    return parser.parse_args()


def selected_tables():
    return [table for table in db.metadata.sorted_tables if table.name in TABLE_NAMES]


def assert_source_ready(source_path, source_engine, tables):
    if not source_path.exists():
        raise SystemExit(f"SQLite source not found: {source_path}")

    inspector = inspect(source_engine)
    missing = [table.name for table in tables if not inspector.has_table(table.name)]
    if missing:
        raise SystemExit(f"SQLite source is missing table(s): {', '.join(missing)}")


def assert_target_ready(target_uri):
    if not target_uri:
        raise SystemExit("Missing target PostgreSQL URL. Set DATABASE_URL or pass --target.")
    if not target_uri.startswith("postgresql"):
        raise SystemExit(
            "Target URL must be PostgreSQL, for example "
            "postgresql+psycopg2://user:pass@host/db"
        )


def target_has_rows(connection, tables):
    return any(
        connection.execute(select(func.count()).select_from(table)).scalar_one()
        for table in tables
    )


def reset_postgres_sequences(connection, tables):
    for table in tables:
        if "id" not in table.c:
            continue

        sequence_name = connection.execute(
            text("SELECT pg_get_serial_sequence(:table_name, 'id')"),
            {"table_name": table.name},
        ).scalar()
        if not sequence_name:
            continue

        max_id = connection.execute(select(func.max(table.c.id))).scalar() or 0
        if max_id:
            connection.execute(
                text("SELECT setval(CAST(:sequence_name AS regclass), :max_id, true)"),
                {"sequence_name": sequence_name, "max_id": max_id},
            )


def copy_table(source_connection, target_connection, table):
    source_columns = {
        column["name"] for column in inspect(source_connection).get_columns(table.name)
    }
    column_names = [column.name for column in table.columns if column.name in source_columns]
    rows = [
        clean_row(table, dict(row))
        for row in source_connection.execute(
            select(*(table.c[name] for name in column_names))
        ).mappings()
    ]
    rows = filter_orphan_transactions(source_connection, table, rows)

    if rows:
        target_connection.execute(table.insert(), rows)

    return len(rows)


def filter_orphan_transactions(source_connection, table, rows):
    if table.name != "payment_transaction":
        return rows

    register_ids = {
        row["id"]
        for row in source_connection.execute(
            text("SELECT id FROM register_data")
        ).mappings()
    }
    skipped = [
        row for row in rows
        if row.get("register_id") not in register_ids
    ]
    if skipped:
        print(
            f"payment_transaction: skipped {len(skipped)} orphan row(s) "
            "with missing register_data",
            file=sys.stderr,
        )

    return [
        row for row in rows
        if row.get("register_id") in register_ids
    ]


def clean_row(table, row):
    for column in table.columns:
        if column.name not in row:
            continue

        value = row[column.name]
        if value == "" and not is_text_column(column):
            row[column.name] = None
            continue

        if value is None:
            continue

        if isinstance(column.type, Boolean):
            row[column.name] = clean_bool(value)
        elif isinstance(column.type, Integer):
            row[column.name] = int(value)
        elif isinstance(column.type, Float):
            row[column.name] = float(value)
        elif isinstance(column.type, DateTime) and isinstance(value, str):
            row[column.name] = value.strip() or None

    return row


def is_text_column(column):
    return column.type.python_type is str


def clean_bool(value):
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float)):
        return bool(value)

    normalized = str(value).strip().lower()
    if normalized in {"1", "true", "yes", "y", "on"}:
        return True
    if normalized in {"0", "false", "no", "n", "off", ""}:
        return False

    return bool(value)


def main():
    args = parse_args()
    source_path = Path(args.source).expanduser().resolve()
    target_uri = normalize_postgres_uri(args.target)

    assert_target_ready(target_uri)

    source_engine = create_engine(f"sqlite:///{source_path}")
    target_engine = create_engine(target_uri, pool_pre_ping=True)
    tables = selected_tables()

    assert_source_ready(source_path, source_engine, tables)
    db.metadata.create_all(target_engine, tables=tables)

    with source_engine.connect() as source_connection:
        with target_engine.begin() as target_connection:
            if target_has_rows(target_connection, tables):
                if not args.replace:
                    raise SystemExit(
                        "Target database already has rows. Re-run with --replace "
                        "if you want to overwrite it."
                    )
                for table in reversed(tables):
                    target_connection.execute(table.delete())

            copied = {
                table.name: copy_table(source_connection, target_connection, table)
                for table in tables
            }
            reset_postgres_sequences(target_connection, tables)

    for table_name, count in copied.items():
        print(f"{table_name}: copied {count} row(s)")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"Migration failed: {exc}", file=sys.stderr)
        raise
