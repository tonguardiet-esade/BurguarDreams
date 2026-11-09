#!/usr/bin/env python3
"""Inicializa SQLite y crea/actualiza el usuario Burguardreams."""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from api.db import DB_PATH, init_db, seed_all_users  # noqa: E402


def main() -> None:
    path = init_db()
    users = seed_all_users()
    print(f"DB: {path}")
    for user in users:
        role = user.get("role", "user")
        prop = user.get("property_id") or "—"
        print(f"- {user['username']} [{role}] property={prop}")
    print("Admin: Burguardreams / BCNBurguar123++")
    print("Inquilinos: nombre completo / 1234")


if __name__ == "__main__":
    main()
