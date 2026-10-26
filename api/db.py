"""SQLite compartido para login (y futuro: contratos, recibos, propiedades…)."""
from __future__ import annotations

import sqlite3
import uuid
from datetime import datetime, timezone
from pathlib import Path

from .db_connection import (
    DbConnection,
    connect_postgres,
    connect_sqlite,
    run_postgres_migration,
    use_postgres,
)
from .passwords import hash_password

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data"
DB_PATH = DATA_DIR / "burguar.db"

SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE COLLATE NOCASE,
  email TEXT UNIQUE COLLATE NOCASE,
  display_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  property_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  expires_at TEXT,
  revoked_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
"""

# Inquilinos reales: usuario = nombre, contraseña = 1234
TENANT_SEEDS = [
    {
        "user_id": "user-tenant-emma-sara",
        "username": "Emma y Sara",
        "email": None,
        "display_name": "Emma y Sara",
        "password": "1234",
        "role": "user",
        "property_id": "prop-urgell",
    },
    {
        "user_id": "user-tenant-punit",
        "username": "Punit",
        "email": None,
        "display_name": "Punit",
        "password": "1234",
        "role": "user",
        "property_id": "prop-gran-via",
    },
    {
        "user_id": "user-tenant-ostap-arina",
        "username": "Ostap y Arina",
        "email": None,
        "display_name": "Ostap y Arina",
        "password": "1234",
        "role": "user",
        "property_id": "prop-can-bruixa",
    },
    {
        "user_id": "user-tenant-aida",
        "username": "Aida Abuzaid",
        "email": None,
        "display_name": "Aida Abuzaid",
        "password": "1234",
        "role": "user",
        "property_id": "prop-valencia",
    },
]

OBSOLETE_TENANT_IDS = (
    "user-tenant-lucia",
    "user-tenant-marc",
    "user-tenant-sofia",
    "user-tenant-pau",
)
OBSOLETE_TENANT_USERNAMES = (
    "Lucía Mendoza",
    "Marc Vidal",
    "Sofía Navarro",
    "Pau Serra",
)


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def connect(db_path: Path | None = None) -> DbConnection:
    from .env_config import load_env

    load_env()
    if use_postgres():
        return connect_postgres()
    path = db_path or DB_PATH
    return connect_sqlite(path)


def database_label() -> str:
    if use_postgres():
        return "postgresql (Supabase)"
    return str(DB_PATH)


def _migrate_users(conn: sqlite3.Connection) -> None:
    cols = {row[1] for row in conn.execute("PRAGMA table_info(users)").fetchall()}
    if "role" not in cols:
        conn.execute("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user'")
    if "property_id" not in cols:
        conn.execute("ALTER TABLE users ADD COLUMN property_id TEXT")
    if "last_login_at" not in cols:
        conn.execute("ALTER TABLE users ADD COLUMN last_login_at TEXT")


def _migrate_email_nullable(conn: sqlite3.Connection) -> None:
    info = conn.execute("PRAGMA table_info(users)").fetchall()
    email_notnull = False
    for row in info:
        if row[1] == "email" and int(row[3]) == 1:
            email_notnull = True
            break
    if not email_notnull:
        return
    conn.execute("PRAGMA foreign_keys=OFF")
    conn.executescript(
        """
        CREATE TABLE users_new (
          id TEXT PRIMARY KEY,
          username TEXT NOT NULL UNIQUE COLLATE NOCASE,
          email TEXT UNIQUE COLLATE NOCASE,
          display_name TEXT NOT NULL,
          password_hash TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'user',
          property_id TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          last_login_at TEXT
        );
        INSERT INTO users_new (
          id, username, email, display_name, password_hash, role, property_id,
          created_at, updated_at, last_login_at
        )
        SELECT
          id, username,
          CASE
            WHEN id = 'user-burguar-001' THEN 'burguardreams@gmail.com'
            WHEN role = 'user' THEN NULL
            WHEN id = 'user-superadmin-001' THEN NULL
            WHEN trim(COALESCE(email, '')) = '' THEN NULL
            ELSE email
          END,
          display_name, password_hash, role, property_id,
          created_at, updated_at, last_login_at
        FROM users;
        DROP TABLE users;
        ALTER TABLE users_new RENAME TO users;
        """
    )
    conn.execute("PRAGMA foreign_keys=ON")


def init_db(db_path: Path | None = None) -> Path:
    if use_postgres() and db_path is None:
        run_postgres_migration(ROOT)
        return DB_PATH
    path = db_path or DB_PATH
    with connect(path) as conn:
        conn.executescript(SCHEMA)
        _migrate_users(conn._raw)
        _migrate_email_nullable(conn._raw)
        conn.commit()
    return path


def ensure_user(
    *,
    username: str,
    password: str,
    email: str | None,
    display_name: str,
    role: str = "user",
    property_id: str | None = None,
    user_id: str | None = None,
    db_path: Path | None = None,
) -> dict:
    """Crea el usuario si no existe; si existe, actualiza hash, rol e inmueble."""
    init_db(db_path)
    now = utc_now_iso()
    if role not in ("admin", "superadmin", "user"):
        role = "user"
    uid_seed = user_id or ""
    sync_email = uid_seed == "user-burguar-001"
    seed_email = (email or "").strip() or None
    with connect(db_path) as conn:
        row = conn.execute(
            "SELECT id FROM users WHERE username = ? COLLATE NOCASE",
            (username,),
        ).fetchone()
        password_hash = hash_password(password)
        if row:
            uid = row["id"]
            if sync_email:
                conn.execute(
                    """
                    UPDATE users
                    SET password_hash = ?, email = ?, display_name = ?,
                        role = ?, property_id = ?, updated_at = ?
                    WHERE id = ?
                    """,
                    (
                        password_hash,
                        seed_email,
                        display_name,
                        role,
                        property_id,
                        now,
                        uid,
                    ),
                )
            else:
                conn.execute(
                    """
                    UPDATE users
                    SET password_hash = ?, display_name = ?,
                        role = ?, property_id = ?, updated_at = ?
                    WHERE id = ?
                    """,
                    (password_hash, display_name, role, property_id, now, uid),
                )
        else:
            uid = user_id or str(uuid.uuid4())
            conn.execute(
                """
                INSERT INTO users (
                  id, username, email, display_name, password_hash,
                  role, property_id, created_at, updated_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    uid,
                    username,
                    seed_email,
                    display_name,
                    password_hash,
                    role,
                    property_id,
                    now,
                    now,
                ),
            )
        conn.commit()
        return {
            "id": uid,
            "username": username,
            "email": seed_email,
            "display_name": display_name,
            "role": role,
            "property_id": property_id,
        }


