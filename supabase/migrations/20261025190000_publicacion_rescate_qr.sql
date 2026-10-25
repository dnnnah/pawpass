-- QR básico accesible por código y modo público de rescate.

alter table public.pet_contacts
  add column if not exists medio_contacto_qr text;

update public.pet_contacts
set medio_contacto_qr = case
  when telefono_principal is not null and whatsapp is null and email is null then 'phone'
  when whatsapp is not null and telefono_principal is null and email is null then 'whatsapp'
  when email is not null and telefono_principal is null and whatsapp is null then 'email'
  else null
end
where medio_contacto_qr is null;

do $migration$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.pet_contacts'::regclass
      and conname = 'pet_contacts_medio_contacto_qr_check'
  ) then
    alter table public.pet_contacts
      add constraint pet_contacts_medio_contacto_qr_check
      check (
        medio_contacto_qr is null
        or (medio_contacto_qr = 'phone' and telefono_principal is not null)
        or (medio_contacto_qr = 'whatsapp' and whatsapp is not null)
        or (medio_contacto_qr = 'email' and email is not null)
      );
  end if;
end
$migration$;

create or replace function private.inferir_medio_contacto_qr()
returns trigger
language plpgsql
set search_path = ''
as $function$
begin
  if tg_op = 'INSERT' and new.medio_contacto_qr is null then
    new.medio_contacto_qr := case
      when new.telefono_principal is not null and new.whatsapp is null and new.email is null then 'phone'
      when new.whatsapp is not null and new.telefono_principal is null and new.email is null then 'whatsapp'
      when new.email is not null and new.telefono_principal is null and new.whatsapp is null then 'email'
      else null
    end;
  end if;
  return new;
end
$function$;

revoke all on function private.inferir_medio_contacto_qr() from public;

drop trigger if exists pet_contacts_inferir_medio_qr on public.pet_contacts;
create trigger pet_contacts_inferir_medio_qr
  before insert or update of telefono_principal, whatsapp, email, medio_contacto_qr
  on public.pet_contacts
  for each row execute function private.inferir_medio_contacto_qr();

