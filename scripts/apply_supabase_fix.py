#!/usr/bin/env python3
"""Aplica supabase/fix-formulario.sql y comprueba el insert del formulario."""

from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SQL_FILE = ROOT / "supabase" / "fix-formulario.sql"
ENV_FILE = ROOT / ".env"


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


def test_insert(url: str, key: str) -> tuple[int, dict]:
    payload = json.dumps(
        {"nombre": "Test script", "telefono": "600000000", "mascotas": "No"}
    ).encode("utf-8")
    req = urllib.request.Request(
        f"{url.rstrip('/')}/rest/v1/solicitudes",
        data=payload,
        method="POST",
        headers={
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            return resp.status, {}
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        try:
            data = json.loads(body)
        except json.JSONDecodeError:
            data = {"message": body}
        return e.code, data


def run_sql_via_management_api(project_ref: str, token: str, sql: str) -> None:
    payload = json.dumps({"query": sql}).encode("utf-8")
    req = urllib.request.Request(
        f"https://api.supabase.com/v1/projects/{project_ref}/database/query",
        data=payload,
        method="POST",
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
    )
    with urllib.request.urlopen(req, timeout=120) as resp:
        result = json.loads(resp.read().decode("utf-8"))
    if isinstance(result, list) and result and "error" in str(result).lower():
        raise RuntimeError(result)


def main() -> int:
    env = load_env()
    url = env.get("SUPABASE_URL", "").strip()
    key = env.get("SUPABASE_KEY", "").strip()
    token = env.get("SUPABASE_ACCESS_TOKEN", "").strip()
    project_ref = env.get("SUPABASE_PROJECT_REF", "vtwyqhxfuiwjvzgptecb").strip()

    if not url or not key:
        print("Falta SUPABASE_URL o SUPABASE_KEY en .env", file=sys.stderr)
        return 1

    print("Comprobando insert antes del arreglo…")
    status, err = test_insert(url, key)
    print(f"  HTTP {status}", err.get("message", "OK") if err else "OK")

    if status in (200, 201, 204):
        print("El formulario ya funciona. No hace falta aplicar el SQL.")
        return 0

    id_fix = ROOT / "supabase" / "fix-solicitudes-id.sql"
    if "null value in column" in str(err.get("message", "")) and "id" in str(
        err.get("message", "")
    ):
        print()
        print("Causa: la columna id no tiene autoincremento.")
        print("Ejecuta en SQL Editor:")
        print(f"  https://supabase.com/dashboard/project/{project_ref}/sql/new")
        print(f"  Archivo: {id_fix.relative_to(ROOT)}")
        return 1

    if not token:
        print()
        print("Para aplicar el SQL automáticamente, añade a .env:")
        print("  SUPABASE_ACCESS_TOKEN=tu_token_personal")
        print("  (https://supabase.com/dashboard/account/tokens)")
        print()
        print("O ejecuta manualmente en SQL Editor:")
        print(f"  https://supabase.com/dashboard/project/{project_ref}/sql/new")
        print(f"  Archivo: {SQL_FILE.relative_to(ROOT)}")
        return 1

    sql = SQL_FILE.read_text(encoding="utf-8")
    print("Aplicando fix-formulario.sql vía API de Supabase…")
    run_sql_via_management_api(project_ref, token, sql)
    print("SQL aplicado.")

    print("Comprobando insert después del arreglo…")
    status, err = test_insert(url, key)
    print(f"  HTTP {status}", err.get("message", "OK") if err else "OK")
    if status not in (200, 201, 204):
        print("Sigue fallando:", err, file=sys.stderr)
        return 1

    print("Formulario corregido.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
