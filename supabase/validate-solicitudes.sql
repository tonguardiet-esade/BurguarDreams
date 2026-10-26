-- Validación servidor para public.solicitudes (ejecutar tras fix-urgente.sql)
-- SQL Editor → New query → pegar → Run

-- Política INSERT con comprobaciones básicas (sustituye with check (true))
drop policy if exists "anon_insert_solicitudes" on public.solicitudes;

create policy "anon_insert_solicitudes"
  on public.solicitudes
  for insert
  to anon, authenticated
  with check (
    char_length(trim(nombre)) between 2 and 120
    and char_length(trim(telefono)) between 6 and 30
    and telefono ~ '^[0-9+\s().-]+$'
    and (
      email is null
      or (
        char_length(trim(email)) between 5 and 254
        and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
      )
    )
    and (apellidos is null or char_length(trim(apellidos)) <= 120)
    and (property_name is null or char_length(trim(property_name)) <= 200)
    and (mascotas is null or char_length(trim(mascotas)) <= 10)
  );

-- Trigger adicional (defensa en profundidad)
create or replace function public.validate_solicitud_row()
returns trigger
language plpgsql
as $$
begin
  new.nombre := trim(new.nombre);
  new.telefono := trim(new.telefono);
  if new.email is not null then
    new.email := trim(new.email);
  end if;
  if char_length(new.nombre) < 2 then
    raise exception 'invalid nombre' using errcode = '22023';
  end if;
  if char_length(regexp_replace(new.telefono, '\D', '', 'g')) < 6 then
    raise exception 'invalid telefono' using errcode = '22023';
  end if;
  if new.email is not null and new.email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'invalid email' using errcode = '22023';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_validate_solicitud on public.solicitudes;
create trigger trg_validate_solicitud
  before insert on public.solicitudes
  for each row execute function public.validate_solicitud_row();

-- Rate limiting: configurar en Cloudflare o Edge Function si el volumen de spam aumenta.
