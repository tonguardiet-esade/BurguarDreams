# Error 401 en `resend-email`

El formulario guarda bien en `solicitudes`, pero la Edge Function devuelve **401 Unauthorized** (`UNAUTHORIZED_INVALID_JWT_FORMAT`).

## Causa

La función tiene **Verify JWT** activado y en `js/config.js` usas una clave **publishable** (`sb_publishable_...`). Esa clave **no es un JWT**; el gateway rechaza la petición antes de ejecutar tu código.

## Arreglo automático (recomendado)

```bash
# .env: SUPABASE_ACCESS_TOKEN=sbp_... (+ claves en .env o js/config.js)
python3 scripts/setup_resend_email.py
```

Sin token, pega y ejecuta **[`supabase/PEGAR-AHORA.sql`](PEGAR-AHORA.sql)** en el SQL Editor (sustituye el placeholder `TU_eyJ_ano` por el JWT anon real).

**No ejecutes** [`trigger-resend-email.sql`](trigger-resend-email.sql) sin `python3 scripts/setup_resend_email.py` — deja `{{SUPABASE_ANON_KEY}}` o texto tipo `TU_eyJ_ano` y provoca el 401.

## Solución A — Desactivar Verify JWT (recomendado con publishable)

**Dashboard**

1. [Edge Functions → `resend-email`](https://supabase.com/dashboard/project/vtwyqhxfuiwjvzgptecb/functions)
2. Desactiva **Enforce JWT Verification** / **Verify JWT**
3. Guarda / redespliega si te lo pide

**Script (con token personal)**

```bash
# .env: SUPABASE_ACCESS_TOKEN=sbp_...  (https://supabase.com/dashboard/account/tokens)
python3 scripts/disable_resend_jwt.py
```

**CLI**

```bash
supabase functions deploy resend-email --no-verify-jwt
```

El repo incluye `supabase/config.toml` con `verify_jwt = false` para futuros despliegues.

## Solución B — Clave anon (JWT) solo para el email

1. Dashboard → **Project Settings** → **API** → clave **anon** / **legacy** (`eyJ...`)
2. En `.env`:

   ```env
   SUPABASE_ANON_KEY=eyJ...
   ```

3. Regenera config y despliega:

   ```bash
   python3 scripts/generate_config.py
   ```

4. Commit y push de `js/config.js` si usas GitHub Pages

`SUPABASE_KEY` puede seguir siendo la publishable; `resend-email` usará `SUPABASE_ANON_KEY` en el header `Authorization`.

## Comprobar

Tras el cambio, envía el formulario. En Network, `resend-email` debe ser **200** (o 5xx si falta `RESEND_API_KEY` en la función), no 401.

## Error CORS / 405 en GitHub Pages

Si ves `Preflight response is not successful. Status code: 405`, la función no responde al OPTIONS del navegador. Redespliega con el código de [`supabase/functions/resend-email/`](functions/resend-email/) — guía: [`supabase/CORS-405.md`](CORS-405.md).
