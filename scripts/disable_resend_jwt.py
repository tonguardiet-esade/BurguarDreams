#!/usr/bin/env python3
"""Desactiva verify_jwt en la Edge Function resend-email (arregla 401 con clave publishable)."""

from __future__ import annotations

import sys

from _supabase_mgmt import DEFAULT_PROJECT_REF, disable_verify_jwt, load_env

SLUG = "resend-email"


def main() -> int:
    env = load_env()
    token = env.get("SUPABASE_ACCESS_TOKEN", "").strip()
    project_ref = env.get("SUPABASE_PROJECT_REF", DEFAULT_PROJECT_REF).strip()

    if not token:
        print("Añade a .env tu token personal de Supabase:", file=sys.stderr)
        print("  SUPABASE_ACCESS_TOKEN=sbp_...", file=sys.stderr)
        print("  https://supabase.com/dashboard/account/tokens", file=sys.stderr)
        print(file=sys.stderr)
        print("Alternativa: python3 scripts/setup_resend_email.py", file=sys.stderr)
        print("O Dashboard → Edge Functions → resend-email → desactiva Verify JWT", file=sys.stderr)
        return 1

    print(f"Actualizando {SLUG}: verify_jwt=false…")
    disable_verify_jwt(project_ref, token, SLUG)
    print("Listo. Prueba el formulario: resend-email debe responder 200 (o 5xx si falta RESEND_API_KEY).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
