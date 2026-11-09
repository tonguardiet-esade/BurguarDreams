"""Carga sencilla de variables desde .env (sin dependencias extra)."""
from __future__ import annotations

import os
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ENV_PATH = ROOT / ".env"
_LOADED = False


def load_env(path: Path | None = None) -> None:
    global _LOADED
    env_file = path or ENV_PATH
    if not env_file.exists():
        _LOADED = True
        return

    for raw in env_file.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip().lstrip("\ufeff")
        value = value.strip().strip("'").strip('"')
        # El .env manda: permite actualizar URL vacía tras reinicios / ediciones.
        if key:
            os.environ[key] = value
    _LOADED = True


def env(key: str, default: str = "") -> str:
    if not _LOADED:
        load_env()
    return os.environ.get(key, default).strip()
