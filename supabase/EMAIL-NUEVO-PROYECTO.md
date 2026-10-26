# Activar el correo en el proyecto nuevo (vtwyqhxfuiwjvzgptecb)

El formulario **guarda** en `solicitudes`, pero el email lo envía **otro sistema**:

1. Un **trigger** en Postgres (tras cada insert).
2. Llama a la Edge Function **`resend-email`**.
3. Esa función usa **Resend** (`RESEND_API_KEY`).

Si falta cualquiera de esos tres pasos, no llega ningún mail.

## Comprobación rápida

```bash
python3 scripts/check_email_setup.py
```

Si ves `Edge Function → HTTP 404`, sigue los pasos de abajo.

---

## Paso 1 — Desplegar la Edge Function

1. [Edge Functions](https://supabase.com/dashboard/project/vtwyqhxfuiwjvzgptecb/functions) → **Deploy a new function** → nombre: `resend-email`.
2. Copia el código de [`functions/resend-email/index.ts`](functions/resend-email/index.ts) en el editor → **Deploy**.
3. En la función, **desactiva** «Verify JWT» / «Enforce JWT Verification» (la web usa clave anon, no JWT de usuario).

O con CLI (en tu Mac, con Supabase CLI instalado y `supabase login`):

```bash
cd /ruta/a/BurguarDreams
supabase link --project-ref vtwyqhxfuiwjvzgptecb
supabase functions deploy resend-email --no-verify-jwt
```

O con token personal en `.env` (`SUPABASE_ACCESS_TOKEN=sbp_...`):

```bash
python3 scripts/setup_resend_email.py
```

---

## Paso 2 — Secretos de Resend

[Project Settings → Edge Functions → Secrets](https://supabase.com/dashboard/project/vtwyqhxfuiwjvzgptecb/settings/functions)

| Nombre | Ejemplo |
|--------|---------|
| `RESEND_API_KEY` | `re_...` (desde [resend.com](https://resend.com/api-keys)) |
| `NOTIFY_EMAIL` | `burguardreams@gmail.com` |
| `RESEND_FROM` | `Burguar Dreams <onboarding@resend.dev>` (o tu dominio verificado en Resend) |

Sin `RESEND_API_KEY` y `NOTIFY_EMAIL` la función responde **500** («Faltan secretos»).

---

## Paso 3 — Trigger SQL (pg_net)

1. [SQL Editor](https://supabase.com/dashboard/project/vtwyqhxfuiwjvzgptecb/sql/new)
2. Pega **todo** el archivo [`PEGAR-AHORA.sql`](PEGAR-AHORA.sql) del repo (claves ya van con tu proyecto) → **Run**.
3. En **Database → Extensions**, activa **pg_net** si el SQL lo pide.

> Si antes ejecutaste `fix-urgente.sql`, los triggers se borraron a propósito. Hay que volver a crear el de email con `PEGAR-AHORA.sql`.

---

## Alternativa: correo desde el navegador (sin trigger SQL)

Tras desplegar la función y los secretos (pasos 1–2), la web llama a `resend-email` al guardar. **No hace falta** `PEGAR-AHORA.sql` para probar.

Si más adelante añades el trigger, pon en `js/config.js`:

```js
window.EMAIL_VIA_TRIGGER_ONLY = true;
```

(así no se envían dos correos por solicitud).

---

## Paso 4 — Probar

```bash
python3 scripts/check_email_setup.py
```

Debe mostrar `Edge Function → HTTP 200` y `{"ok":true}`.

Envía el formulario en la web y revisa `burguardreams@gmail.com` (y spam).

**Logs:** [Edge Functions → resend-email → Logs](https://supabase.com/dashboard/project/vtwyqhxfuiwjvzgptecb/functions/resend-email/logs)

---

## Errores frecuentes

| Síntoma | Causa |
|---------|--------|
| 404 en `resend-email` | Función no desplegada (paso 1) |
| 401 | Verify JWT activado (desactívalo) |
| 500 «Faltan secretos» | Falta paso 2 |
| Guarda fila pero no mail | Falta trigger (paso 3) o pg_net desactivado |
| 502 | Clave Resend inválida o `RESEND_FROM` no verificado |
