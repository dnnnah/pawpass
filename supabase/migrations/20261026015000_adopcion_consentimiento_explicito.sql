-- Explicit adoption consent starts false for every existing pet. No existing
-- private photo, profile, contact, or emergency note is made public by this change.

-- Publication requires the explicit consent flag set by the authenticated RPC.

create or replace function private.cambiar_estado_adopcion(
  p_pet uuid,
  p_estado text,
  p_refugio uuid default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_estado text;
  v_puede_editar boolean := false;
begin
  perform private.usuario_verificado();

  if p_estado not in ('en_adopcion', 'en_casa') then
    raise exception 'Estado no permitido' using errcode = '22023';
  end if;

  select p.estado
  into v_estado
  from public.pets p
  where p.id = p_pet
  for update;

  if v_estado is null or v_estado in ('adoptado', 'rescatado', 'fallecido', 'perdido') then
    raise exception 'La mascota no está disponible para cambiar su publicación de adopción' using errcode = '22023';
  end if;

  if exists (
    select 1 from public.pet_lost_alerts a
    where a.pet_id = p_pet and a.ended_at is null
  ) then
    raise exception 'Una alerta de pérdida activa bloquea la publicación de adopción' using errcode = '22023';
  end if;

  if p_refugio is null then
    v_puede_editar := private.administra_mascota(p_pet);
    if p_estado = 'en_adopcion' and not exists (
      select 1
      from public.pet_ownerships o
      join auth.users u on u.id = o.user_id
      left join public.pet_contacts c on c.pet_id = o.pet_id
      where o.pet_id = p_pet
        and o.rol = 'administrador'
        and o.ended_at is null
        and (
          nullif(btrim(c.email), '') is not null
          or (nullif(btrim(u.email), '') is not null and u.email_confirmed_at is not null)
        )
    ) then
      raise exception 'Agrega un correo de entrega válido antes de publicar' using errcode = '22023';
    end if;
  else
    v_puede_editar := private.es_miembro_refugio(p_refugio, false)
      and exists (
        select 1
        from public.pet_shelters ps
        join public.shelters s on s.id = ps.shelter_id
        where ps.pet_id = p_pet
          and ps.shelter_id = p_refugio
          and ps.ended_at is null
          and s.publicado
          and nullif(btrim(s.email), '') is not null
      );
    if not v_puede_editar then
      raise exception 'El refugio debe ser responsable activo y tener correo de entrega' using errcode = '42501';
    end if;
  end if;

  if not v_puede_editar then
    raise exception 'No autorizado' using errcode = '42501';
  end if;

  if p_estado = 'en_adopcion' then
    if v_estado not in ('en_casa', 'en_adopcion') then
      raise exception 'Solo una mascota en casa puede publicarse en adopción' using errcode = '22023';
    end if;
    if not exists (
      select 1
      from public.pet_documents d
      join storage.objects o on o.bucket_id = d.bucket_id and o.name = d.object_path
      where d.pet_id = p_pet
        and d.bucket_id = 'pawpass-fotos'
        and d.categoria = 'foto'
        and d.tipo = 'imagen'
    ) then
      raise exception 'Sube una foto válida antes de publicar en adopción' using errcode = '22023';
    end if;
  elsif v_estado <> 'en_adopcion' then
    raise exception 'La mascota no tiene una publicación de adopción activa' using errcode = '22023';
  end if;

  update public.pets set estado = p_estado, adopcion_publicada = (p_estado = 'en_adopcion') where id = p_pet;
end
$function$;

revoke all on function private.cambiar_estado_adopcion(uuid, text, uuid) from public;
grant execute on function private.cambiar_estado_adopcion(uuid, text, uuid) to authenticated;
grant usage on schema private to authenticated;

create or replace function public.cambiar_estado_adopcion(
  p_pet uuid,
  p_estado text,
  p_refugio uuid default null
)
returns void
language sql
security invoker
set search_path = ''
as $function$
  select private.cambiar_estado_adopcion(p_pet, p_estado, p_refugio);
$function$;

revoke all on function public.cambiar_estado_adopcion(uuid, text, uuid) from public, anon;
grant execute on function public.cambiar_estado_adopcion(uuid, text, uuid) to authenticated;

-- Shelter members may preview only basic identity/status for pets actively
-- assigned to that shelter. This never grants access to the private carnet.
create or replace function private.listar_mascotas_refugio_adopcion(p_refugio uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $function$
declare
  v_result jsonb;
begin
  perform private.usuario_verificado();
  if not private.es_miembro_refugio(p_refugio, false) then
    raise exception 'No autorizado' using errcode = '42501';
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', p.id,
    'petId', coalesce(p.slug, p.codigo_publico),
    'publicCode', p.codigo_publico,
    'name', p.nombre,
    'species', case p.especie when 'perro' then 'Perro' else 'Gato' end,
    'status', p.estado
  ) order by p.nombre, p.id), '[]'::jsonb)
  into v_result
  from public.pet_shelters ps
  join public.pets p on p.id = ps.pet_id
  where ps.shelter_id = p_refugio
    and ps.ended_at is null
    and p.estado in ('en_casa', 'en_adopcion')
    and not exists (
      select 1 from public.pet_lost_alerts a
      where a.pet_id = p.id and a.ended_at is null
    );

  return v_result;
