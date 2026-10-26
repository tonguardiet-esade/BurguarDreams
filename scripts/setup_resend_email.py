#!/usr/bin/env python3
"""
Configura el flujo de correo (resend-email + trigger pg_net).

Requiere en .env:
  SUPABASE_ACCESS_TOKEN=sbp_...  (https://supabase.com/dashboard/account/tokens)
  SUPABASE_KEY, SUPABASE_ANON_KEY (o en js/config.js)

Opcional:
  RESEND_API_KEY, NOTIFY_EMAIL, RESEND_FROM
"""

from __future__ import annotations

import json
import subprocess
import sys
import urllib.request
from pathlib import Path

from _supabase_mgmt import (
    DEFAULT_PROJECT_REF,
    ROOT,
    deploy_function,
    disable_verify_jwt,
    load_env,
    run_sql,
    set_secrets,
    validate_anon_key,
)

SQL_TEMPLATE = ROOT / "supabase" / "trigger-resend-email.sql"
READY_SQL = ROOT / "supabase" / ".trigger-ready.sql"
PEGAR_SQL = ROOT / "supabase" / "PEGAR-AHORA.sql"
FUNCTION_TS = ROOT / "supabase" / "functions" / "resend-email" / "index.ts"


def build_trigger_sql(pub: str, anon: str) -> str:
    validate_anon_key(anon)
    if not pub.startswith("sb_publishable_"):
        print("AVISO: SUPABASE_KEY no parece publishable (sb_publishable_...)", file=sys.stderr)
    return (
        SQL_TEMPLATE.read_text(encoding="utf-8")
        .replace("{{SUPABASE_KEY}}", pub.replace("'", "''"))
        .replace("{{SUPABASE_ANON_KEY}}", anon.replace("'", "''"))
    )


def test_edge_function(url: str, pub: str, anon: str) -> int:
    payload = json.dumps(
        {
            "nombre": "SetupTest",
            "telefono": "600000001",
            "property_name": "Verificación setup",
        }
    ).encode("utf-8")
    req = urllib.request.Request(
        f"{url.rstrip('/')}/functions/v1/resend-email",
        data=payload,
        method="POST",
        headers={
            "apikey": pub,
            "Authorization": f"Bearer {anon}",
            "Content-Type": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            body = resp.read().decode("utf-8")
            print(f"  Edge Function → HTTP {resp.status}: {body[:200]}")
            return resp.status
    except urllib.error.HTTPError as e:
        print(f"  Edge Function → HTTP {e.code}: {e.read().decode()[:300]}", file=sys.stderr)
        return e.code


def test_insert(url: str, key: str) -> int:
    payload = json.dumps(
        {"nombre": "TriggerTest", "telefono": "600000002", "mascotas": "No"}
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
        with urllib.request.urlopen(req, timeout=30) as resp:
            print(f"  INSERT solicitudes → HTTP {resp.status}")
            return resp.status
    except urllib.error.HTTPError as e:
        print(f"  INSERT solicitudes → HTTP {e.code}", file=sys.stderr)
        return e.code


def main() -> int:
    env = load_env()
    token = env.get("SUPABASE_ACCESS_TOKEN", "").strip()
    project_ref = env.get("SUPABASE_PROJECT_REF", DEFAULT_PROJECT_REF).strip()
    url = env.get("SUPABASE_URL", f"https://{project_ref}.supabase.co").strip()
    pub = env.get("SUPABASE_KEY", "").strip()
    anon = env.get("SUPABASE_ANON_KEY", "").strip()

    if not pub or not anon:
        print("Faltan SUPABASE_KEY y SUPABASE_ANON_KEY en .env o js/config.js", file=sys.stderr)
        return 1

    try:
        validate_anon_key(anon)
    except ValueError as e:
        print(e, file=sys.stderr)
        return 1

    sql = build_trigger_sql(pub, anon)
    READY_SQL.write_text(sql, encoding="utf-8")
    banner = (
        "-- =============================================================================\n"
        "-- PEGAR TODO EN SQL EDITOR Y RUN\n"
        f"-- https://supabase.com/dashboard/project/{project_ref}/sql/new\n"
        "-- Arregla 401 TU_eyJ_ano → JWT anon real\n"
        "-- =============================================================================\n\n"
    )
    PEGAR_SQL.write_text(banner + sql, encoding="utf-8")
    print(f"SQL generado: {PEGAR_SQL.relative_to(ROOT)}")

    if not token:
        print("\nSin SUPABASE_ACCESS_TOKEN no se puede aplicar en remoto.", file=sys.stderr)
        print("Añade a .env: SUPABASE_ACCESS_TOKEN=sbp_...", file=sys.stderr)
        print("https://supabase.com/dashboard/account/tokens\n", file=sys.stderr)
        print("Pega y ejecuta en SQL Editor:")
        print(f"  https://supabase.com/dashboard/project/{project_ref}/sql/new")
        print(f"  Archivo: {PEGAR_SQL.relative_to(ROOT)}\n")
        print("\nComprobación local de la Edge Function (anon JWT)…")
        code = test_edge_function(url, pub, anon)
        return 0 if code == 200 else 1

    print("1/4 Desactivando verify_jwt en resend-email…")
    disable_verify_jwt(project_ref, token)
    print("   OK")

    secrets: dict[str, str] = {}
    if env.get("RESEND_API_KEY"):
        secrets["RESEND_API_KEY"] = env["RESEND_API_KEY"]
    if env.get("NOTIFY_EMAIL"):
        secrets["NOTIFY_EMAIL"] = env["NOTIFY_EMAIL"]
    elif env.get("NOTIFY_TO"):
        secrets["NOTIFY_EMAIL"] = env["NOTIFY_TO"]
    if env.get("RESEND_FROM"):
        secrets["RESEND_FROM"] = env["RESEND_FROM"]
    elif env.get("FROM_EMAIL"):
        secrets["RESEND_FROM"] = env["FROM_EMAIL"]

    if secrets:
        print("2/4 Configurando secretos…")
        set_secrets(project_ref, token, secrets)
        print(f"   OK ({', '.join(secrets)})")
    else:
        print("2/4 Secretos: omitido (añade RESEND_API_KEY y NOTIFY_EMAIL a .env si hace falta)")

    if FUNCTION_TS.exists():
        print("3/4 Desplegando resend-email desde el repo…")
        deploy_function(project_ref, token, "resend-email", FUNCTION_TS, verify_jwt=False)
        print("   OK")
    else:
        print(f"3/4 Omitido: no existe {FUNCTION_TS}", file=sys.stderr)

    print("4/4 Aplicando trigger pg_net en solicitudes…")
    run_sql(project_ref, token, sql)
    print("   OK")

    print("\nComprobaciones…")
    ef = test_edge_function(url, pub, anon)
    ins = test_insert(url, pub)

    if ef == 200 and ins in (200, 201, 204):
        print("\nListo. Envía el formulario y revisa burguardreams@gmail.com.")
        return 0

    print("\nRevisa logs en Edge Functions si algo falló.", file=sys.stderr)
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
