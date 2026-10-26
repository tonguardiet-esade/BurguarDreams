#!/usr/bin/env bash
# Redespliega resend-email con CORS (arregla preflight 405 en GitHub Pages).
set -euo pipefail
cd "$(dirname "$0")/.."

PROJECT_REF="${SUPABASE_PROJECT_REF:-vtwyqhxfuiwjvzgptecb}"

if ! command -v supabase >/dev/null 2>&1; then
  if command -v npx >/dev/null 2>&1; then
    SUPABASE_CMD=(npx supabase@latest)
  else
    echo "Instala Supabase CLI: brew install supabase/tap/supabase" >&2
    exit 1
  fi
else
  SUPABASE_CMD=(supabase)
fi

if [ -z "${SUPABASE_ACCESS_TOKEN:-}" ] && ! "${SUPABASE_CMD[@]}" projects list >/dev/null 2>&1; then
  echo "Primero inicia sesión:" >&2
  echo "  ${SUPABASE_CMD[*]} login" >&2
  echo "O exporta SUPABASE_ACCESS_TOKEN=sbp_... en .env" >&2
  exit 1
fi

if [ ! -f supabase/.temp/project-ref ] && [ ! -f .supabase/linked ]; then
  echo "Enlazando proyecto ${PROJECT_REF}…"
  "${SUPABASE_CMD[@]}" link --project-ref "$PROJECT_REF"
fi

echo "Desplegando resend-email (verify_jwt=false, CORS OPTIONS)…"
"${SUPABASE_CMD[@]}" functions deploy resend-email --no-verify-jwt

echo ""
echo "Comprobando preflight OPTIONS…"
ORIGIN="${TEST_ORIGIN:-https://kaoutarelkouri.github.io}"
CODE=$(curl -s -o /dev/null -w "%{http_code}" -X OPTIONS \
  "https://${PROJECT_REF}.supabase.co/functions/v1/resend-email" \
  -H "Origin: ${ORIGIN}" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: authorization,apikey,content-type")
if [ "$CODE" = "200" ]; then
  echo "OK: OPTIONS → ${CODE}. Prueba el formulario en tu sitio."
else
  echo "AVISO: OPTIONS → ${CODE} (esperado 200). Revisa logs en el Dashboard." >&2
  exit 1
fi