end
$function$;

revoke all on function private.listar_mascotas_refugio_adopcion(uuid) from public;
grant execute on function private.listar_mascotas_refugio_adopcion(uuid) to authenticated;

create or replace function public.listar_mascotas_refugio_adopcion(p_refugio uuid)
returns jsonb
language sql
security invoker
set search_path = ''
as $function$
  select private.listar_mascotas_refugio_adopcion(p_refugio);
$function$;

revoke all on function public.listar_mascotas_refugio_adopcion(uuid) from public, anon;
grant execute on function public.listar_mascotas_refugio_adopcion(uuid) to authenticated;

-- The adoption catalog exposes only a presentation allowlist and does not
-- consult the voluntary-profile flags in pet_privacy.
create or replace function private.listar_catalogo_publico(p_limite integer, p_offset integer)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $function$
  select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb)
  from (
    select
      coalesce(p.slug, p.codigo_publico) as "petId",
      p.codigo_publico as "codigoPublico",
      p.nombre,
      case p.especie when 'perro' then 'Perro' else 'Gato' end as especie,
      coalesce(p.raza, '') as raza,
      case p.genero when 'macho' then 'Macho' when 'hembra' then 'Hembra' else '' end as genero,
      case p.talla
        when 'miniatura' then 'Miniatura'
        when 'pequeno' then 'Pequeño'
        when 'mediano' then 'Mediano'
        when 'grande' then 'Grande'
        else ''
      end as talla,
      p.fecha_nacimiento as "fechaNacimiento",
      photo.object_path as "photoPath",
      p.verificado,
      coalesce(nullif(s.slug, ''), s.id::text) as "shelterId",
      s.nombre as "shelterNombre",
      coalesce(nullif(btrim(s.ubicacion), ''), nullif(btrim(c.zona_segura), ''), '') as zona
    from public.pets p
    left join public.pet_contacts c on c.pet_id = p.id
    left join lateral (
      select sh.id, sh.slug, sh.nombre, sh.ubicacion, sh.email
      from public.pet_shelters ps
      join public.shelters sh on sh.id = ps.shelter_id
      where ps.pet_id = p.id and ps.ended_at is null and sh.publicado
      order by ps.started_at desc, ps.id
      limit 1
    ) s on true
    join lateral (
      select d.object_path
      from public.pet_documents d
      join storage.objects o on o.bucket_id = d.bucket_id and o.name = d.object_path
      where d.pet_id = p.id
        and d.bucket_id = 'pawpass-fotos'
        and d.categoria = 'foto'
        and d.tipo = 'imagen'
      order by d.created_at asc, d.id asc
      limit 1
    ) photo on true
    where p.estado = 'en_adopcion' and p.adopcion_publicada
      and not exists (
        select 1 from public.pet_lost_alerts a
        where a.pet_id = p.id and a.ended_at is null
      )
      and (
        (s.nombre is not null and nullif(btrim(s.email), '') is not null)
        or (s.nombre is null and exists (
          select 1
          from public.pet_ownerships own
          join auth.users u on u.id = own.user_id
          left join public.pet_contacts contact on contact.pet_id = own.pet_id
          where own.pet_id = p.id
            and own.rol = 'administrador'
            and own.ended_at is null
            and (
              nullif(btrim(contact.email), '') is not null
              or (nullif(btrim(u.email), '') is not null and u.email_confirmed_at is not null)
            )
        ))
      )
    order by p.created_at desc, p.id
    limit least(greatest(coalesce(p_limite, 20), 1), 100)
    offset greatest(coalesce(p_offset, 0), 0)
  ) t;
