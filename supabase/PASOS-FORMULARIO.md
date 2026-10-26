# Arreglar errores 400 en solicitudes

## `null value in column "id"`

La tabla `solicitudes` tiene `id` bigint **sin** valor por defecto. Ejecuta [`fix-solicitudes-id.sql`](fix-solicitudes-id.sql) en SQL Editor.

## `schema "net" does not exist`

El formulario de la web **funciona**. Supabase rechaza el guardado porque falta la extensión **pg_net** (o hay un webhook/trigger roto en la tabla `solicitudes`).

## Solución 1 — Activar pg_net (recomendado)

1. [Supabase Dashboard](https://supabase.com/dashboard) → proyecto **vtwyqhxfuiwjvzgptecb**
2. Menú izquierdo: **Database** → **Extensions**
3. Busca **pg_net** (o "HTTP / Webhooks")
4. Pulsa **Enable** / **Activar**
5. Espera unos segundos y prueba el formulario de nuevo

## Solución 2 — SQL Editor

1. **SQL Editor** → **New query**
2. Copia y ejecuta todo el archivo `fix-formulario.sql` de esta carpeta
3. Debe terminar sin error rojo

## Solución 3 — Si sigue el 400: desactivar webhook

A veces se creó un **Database Webhook** al configurar notificaciones:

1. **Database** → **Webhooks** (o **Integrations** → **Database Webhooks**)
2. Busca uno asociado a la tabla `solicitudes`
3. **Delete** o desactívalo
4. Prueba el formulario otra vez

## Solución 4 — Quitar triggers rotos (último recurso)

Solo si no necesitas enviar emails automáticos al recibir solicitudes. En **SQL Editor**:

```sql
-- Ver qué triggers hay
select tgname, pg_get_triggerdef(oid) as definicion
from pg_trigger
where tgrelid = 'public.solicitudes'::regclass
  and not tgisinternal;

-- Sustituye NOMBRE_DEL_TRIGGER por el que salga arriba
-- drop trigger "NOMBRE_DEL_TRIGGER" on public.solicitudes;
```

## Cómo comprobar que ya funciona

- En el navegador: enviar el formulario → mensaje **¡Solicitud enviada!**
- En DevTools → Network: la petición `solicitudes` debe ser **201**, no 400
- En Supabase → **Table Editor** → `solicitudes`: debe aparecer la fila nueva
