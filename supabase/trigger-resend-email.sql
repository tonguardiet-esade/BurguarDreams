-- Email automático al insertar en solicitudes (sin CORS; funciona en local y GitHub Pages).
-- NO ejecutes este archivo tal cual: tiene placeholders {{SUPABASE_KEY}}.
-- Usa: python3 scripts/setup_resend_email.py
-- O pega en SQL Editor: supabase/PEGAR-AHORA.sql (claves ya sustituidas)

create extension if not exists pg_net with schema extensions;

create or replace function public.trigger_resend_email()
returns trigger
language plpgsql
security definer
set search_path = public, net
as $$
declare
  _headers jsonb;
  _body jsonb;
  _request_id bigint;
begin
  _body := jsonb_build_object(
    'nombre', NEW.nombre,
    'apellidos', NEW.apellidos,
    'telefono', NEW.telefono,
    'email', NEW.email,
    'fecha_nacimiento', NEW.fecha_nacimiento,
    'situacion_laboral', NEW.situacion_laboral,
    'ingresos_mensuales', NEW.ingresos_mensuales,
    'num_personas', NEW.num_personas,
    'mascotas', NEW.mascotas,
    'property_name', NEW.property_name
  );

  _headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'apikey', '{{SUPABASE_KEY}}',
    'Authorization', 'Bearer {{SUPABASE_ANON_KEY}}'
  );

  select net.http_post(
    url := 'https://vtwyqhxfuiwjvzgptecb.supabase.co/functions/v1/resend-email',
    headers := _headers,
    body := _body
  ) into _request_id;

  return NEW;
exception
  when others then
    raise warning 'resend-email (pg_net): %', SQLERRM;
    return NEW;
end;
$$;

drop trigger if exists on_solicitud_resend_email on public.solicitudes;

create trigger on_solicitud_resend_email
  after insert on public.solicitudes
  for each row
  execute function public.trigger_resend_email();
