# Error CORS / preflight 405 en `resend-email`

## Solución en Netlify (sin redesplegar Supabase)

En `_redirects` hay un proxy same-origin:

```
/api/resend-email  https://…supabase.co/functions/v1/resend-email  200
```

El formulario llama a `/api/resend-email` (mismo origen → sin CORS). Haz **deploy** en Netlify tras cambiar `_redirects` o `js/api/submit-form.js`.

---

## Solución alternativa: trigger SQL

El formulario ya **no llama** a `resend-email` desde el navegador. El correo lo envía un **trigger SQL** tras cada insert (`supabase/trigger-resend-email.sql`):

```bash
python3 scripts/apply_email_trigger.py
```

(Sin token en `.env`, el script imprime el SQL para el Dashboard → SQL Editor.)

---

## Si aún llamas desde el navegador

El formulario guarda en `solicitudes`, pero en **GitHub Pages** (u otro dominio) el navegador bloquea la llamada a la Edge Function:

- `Preflight response is not successful. Status code: 405`
- `Fetch API cannot load .../resend-email due to access control checks`

## Causa

Desde el navegador, antes del `POST` se envía un **OPTIONS** (preflight). La función desplegada debe responder `200` con cabeceras CORS. Si solo implementa `POST`, OPTIONS devuelve **405** y el correo no se envía.

En local con `curl` el POST funciona; en producción falla solo en el navegador.

## Solución — redesplegar con CORS

El código correcto está en [`supabase/functions/resend-email/index.ts`](functions/resend-email/index.ts) (maneja `OPTIONS` al inicio).

### 1. Instalar CLI (una vez)

```bash
brew install supabase/tap/supabase
```

### 2. Enlazar proyecto

```bash
cd /ruta/a/BurguarDreams
supabase login
supabase link --project-ref vtwyqhxfuiwjvzgptecb
```

### 3. Secretos (si aún no están)

```bash
supabase secrets set \
  RESEND_API_KEY=re_TU_API_KEY \
  NOTIFY_EMAIL=burguardreams@gmail.com \
  RESEND_FROM="Burguar Dreams <onboarding@resend.dev>"
```

### 4. Desplegar

```bash
supabase functions deploy resend-email --no-verify-jwt
```

`supabase/config.toml` ya define `verify_jwt = false`.

### 5. Comprobar preflight

```bash
curl -i -X OPTIONS "https://vtwyqhxfuiwjvzgptecb.supabase.co/functions/v1/resend-email" \
  -H "Origin: https://TU_USUARIO.github.io" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: authorization,apikey,content-type"
```

Debe ser **HTTP/2 200** (no 405) y cabeceras `access-control-allow-origin`.

### 6. Probar el formulario

En Network: `resend-email` → **200** y `{"ok":true}`.

## Alternativa sin CLI

Dashboard → **Edge Functions** → `resend-email` → Editor: pega el contenido de `index.ts` (y `_shared/cors.ts` si el editor no importa rutas, inline los `corsHeaders` al inicio) → **Deploy**.
