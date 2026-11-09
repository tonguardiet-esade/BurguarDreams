"""SQLite o PostgreSQL (Supabase) según DATABASE_URL."""
from __future__ import annotations

import re
import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Any, Iterator, Literal

from .env_config import env, load_env

Backend = Literal["sqlite", "postgres"]

_PLACEHOLDER_RE = re.compile(r"\?")


def use_postgres() -> bool:
    load_env()
    return bool(env("DATABASE_URL"))


def prepare_sql(sql: str, backend: Backend) -> str:
    sql = sql.replace(" COLLATE NOCASE", "")
    if backend == "postgres":
        sql = _PLACEHOLDER_RE.sub("%s", sql)
    return sql


def row_scalar(row: Any) -> Any:
    if row is None:
        return None
    try:
        return row[0]
    except (KeyError, IndexError, TypeError):
        pass
    if hasattr(row, "keys"):
        keys = list(row.keys())
        if keys:
            return row[keys[0]]
    return row


class CursorProxy:
    def __init__(self, cursor: Any, backend: Backend) -> None:
        self._cursor = cursor
        self._backend = backend

    def fetchone(self) -> Any:
        return self._cursor.fetchone()

    def fetchall(self) -> list[Any]:
        return self._cursor.fetchall()


class DbConnection:
    def __init__(self, raw: Any, backend: Backend) -> None:
        self._raw = raw
        self._backend = backend

    @property
    def backend(self) -> Backend:
        return self._backend

    def execute(self, sql: str, params: tuple | list = ()) -> CursorProxy:
        sql = prepare_sql(sql, self._backend)
        if self._backend == "postgres":
            cur = self._raw.execute(sql, params)
            return CursorProxy(cur, self._backend)
        cur = self._raw.execute(sql, params)
        return CursorProxy(cur, self._backend)

    def executescript(self, script: str) -> None:
        if self._backend == "sqlite":
            self._raw.executescript(script)
            return
        # En Postgres el esquema viene de supabase/migrations/*.sql

    def commit(self) -> None:
        self._raw.commit()

    def close(self) -> None:
        self._raw.close()

    def __enter__(self) -> DbConnection:
        return self

    def __exit__(self, exc_type, exc, tb) -> None:
        self.close()


def connect_postgres() -> DbConnection:
    import psycopg
    from psycopg.rows import dict_row

    url = env("DATABASE_URL")
    raw = psycopg.connect(url, row_factory=dict_row, prepare_threshold=None)
    return DbConnection(raw, "postgres")


def connect_sqlite(path: Path) -> DbConnection:
    path.parent.mkdir(parents=True, exist_ok=True)
    raw = sqlite3.connect(str(path), check_same_thread=False)
    raw.row_factory = sqlite3.Row
    raw.execute("PRAGMA foreign_keys = ON")
    return DbConnection(raw, "sqlite")


def run_postgres_migration(root: Path) -> None:
    migration = root / "supabase" / "migrations" / "001_initial_schema.sql"
    if not migration.is_file():
        return
    with connect_postgres() as conn:
        conn._raw.execute(migration.read_text(encoding="utf-8"))
        conn.commit()
