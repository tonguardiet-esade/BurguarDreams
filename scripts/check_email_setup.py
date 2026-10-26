#!/usr/bin/env python3
"""Comprueba si el flujo de email (resend-email + trigger) está listo."""

from __future__ import annotations

import json
import sys
import urllib.error
import urllib.request

from _supabase_mgmt import DEFAULT_PROJECT_REF, ROOT, load_env

PEGAR = ROOT / "supabase" / "PEGAR-AHORA.sql"


def test_edge(url: str, pub: str, anon: str) -> tuple[int, str]:
    payload = json.dumps(
        {
            "nombre": "Diagnóstico",
            "telefono": "600000099",
            "property_name": "check_email_setup.py",
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
            return resp.status, resp.read().decode("utf-8")[:400]
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8", errors="replace")[:400]


def main() -> int:
    env = load_env()
    ref = env.get("SUPABASE_PROJECT_REF", DEFAULT_PROJECT_REF).strip()
    url = env.get("SUPABASE_URL", f"https://{ref}.supabase.co").strip()
    pub = env.get("SUPABASE_KEY", "").strip()
    anon = env.get("SUPABASE_ANON_KEY", pub).strip()

    if not url or not anon:
        print("Faltan SUPABASE_URL y claves en .env / js/config.js", file=sys.stderr)
        return 1

    print(f"Proyecto: {ref}")
    print(f"URL: {url}\n")

    code, body = test_edge(url, pub or anon, anon)
    print(f"Edge Function resend-email → HTTP {code}")
    print(f"  {body}\n")

    if code == 404:
        print("❌ La función no existe. Despliégala (ver supabase/EMAIL-NUEVO-PROYECTO.md paso 1).")
        return 1
    if code == 401:
        print("❌ JWT rechazado. Desactiva Verify JWT en la función.")
        print("   Ver supabase/RESEND-401.md")
        return 1
    if code == 500 and "secretos" in body.lower():
        print("❌ Faltan RESEND_API_KEY y NOTIFY_EMAIL en Edge Function → Secrets.")
        return 1
    if code == 502:
        print("❌ Resend rechazó el envío. Revisa RESEND_API_KEY y RESEND_FROM en Resend.")
        return 1
    if code != 200:
        print("❌ La función no respondió OK. Revisa logs en el Dashboard.")
        return 1

    print("✅ La Edge Function responde bien.")
    print()
    print("Si el formulario guarda pero no manda mail, falta el trigger SQL:")
    print(f"  https://supabase.com/dashboard/project/{ref}/sql/new")
    print(f"  Archivo: {PEGAR.relative_to(ROOT)}")
    print("  Guía: supabase/EMAIL-NUEVO-PROYECTO.md")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
