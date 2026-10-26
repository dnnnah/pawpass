-- Every extra field and file requires its existing per-field publication flag.
-- This migration deliberately does not modify obtener_ficha_publica or publish any pet.
-- Perfil público voluntario: los datos visibles se filtran en la base y en
-- el adaptador. Los archivos originales continúan en buckets privados.

create or replace function private.puede_leer_archivo_perfil_publico(p_bucket text, p_path text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select exists (
    select 1
    from public.pet_documents d
    join public.pet_privacy privacy on privacy.pet_id = d.pet_id and privacy.publicado
    where d.bucket_id = p_bucket
      and d.object_path = p_path
      and d.visible_publico
      and p_bucket in ('pawpass-fotos', 'pawpass-documentos')
  );
$function$;

revoke all on function private.puede_leer_archivo_perfil_publico(text, text) from public;
grant usage on schema private to anon;
grant execute on function private.puede_leer_archivo_perfil_publico(text, text) to anon, authenticated;

drop policy if exists pawpass_public_profile_file_read on storage.objects;
create policy pawpass_public_profile_file_read
  on storage.objects
  for select
  to anon, authenticated
  using (private.puede_leer_archivo_perfil_publico(bucket_id, name));

create or replace function private.obtener_perfil_publico(p_codigo text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $function$
  select jsonb_build_object(
    'publicCode', p.codigo_publico,
    'name', p.nombre,
    'species', case p.especie when 'perro' then 'Perro' else 'Gato' end,
    'status', p.estado,
    'breed', nullif(btrim(coalesce(p.raza, '')), ''),
    'birthDate', p.fecha_nacimiento,
    'gender', case p.genero when 'macho' then 'Macho' when 'hembra' then 'Hembra' else null end,
    'size', case p.talla when 'miniatura' then 'Miniatura' when 'pequeno' then 'Pequeño' when 'mediano' then 'Mediano' when 'grande' then 'Grande' else null end,
    'color', nullif(btrim(coalesce(p.color, '')), ''),
    'sterilized', p.esterilizado,
    'traits', coalesce(p.rasgos_distintivos, '{}'::text[]),
    'microchip', case when privacy.mostrar_microchip then nullif(btrim(coalesce(p.microchip, '')), '') else null end,
    'zone', case when privacy.mostrar_zona then coalesce(nullif(btrim(t.zona_segura), ''), nullif(btrim(t.zona_habitual), '')) else null end,
    'emergencyCareNote', case when privacy.mostrar_emergencia then nullif(btrim(coalesce(h.nota_cuidados_emergencia, '')), '') else null end,
    'contact', jsonb_build_object(
      'name', case when privacy.mostrar_nombre_contacto then nullif(btrim(coalesce(t.nombre_publico, '')), '') else null end,
      'phone', case when privacy.mostrar_telefono then t.telefono_principal else null end,
      'whatsapp', case when privacy.mostrar_whatsapp then t.whatsapp else null end,
      'secondaryPhone', case when privacy.mostrar_telefono_secundario then t.telefono_secundario else null end,
      'email', case when privacy.mostrar_email then t.email else null end,
      'whatsappMessage', case when privacy.mostrar_whatsapp then t.mensaje_whatsapp else null end
    ),
    'health', case when privacy.mostrar_salud then jsonb_build_object(
      'allergies', coalesce(h.alergias, '{}'::text[]),
      'conditions', coalesce(h.condiciones_medicas, '{}'::text[]),
      'medications', coalesce(h.medicamentos_actuales, '{}'::text[]),
      'diet', nullif(btrim(coalesce(h.dieta_especial, '')), ''),
      'behavior', nullif(btrim(coalesce(h.comportamiento, '')), '')
    ) else null end,
    'vaccines', coalesce((
      select jsonb_agg(jsonb_build_object(
        'visible', true,
        'name', v.nombre,
        'applicationDate', v.fecha_aplicacion,
        'nextDose', v.proxima_dosis
      ) order by v.fecha_aplicacion desc, v.id)
      from public.pet_vaccines v
      where v.pet_id = p.id and v.visible_publico
    ), '[]'::jsonb),
    'photoPath', primary_photo.object_path,
    'photos', coalesce((
      select jsonb_agg(jsonb_build_object('visible', true, 'path', d.object_path) order by d.created_at, d.id)
      from public.pet_documents d
      join storage.objects o on o.bucket_id = d.bucket_id and o.name = d.object_path
      where d.pet_id = p.id and d.bucket_id = 'pawpass-fotos' and d.categoria = 'foto'
        and d.tipo = 'imagen' and d.visible_publico
        and d.id is distinct from primary_photo.id
    ), '[]'::jsonb),
    'documents', coalesce((
      select jsonb_agg(jsonb_build_object(
        'visible', true,
        'name', d.nombre,
        'category', d.categoria,
        'type', d.tipo,
        'date', d.fecha,
        'description', d.descripcion,
        'bucket', d.bucket_id,
        'path', d.object_path
      ) order by d.created_at, d.id)
      from public.pet_documents d
      join storage.objects o on o.bucket_id = d.bucket_id and o.name = d.object_path
      where d.pet_id = p.id and d.visible_publico and d.categoria <> 'foto'
        and d.bucket_id in ('pawpass-fotos', 'pawpass-documentos')
    ), '[]'::jsonb)
  )
  from public.pets p
  join public.pet_privacy privacy on privacy.pet_id = p.id and privacy.publicado
  left join public.pet_contacts t on t.pet_id = p.id
  left join public.pet_health h on h.pet_id = p.id
  left join lateral (
    select d.id, d.object_path
    from public.pet_documents d
    join storage.objects o on o.bucket_id = d.bucket_id and o.name = d.object_path
    where d.pet_id = p.id and d.bucket_id = 'pawpass-fotos' and d.categoria = 'foto' and d.tipo = 'imagen'
      and d.visible_publico
    order by d.created_at, d.id
    limit 1
  ) primary_photo on true
  where p_codigo is not null
    and char_length(btrim(p_codigo)) between 1 and 100
    and (p.codigo_publico = btrim(p_codigo) or p.slug = btrim(p_codigo))
    and p.estado in ('en_casa', 'en_adopcion')
    and not exists (select 1 from public.pet_lost_alerts a where a.pet_id = p.id and a.ended_at is null)
  order by p.id
  limit 1;
$function$;

revoke all on function private.obtener_perfil_publico(text) from public;
grant execute on function private.obtener_perfil_publico(text) to anon, authenticated;

create or replace function public.obtener_perfil_publico(p_codigo text)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $function$
  select private.obtener_perfil_publico(p_codigo);
$function$;

revoke all on function public.obtener_perfil_publico(text) from public;
grant execute on function public.obtener_perfil_publico(text) to anon, authenticated;

create or replace function private.listar_perfiles_publicos(p_limite integer, p_offset integer)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $function$
  select coalesce(jsonb_agg(jsonb_build_object(
    'publicCode', profile."publicCode",
    'name', profile.name,
    'species', profile.species,
    'status', profile.status,
    'breed', profile.breed,
    'zone', profile.zone,
    'photoPath', profile."photoPath",
    'photoUrl', profile."photoUrl"
  ) order by profile.created_at desc), '[]'::jsonb)
  from (
    select
      p.codigo_publico as "publicCode",
      p.nombre as name,
      case p.especie when 'perro' then 'Perro' else 'Gato' end as species,
      p.estado as status,
      nullif(btrim(coalesce(p.raza, '')), '') as breed,
      case when privacy.mostrar_zona then coalesce(nullif(btrim(t.zona_segura), ''), nullif(btrim(t.zona_habitual), '')) else null end as zone,
      photo.object_path as "photoPath",
      null::text as "photoUrl",
      p.created_at
    from public.pets p
    join public.pet_privacy privacy on privacy.pet_id = p.id and privacy.publicado
    left join public.pet_contacts t on t.pet_id = p.id
    left join lateral (
      select d.object_path
      from public.pet_documents d
      join storage.objects o on o.bucket_id = d.bucket_id and o.name = d.object_path
      where d.pet_id = p.id and d.bucket_id = 'pawpass-fotos' and d.categoria = 'foto' and d.tipo = 'imagen'
        and d.visible_publico
      order by d.created_at, d.id
      limit 1
    ) photo on true
    where p.estado = 'en_casa'
      and not exists (select 1 from public.pet_lost_alerts a where a.pet_id = p.id and a.ended_at is null)
    order by p.created_at desc
    limit least(greatest(coalesce(p_limite, 50), 1), 100)
    offset greatest(coalesce(p_offset, 0), 0)
  ) profile;
$function$;

revoke all on function private.listar_perfiles_publicos(integer, integer) from public;
grant execute on function private.listar_perfiles_publicos(integer, integer) to anon, authenticated;

create or replace function public.listar_perfiles_publicos(p_limite integer default 50, p_offset integer default 0)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $function$
  select private.listar_perfiles_publicos(p_limite, p_offset);
$function$;

revoke all on function public.listar_perfiles_publicos(integer, integer) from public;
grant execute on function public.listar_perfiles_publicos(integer, integer) to anon, authenticated;

-- Lost-pet discovery delegates to the unchanged, already privacy-filtered QR
-- contract. It never exposes an unpublished pet or a new contact field.
create or replace function public.listar_mascotas_perdidas(p_limite integer default 50, p_offset integer default 0)
returns jsonb language sql stable security definer set search_path = ''
as $function$
  select coalesce(jsonb_agg(private.obtener_ficha_publica(t.codigo_publico)), '[]'::jsonb)
  from (
    select p.codigo_publico
    from public.pets p join public.pet_privacy v on v.pet_id = p.id
    where p.estado = 'perdido' and v.publicado
      and exists (select 1 from public.pet_lost_alerts a where a.pet_id = p.id and a.ended_at is null)
    order by p.updated_at desc, p.id
    limit least(greatest(coalesce(p_limite,50),1),100) offset greatest(coalesce(p_offset,0),0)
  ) t;
$function$;
revoke all on function public.listar_mascotas_perdidas(integer,integer) from public;
grant execute on function public.listar_mascotas_perdidas(integer,integer) to anon, authenticated;