-- Public QR access is restricted to the first photo of each pet. It never
-- grants anonymous reads to the documents bucket or to other private photos.
create or replace function private.puede_leer_foto_qr(p_bucket text, p_path text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select p_bucket = 'pawpass-fotos' and exists (
    select 1
    from public.pet_documents d
    where d.bucket_id = p_bucket
      and d.object_path = p_path
      and d.categoria = 'foto'
      and d.tipo = 'imagen'
      and d.id = (
        select d0.id
        from public.pet_documents d0
        where d0.pet_id = d.pet_id
          and d0.bucket_id = 'pawpass-fotos'
          and d0.categoria = 'foto'
          and d0.tipo = 'imagen'
        order by d0.created_at asc, d0.id asc
        limit 1
      )
  );
$function$;

revoke all on function private.puede_leer_foto_qr(text, text) from public;
-- This private schema is not part of the Data API exposed schemas. USAGE plus
-- EXECUTE below permits the Storage RLS policy to call only this allowlisted helper.
grant usage on schema private to anon;
grant execute on function private.puede_leer_foto_qr(text, text) to anon, authenticated;

drop policy if exists pawpass_qr_photo_read on storage.objects;
create policy pawpass_qr_photo_read
  on storage.objects
  for select
  to anon, authenticated
  using (private.puede_leer_foto_qr(bucket_id, name));

create or replace function private.obtener_ficha_publica(p_codigo text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $function$
  select jsonb_build_object(
    'publicCode', p.codigo_publico,
    'photoPath', photo.object_path,
    'name', p.nombre,
    'species', case p.especie when 'perro' then 'Perro' else 'Gato' end,
    'breed', nullif(btrim(coalesce(p.raza, '')), ''),
    'status', p.estado,
    'contactMethod', t.medio_contacto_qr,
    'zone', case
      when p.estado = 'perdido' and a.id is not null then a.zona
      else coalesce(nullif(btrim(t.zona_segura), ''), nullif(btrim(t.zona_habitual), ''))
    end,
    'emergencyCareNote', nullif(btrim(coalesce(h.nota_cuidados_emergencia, '')), ''),
    'vaccinationStatus', case
      when p.estado <> 'perdido' or a.id is null then null
      when vaccines.overdue then 'pendiente'
      when vaccines.total = 0 or vaccines.missing_next_dose then 'sin_informacion'
      else 'al_dia'
    end,
    'privacy', jsonb_build_object(
      'mostrarNombreContacto', coalesce(c.mostrar_nombre_contacto, false)
    ),
    'lost', case
      when p.estado = 'perdido' and a.id is not null then jsonb_build_object(
        'zona', a.zona,
        'fechaPerdida', a.fecha_perdida,
        'mensaje', a.mensaje,
        'instrucciones', coalesce(a.instrucciones, '{}'::text[])
      )
      else null
    end,
    'contact', case t.medio_contacto_qr
      when 'phone' then case when nullif(t.telefono_principal, '') is not null then jsonb_build_object(
        'name', case when coalesce(c.mostrar_nombre_contacto, false) then t.nombre_publico else null end,
        'phone', t.telefono_principal
      ) else null end
      when 'whatsapp' then case when nullif(t.whatsapp, '') is not null then jsonb_build_object(
        'name', case when coalesce(c.mostrar_nombre_contacto, false) then t.nombre_publico else null end,
        'whatsapp', t.whatsapp
      ) else null end
      when 'email' then case when nullif(t.email, '') is not null then jsonb_build_object(
        'name', case when coalesce(c.mostrar_nombre_contacto, false) then t.nombre_publico else null end,
        'email', t.email
      ) else null end
      else null
    end,
    'recentPhotos', '[]'::jsonb
  )
  from public.pets p
  left join public.pet_privacy c on c.pet_id = p.id
  left join public.pet_contacts t on t.pet_id = p.id
  left join public.pet_health h on h.pet_id = p.id
  left join public.pet_lost_alerts a on a.pet_id = p.id and a.ended_at is null
  left join lateral (
    select d.object_path
    from public.pet_documents d
    join storage.objects o on o.bucket_id = d.bucket_id and o.name = d.object_path
    where d.pet_id = p.id and d.bucket_id = 'pawpass-fotos' and d.categoria = 'foto' and d.tipo = 'imagen'
    order by d.created_at asc, d.id asc
    limit 1
  ) photo on true
  left join lateral (
    select
      count(*) as total,
      coalesce(bool_or(v.proxima_dosis < current_date), false) as overdue,
      coalesce(bool_or(v.proxima_dosis is null), false) as missing_next_dose
    from public.pet_vaccines v where v.pet_id = p.id
  ) vaccines on true
  where p_codigo is not null
    and char_length(btrim(p_codigo)) between 1 and 100
    and (p.codigo_publico = btrim(p_codigo) or p.slug = btrim(p_codigo))
  order by p.id
  limit 1;
$function$;

revoke all on function private.obtener_ficha_publica(text) from public;

create or replace function public.obtener_ficha_publica(p_codigo text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $function$
  select private.obtener_ficha_publica(p_codigo);
$function$;

revoke all on function public.obtener_ficha_publica(text) from public;
grant execute on function public.obtener_ficha_publica(text) to anon, authenticated;

create or replace function private.listar_mascotas_perdidas(p_limite integer, p_offset integer)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $function$
  select coalesce(jsonb_agg(private.obtener_ficha_publica(p.codigo_publico) order by p.created_at desc), '[]'::jsonb)
  from (
    select pet.codigo_publico, alert.created_at, pet.id
    from public.pets pet
    join public.pet_lost_alerts alert on alert.pet_id = pet.id and alert.ended_at is null
    where pet.estado = 'perdido'
    order by alert.created_at desc
    limit greatest(1, least(coalesce(p_limite, 50), 100))
    offset greatest(coalesce(p_offset, 0), 0)
  ) p
  join public.pet_lost_alerts a on a.pet_id = p.id and a.ended_at is null;
$function$;

revoke all on function private.listar_mascotas_perdidas(integer, integer) from public;
grant execute on function private.listar_mascotas_perdidas(integer, integer) to anon, authenticated;

create or replace function public.listar_mascotas_perdidas(p_limite integer default 50, p_offset integer default 0)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $function$
  select private.listar_mascotas_perdidas(p_limite, p_offset);
$function$;

revoke all on function public.listar_mascotas_perdidas(integer, integer) from public;
grant execute on function public.listar_mascotas_perdidas(integer, integer) to anon, authenticated;

create or replace function private.cambiar_estado_mascota(
  p_pet uuid, p_estado text, p_fecha date, p_zona text, p_mensaje text, p_recompensa numeric
)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_estado text;
begin
  perform private.usuario_verificado();
  select p.estado into v_estado from public.pets p where p.id = p_pet for update;
  if v_estado is null or not private.administra_mascota(p_pet) then
    raise exception 'No autorizado' using errcode = '42501';
  end if;
  if p_estado not in ('en_casa', 'perdido') then
    raise exception 'Estado no permitido' using errcode = '22023';
  end if;
  if v_estado in ('adoptado', 'rescatado', 'fallecido') then
    raise exception 'Una mascota con estado terminal no puede activar o cerrar una alerta' using errcode = '22023';
  end if;

  if p_estado = 'perdido' then
    if p_fecha is null or p_fecha > current_date then
      raise exception 'Fecha de pérdida no válida' using errcode = '22023';
    end if;
    if char_length(btrim(coalesce(p_zona, ''))) not between 1 and 200 then
      raise exception 'La zona de pérdida es obligatoria' using errcode = '22023';
    end if;
    if not exists (
      select 1 from public.pet_contacts t
      where t.pet_id = p_pet
        and ((t.medio_contacto_qr = 'phone' and nullif(t.telefono_principal, '') is not null)
          or (t.medio_contacto_qr = 'whatsapp' and nullif(t.whatsapp, '') is not null)
          or (t.medio_contacto_qr = 'email' and nullif(t.email, '') is not null))
    ) then
      raise exception 'El canal elegido para el QR debe tener un dato de contacto válido' using errcode = '22023';
    end if;
    if not exists (
      select 1
      from public.pet_documents d
      join storage.objects o on o.bucket_id = d.bucket_id and o.name = d.object_path
      where d.pet_id = p_pet and d.bucket_id = 'pawpass-fotos' and d.categoria = 'foto' and d.tipo = 'imagen'
    ) then
      raise exception 'Sube una foto válida antes de activar la alerta' using errcode = '22023';
    end if;
  end if;

  update public.pet_lost_alerts set ended_at = now() where pet_id = p_pet and ended_at is null;
  update public.pets set estado = p_estado where id = p_pet;
  if p_estado = 'perdido' then
    insert into public.pet_lost_alerts(pet_id, fecha_perdida, zona, mensaje, recompensa)
    values (p_pet, p_fecha, btrim(p_zona), nullif(btrim(coalesce(p_mensaje, '')), ''), p_recompensa);
  end if;
end
$function$;

revoke all on function private.cambiar_estado_mascota(uuid, text, date, text, text, numeric) from public;
grant execute on function private.cambiar_estado_mascota(uuid, text, date, text, text, numeric) to authenticated;
