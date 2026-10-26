-- Arregla 401 UNAUTHORIZED_INVALID_JWT_FORMAT (reemplaza Authorization placeholder TU_eyJ_ano).
-- Ejecutar en SQL Editor: https://supabase.com/dashboard/project/vtwyqhxfuiwjvzgptecb/sql/new
-- Regenerar: python3 scripts/setup_resend_email.py

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
    'apikey', 'sb_publishable_XLX91DHrgXhALJUu6Vw6Gg_R74RtaEN',
    'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlzY2J3bmdvdGdia3l0bXpvZ29sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4NDU4NDcsImV4cCI6MjA5MjQyMTg0N30.LlcMGyk67971m0h6neH7crxAp5k0a0-IbOA7rCbW2H4'
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