def seed_default_user(db_path: Path | None = None) -> dict:
    return ensure_user(
        username="Burguardreams",
        password="BCNBurguar123++",
        email="burguardreams@gmail.com",
        display_name="Burguar Dreams",
        role="admin",
        property_id=None,
        user_id="user-burguar-001",
        db_path=db_path,
    )


def seed_superadmin_user(db_path: Path | None = None) -> dict:
    return ensure_user(
        username="Superadmin",
        password="BCNBurguar123++",
        email=None,
        display_name="Superadmin",
        role="superadmin",
        property_id=None,
        user_id="user-superadmin-001",
        db_path=db_path,
    )


def seed_tenant_users(db_path: Path | None = None) -> list[dict]:
    return [ensure_user(**tenant, db_path=db_path) for tenant in TENANT_SEEDS]


def _remove_obsolete_tenants(db_path: Path | None = None) -> None:
    init_db(db_path)
    with connect(db_path) as conn:
        for uid in OBSOLETE_TENANT_IDS:
            conn.execute("DELETE FROM users WHERE id = ? AND role = 'user'", (uid,))
        for username in OBSOLETE_TENANT_USERNAMES:
            conn.execute(
                "DELETE FROM users WHERE username = ? COLLATE NOCASE AND role = 'user'",
                (username,),
            )
        conn.commit()


def seed_all_users(db_path: Path | None = None) -> list[dict]:
    admin = seed_default_user(db_path)
    superadmin = seed_superadmin_user(db_path)
    tenants = seed_tenant_users(db_path)
    _remove_obsolete_tenants(db_path)
    with connect(db_path) as conn:
        now = utc_now_iso()
        conn.execute(
            "UPDATE users SET email = ?, updated_at = ? WHERE id = ?",
            ("burguardreams@gmail.com", now, "user-burguar-001"),
        )
        conn.commit()
    return [admin, superadmin, *tenants]
