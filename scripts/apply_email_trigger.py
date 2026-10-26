#!/usr/bin/env python3
"""Aplica el trigger de email (pg_net → resend-email) leyendo claves de .env."""

from __future__ import annotations

import json
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ENV_FILE = ROOT / ".env"
CONFIG_JS = ROOT / "js" / "config.js"
SQL_TEMPLATE = ROOT / "supabase" / "trigger-resend-email.sql"
READY_SQL = ROOT / "supabase" / ".trigger-ready.sql"
PROJECT_REF = "vtwyqhxfuiwjvzgptecb"


def load_keys_from_config_js() -> dict[str, str]:
    import re

    if not CONFIG_JS.exists():
        return {}
    text = CONFIG_JS.read_text(encoding="utf-8")
    out: dict[str, str] = {}
    m = re.search(r'window\.SUPABASE_KEY\s*=\s*"([^"]+)"', text)
    if m:
        out["SUPABASE_KEY"] = m.group(1)
    m = re.search(r'window\.SUPABASE_ANON_KEY\s*=\s*"([^"]+)"', text)
    if m:
        out["SUPABASE_ANON_KEY"] = m.group(1)
    return out


def load_env() -> dict[str, str]:
    env: dict[str, str] = {}
    if not ENV_FILE.exists():
        return env
    for line in ENV_FILE.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        env[key.strip()] = value.strip().strip('"').strip("'")
    return env


def run_sql(token: str, sql: str) -> None:
    payload = json.dumps({"query": sql}).encode("utf-8")
    req = urllib.request.Request(
        f"https://api.supabase.com/v1/projects/{PROJECT_REF}/database/query",
        data=payload,
        method="POST",
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
    )
    with urllib.request.urlopen(req, timeout=120) as resp:
        raw = resp.read().decode("utf-8")
        if raw:
            result = json.loads(raw)
            if isinstance(result, list):
                for row in result:
                    if isinstance(row, dict) and row.get("error"):
                        raise RuntimeError(row)


def main() -> int:
    env = load_env()
    env.update({k: v for k, v in load_keys_from_config_js().items() if v})
    token = env.get("SUPABASE_ACCESS_TOKEN", "").strip()
    pub = env.get("SUPABASE_KEY", "").strip()
    anon = env.get("SUPABASE_ANON_KEY", "").strip()

    if not pub or not anon:
        print("Faltan SUPABASE_KEY y SUPABASE_ANON_KEY en .env o js/config.js", file=sys.stderr)
        print("Ejecuta: python3 scripts/generate_config.py", file=sys.stderr)
        return 1

    if not anon.startswith("eyJ") or "TU_" in anon or "{{" in anon:
        print("SUPABASE_ANON_KEY inválida (debe ser JWT eyJ..., no un placeholder).", file=sys.stderr)
        return 1

    if not SQL_TEMPLATE.exists():
        print(f"No existe {SQL_TEMPLATE}", file=sys.stderr)
        return 1

    sql = (
        SQL_TEMPLATE.read_text(encoding="utf-8")
        .replace("{{SUPABASE_KEY}}", pub.replace("'", "''"))
        .replace("{{SUPABASE_ANON_KEY}}", anon.replace("'", "''"))
    )

    READY_SQL.write_text(sql, encoding="utf-8")
    print(f"SQL listo: {READY_SQL}", file=sys.stderr)

    if not token:
        print("Sin SUPABASE_ACCESS_TOKEN: pega el SQL en Dashboard → SQL Editor:\n")
        print(sql)
        print(
            "\nToken: https://supabase.com/dashboard/account/tokens",
            file=sys.stderr,
        )
        return 1

    print("Aplicando trigger de email en solicitudes…")
    try:
        run_sql(token, sql)
    except urllib.error.HTTPError as e:
        print(e.read().decode("utf-8", errors="replace"), file=sys.stderr)
        return 1
    except RuntimeError as e:
        print(e, file=sys.stderr)
        return 1

    print("Listo. Envía el formulario: el correo sale del trigger (sin CORS en el navegador).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