$function$;

revoke all on function private.listar_catalogo_publico(integer, integer) from public;
grant execute on function private.listar_catalogo_publico(integer, integer) to anon, authenticated;

create or replace function public.listar_catalogo_publico(p_limite integer default 20, p_offset integer default 0)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $function$
  select private.listar_catalogo_publico(p_limite, p_offset);
$function$;

revoke all on function public.listar_catalogo_publico(integer, integer) from public;
grant execute on function public.listar_catalogo_publico(integer, integer) to anon, authenticated;

create or replace function public.obtener_mascota_adopcion_publica(p_codigo text)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $function$
  select items.card
  from jsonb_array_elements(private.listar_catalogo_publico(100, 0)) as items(card)
  where items.card ->> 'codigoPublico' = btrim(coalesce(p_codigo, ''))
     or items.card ->> 'petId' = btrim(coalesce(p_codigo, ''))
  limit 1;
$function$;

revoke all on function public.obtener_mascota_adopcion_publica(text) from public;
grant execute on function public.obtener_mascota_adopcion_publica(text) to anon, authenticated;

-- Public adoption permits signing only the primary photo and only while the
-- pet is in adoption. It does not enable the voluntary-profile policy.
create or replace function private.puede_leer_foto_adopcion(p_bucket text, p_path text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select p_bucket = 'pawpass-fotos' and exists (
    select 1
    from public.pet_documents d
    join public.pets p on p.id = d.pet_id
    where d.bucket_id = p_bucket
      and d.object_path = p_path
      and d.categoria = 'foto'
      and d.tipo = 'imagen'
      and p.estado = 'en_adopcion' and p.adopcion_publicada
      and not exists (
        select 1 from public.pet_lost_alerts a
        where a.pet_id = p.id and a.ended_at is null
      )
      and d.id = (
        select d0.id
        from public.pet_documents d0
        join storage.objects o0 on o0.bucket_id = d0.bucket_id and o0.name = d0.object_path
        where d0.pet_id = d.pet_id
          and d0.bucket_id = 'pawpass-fotos'
          and d0.categoria = 'foto'
          and d0.tipo = 'imagen'
        order by d0.created_at asc, d0.id asc
        limit 1
      )
  );
$function$;

revoke all on function private.puede_leer_foto_adopcion(text, text) from public;
grant usage on schema private to anon;
grant usage on schema private to service_role;
grant execute on function private.puede_leer_foto_adopcion(text, text) to anon, authenticated;

drop policy if exists pawpass_adoption_primary_photo_read on storage.objects;
create policy pawpass_adoption_primary_photo_read
  on storage.objects
  for select
  to anon, authenticated
  using (private.puede_leer_foto_adopcion(bucket_id, name));

-- Store only short-lived HMACs for abuse protection, never applicant data.
create table if not exists private.adoption_request_attempts (
  idempotency_hash text primary key check (idempotency_hash ~ '^[0-9a-f]{64}$'),
  requester_hash text not null check (requester_hash ~ '^[0-9a-f]{64}$'),
  pet_id uuid not null references public.pets(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists adoption_request_attempts_requester_created_idx
  on private.adoption_request_attempts(requester_hash, created_at desc);
create index if not exists adoption_request_attempts_pet_created_idx
  on private.adoption_request_attempts(pet_id, created_at desc);

alter table private.adoption_request_attempts enable row level security;
revoke all on table private.adoption_request_attempts from public, anon, authenticated, service_role;

create or replace function private.preparar_solicitud_adopcion_publica(
  p_pet uuid,
  p_requester_hash text,
  p_idempotency_hash text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_pet_name text;
  v_email text;
  v_shelter_name text;
  v_existing boolean;
  v_count integer;
begin
  if p_requester_hash !~ '^[0-9a-f]{64}$' or p_idempotency_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'Solicitud no válida' using errcode = '22023';
  end if;

  -- Serialize all requests from the same hashed origin so the hourly IP limit
  -- cannot be bypassed by simultaneous submissions for different pets.
  perform pg_advisory_xact_lock(hashtextextended(p_requester_hash, 0));

  select p.nombre,
    case when s.nombre is not null then s.email else coalesce(nullif(btrim(c.email), ''), u.email) end,
    s.nombre
  into v_pet_name, v_email, v_shelter_name
  from public.pets p
  left join public.pet_contacts c on c.pet_id = p.id
  left join lateral (
    select sh.email, sh.nombre
    from public.pet_shelters ps
    join public.shelters sh on sh.id = ps.shelter_id
    where ps.pet_id = p.id and ps.ended_at is null and sh.publicado
    order by ps.started_at desc, ps.id
    limit 1
  ) s on true
  left join lateral (
    select auth_user.email
    from public.pet_ownerships own
    join auth.users auth_user on auth_user.id = own.user_id
    where own.pet_id = p.id and own.rol = 'administrador' and own.ended_at is null
      and auth_user.email_confirmed_at is not null
    order by own.started_at desc, own.id
    limit 1
  ) u on true
  where p.id = p_pet
    and p.estado = 'en_adopcion' and p.adopcion_publicada
    and not exists (
      select 1 from public.pet_lost_alerts a
      where a.pet_id = p.id and a.ended_at is null
    )
    and exists (
      select 1 from public.pet_documents d
      join storage.objects o on o.bucket_id = d.bucket_id and o.name = d.object_path
      where d.pet_id = p.id and d.bucket_id = 'pawpass-fotos'
        and d.categoria = 'foto' and d.tipo = 'imagen'
    );

  if v_pet_name is null then
    raise exception 'La mascota ya no está disponible' using errcode = '22023';
  end if;

  if v_email is null or v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception 'El responsable no tiene correo de entrega válido' using errcode = '22023';
  end if;

  delete from private.adoption_request_attempts
  where created_at < now() - interval '24 hours';

  select exists (
    select 1 from private.adoption_request_attempts a
    where a.idempotency_hash = p_idempotency_hash
      and a.requester_hash = p_requester_hash
      and a.pet_id = p_pet
  ) into v_existing;

  if not v_existing then
    select count(*) into v_count
    from private.adoption_request_attempts a
    where a.requester_hash = p_requester_hash
      and a.pet_id = p_pet
      and a.created_at > now() - interval '30 minutes';
    if v_count >= 5 then
      raise exception 'Límite de solicitudes excedido' using errcode = 'P0001';
    end if;

    select count(*) into v_count
    from private.adoption_request_attempts a
    where a.requester_hash = p_requester_hash
      and a.created_at > now() - interval '1 hour';
    if v_count >= 20 then
      raise exception 'Límite de solicitudes excedido' using errcode = 'P0001';
    end if;

    insert into private.adoption_request_attempts(idempotency_hash, requester_hash, pet_id)
    values (p_idempotency_hash, p_requester_hash, p_pet);
  end if;

  return jsonb_build_object(
    'petName', v_pet_name,
    'recipientEmail', v_email,
    'shelterName', v_shelter_name,
    'idempotencyKey', p_idempotency_hash
  );
end
$function$;

revoke all on function private.preparar_solicitud_adopcion_publica(uuid, text, text) from public;
grant execute on function private.preparar_solicitud_adopcion_publica(uuid, text, text) to service_role;

create or replace function public.preparar_solicitud_adopcion_publica(
  p_pet uuid,
  p_requester_hash text,
  p_idempotency_hash text
)
returns jsonb
language sql
security invoker
set search_path = ''
as $function$
  select private.preparar_solicitud_adopcion_publica(p_pet, p_requester_hash, p_idempotency_hash);
$function$;

revoke all on function public.preparar_solicitud_adopcion_publica(uuid, text, text) from public, anon, authenticated;
grant execute on function public.preparar_solicitud_adopcion_publica(uuid, text, text) to service_role;
