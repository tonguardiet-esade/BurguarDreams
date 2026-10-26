#!/usr/bin/env python3
"""
Copia datos de data/burguar.db (SQLite) → PostgreSQL (Supabase).

Requisitos:
  pip install psycopg[binary]

Uso (desde public_html):
  set DATABASE_URL=postgresql://postgres.[ref]:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
  python scripts/migrate_sqlite_to_postgres.py

Ejecutar DESPUÉS de 001_initial_schema.sql en Supabase.
"""
from __future__ import annotations

import os
import sqlite3
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from api.db import DB_PATH  # noqa: E402
from api.env_config import load_env  # noqa: E402

load_env()

TABLES_IN_ORDER = [
    "users",
    "sessions",
    "rental_contracts",
    "utility_provisions",
    "utility_ledger",
    "utility_tenancy",
    "support_tickets",
    "support_ticket_comments",
]

BOOL_COLUMNS = {
    "rental_contracts": ("finished", "finished_last_six_months"),
    "utility_provisions": ("water", "electricity", "wifi"),
    "support_ticket_comments": ("is_internal",),
}

TIMESTAMP_COLUMNS = {
    "users": ("created_at", "updated_at", "last_login_at"),
    "sessions": ("created_at", "expires_at", "revoked_at"),
    "rental_contracts": ("updated_at",),
    "utility_provisions": ("updated_at",),
    "utility_ledger": ("updated_at",),
    "utility_tenancy": ("updated_at",),
    "support_tickets": ("created_at", "updated_at", "resolved_at"),
    "support_ticket_comments": ("created_at",),
}


def _coerce_row(table: str, row: dict) -> dict:
    out = dict(row)
    for col in BOOL_COLUMNS.get(table, ()):
        if col in out and out[col] is not None:
            out[col] = bool(int(out[col]))
    for col in TIMESTAMP_COLUMNS.get(table, ()):
        if col in out and out[col] == "":
            out[col] = None
    return out


def sqlite_tables(conn: sqlite3.Connection) -> set[str]:
    rows = conn.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
    ).fetchall()
    return {r[0] for r in rows}


def main() -> int:
    database_url = os.environ.get("DATABASE_URL", "").strip()
    if not database_url:
        print("ERROR: define DATABASE_URL (connection string de Supabase).", file=sys.stderr)
        return 1

    try:
        import psycopg
        from psycopg.rows import dict_row
    except ImportError:
        print("ERROR: pip install psycopg[binary]", file=sys.stderr)
        return 1

    if not DB_PATH.is_file():
        print(f"ERROR: no existe {DB_PATH}", file=sys.stderr)
        return 1

    src = sqlite3.connect(str(DB_PATH))
    src.row_factory = sqlite3.Row
    present = sqlite_tables(src)

    with psycopg.connect(database_url, row_factory=dict_row) as dst:
        with dst.transaction():
            for table in TABLES_IN_ORDER:
                if table not in present:
                    print(f"  skip {table} (no está en SQLite)")
                    continue
                rows = src.execute(f"SELECT * FROM {table}").fetchall()
                if not rows:
                    print(f"  {table}: 0 filas")
                    continue
                cols = rows[0].keys()
                placeholders = ", ".join(f"%({c})s" for c in cols)
                col_list = ", ".join(cols)
                sql = (
                    f"INSERT INTO {table} ({col_list}) VALUES ({placeholders}) "
                    f"ON CONFLICT DO NOTHING"
                )
                count = 0
                for row in rows:
                    payload = _coerce_row(table, dict(row))
                    with dst.cursor() as cur:
                        cur.execute(sql, payload)
                        count += cur.rowcount
                print(f"  {table}: {len(rows)} leídas, {count} insertadas (resto ya existían)")

    print("Migración terminada.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
