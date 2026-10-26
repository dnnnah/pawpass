-- Lost alerts are part of the rescue channel even when a family has not
-- published its voluntary profile. Files still need both the section switch
-- and each record's individual consent.
do $migration$
declare
  had_section_switch boolean;
begin
  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'pet_privacy' and column_name = 'mostrar_archivos'
  ) into had_section_switch;
  alter table public.pet_privacy add column if not exists mostrar_archivos boolean not null default false;

  -- Preserve files owners had already selected before this section switch
  -- existed. The individual visible_publico flag remains authoritative.
  if not had_section_switch then
    update public.pet_privacy privacy
    set mostrar_archivos = true
    where exists (
      select 1 from public.pet_documents d
      where d.pet_id = privacy.pet_id and d.visible_publico
    );
  end if;
end
$migration$;

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
    join public.pet_privacy privacy
      on privacy.pet_id = d.pet_id and privacy.publicado and privacy.mostrar_archivos
    where d.bucket_id = p_bucket
      and d.object_path = p_path
      and d.visible_publico
      and p_bucket in ('pawpass-fotos', 'pawpass-documentos')
  );
$function$;

revoke all on function private.puede_leer_archivo_perfil_publico(text, text) from public;
grant execute on function private.puede_leer_archivo_perfil_publico(text, text) to anon, authenticated;

-- A QR card has its own allowlisted contract. Its rescue/photo fields do not
-- depend on the voluntary profile or the voluntary-files section switch.
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
    'privacy', jsonb_build_object('mostrarNombreContacto', coalesce(c.mostrar_nombre_contacto, false)),
    'lost', case
      when p.estado = 'perdido' and a.id is not null then jsonb_build_object(
        'zona', a.zona, 'fechaPerdida', a.fecha_perdida, 'mensaje', a.mensaje,
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
    where d.pet_id = p.id and d.bucket_id = 'pawpass-fotos'
      and d.categoria = 'foto' and d.tipo = 'imagen'
    order by d.created_at asc, d.id asc
    limit 1
  ) photo on true
  left join lateral (
    select count(*) as total,
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
grant execute on function private.obtener_ficha_publica(text) to anon, authenticated;

create or replace function public.obtener_ficha_publica(p_codigo text)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $function$
  select private.obtener_ficha_publica(p_codigo);
$function$;

revoke all on function public.obtener_ficha_publica(text) from public;
grant execute on function public.obtener_ficha_publica(text) to anon, authenticated;

-- Any active lost alert is visible in rescue even when publicado is false.
create or replace function public.listar_mascotas_perdidas(p_limite integer default 50, p_offset integer default 0)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $function$
  select coalesce(jsonb_agg(private.obtener_ficha_publica(t.codigo_publico) order by t.updated_at desc, t.id), '[]'::jsonb)
  from (
    select p.id, p.codigo_publico, p.updated_at
    from public.pets p
    where p.estado = 'perdido'
      and exists (select 1 from public.pet_lost_alerts a where a.pet_id = p.id and a.ended_at is null)
    order by p.updated_at desc, p.id
    limit least(greatest(coalesce(p_limite, 50), 1), 100)
    offset greatest(coalesce(p_offset, 0), 0)
  ) t;
$function$;

revoke all on function public.listar_mascotas_perdidas(integer, integer) from public;
grant execute on function public.listar_mascotas_perdidas(integer, integer) to anon, authenticated;

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
    'zone', case when privacy.mostrar_zona then coalesce(nullif(btrim(t.zona_segura, ''), ''), nullif(btrim(t.zona_habitual, ''), '')) else null end,
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
      select jsonb_agg(jsonb_build_object('visible', true, 'name', v.nombre,
        'applicationDate', v.fecha_aplicacion, 'nextDose', v.proxima_dosis)
        order by v.fecha_aplicacion desc, v.id)
      from public.pet_vaccines v where v.pet_id = p.id and v.visible_publico
    ), '[]'::jsonb),
    'filesPublished', privacy.mostrar_archivos,
    'photoPath', case when privacy.mostrar_archivos then primary_photo.object_path else null end,
    'photos', case when privacy.mostrar_archivos then coalesce((
      select jsonb_agg(jsonb_build_object('visible', true, 'path', d.object_path) order by d.created_at, d.id)
      from public.pet_documents d
      join storage.objects o on o.bucket_id = d.bucket_id and o.name = d.object_path
      where d.pet_id = p.id and d.bucket_id = 'pawpass-fotos' and d.categoria = 'foto'
        and d.tipo = 'imagen' and d.visible_publico and d.id is distinct from primary_photo.id
    ), '[]'::jsonb) else '[]'::jsonb end,
    'documents', case when privacy.mostrar_archivos then coalesce((
      select jsonb_agg(jsonb_build_object('visible', true, 'name', d.nombre, 'category', d.categoria,
        'type', d.tipo, 'date', d.fecha, 'description', d.descripcion, 'bucket', d.bucket_id, 'path', d.object_path)
        order by d.created_at, d.id)
      from public.pet_documents d
      join storage.objects o on o.bucket_id = d.bucket_id and o.name = d.object_path
      where d.pet_id = p.id and d.visible_publico and d.categoria <> 'foto'
        and d.bucket_id in ('pawpass-fotos', 'pawpass-documentos')
    ), '[]'::jsonb) else '[]'::jsonb end
  )
  from public.pets p
  join public.pet_privacy privacy on privacy.pet_id = p.id and privacy.publicado
  left join public.pet_contacts t on t.pet_id = p.id
  left join public.pet_health h on h.pet_id = p.id
  left join lateral (
    select d.id, d.object_path
    from public.pet_documents d
    join storage.objects o on o.bucket_id = d.bucket_id and o.name = d.object_path
    where d.pet_id = p.id and d.bucket_id = 'pawpass-fotos'
      and d.categoria = 'foto' and d.tipo = 'imagen' and d.visible_publico
    order by d.created_at, d.id
    limit 1
  ) primary_photo on true
  where p_codigo is not null and char_length(btrim(p_codigo)) between 1 and 100
    and (p.codigo_publico = btrim(p_codigo) or p.slug = btrim(p_codigo))
    and p.estado in ('en_casa', 'en_adopcion')
    and not exists (select 1 from public.pet_lost_alerts a where a.pet_id = p.id and a.ended_at is null)
  order by p.id
  limit 1;
$function$;

create or replace function private.listar_perfiles_publicos(p_limite integer, p_offset integer)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $function$
  select coalesce(jsonb_agg(jsonb_build_object(
    'publicCode', profile."publicCode", 'name', profile.name, 'species', profile.species,
    'status', profile.status, 'breed', profile.breed, 'zone', profile.zone,
    'filesPublished', profile."filesPublished", 'photoPath', profile."photoPath", 'photoUrl', profile."photoUrl"
  ) order by profile.created_at desc), '[]'::jsonb)
  from (
    select p.codigo_publico as "publicCode", p.nombre as name,
      case p.especie when 'perro' then 'Perro' else 'Gato' end as species,
      p.estado as status, nullif(btrim(coalesce(p.raza, '')), '') as breed,
      case when privacy.mostrar_zona then coalesce(nullif(btrim(t.zona_segura, ''), ''), nullif(btrim(t.zona_habitual, ''), '')) else null end as zone,
      privacy.mostrar_archivos as "filesPublished",
      case when privacy.mostrar_archivos then photo.object_path else null end as "photoPath",
      null::text as "photoUrl", p.created_at
    from public.pets p
    join public.pet_privacy privacy on privacy.pet_id = p.id and privacy.publicado
    left join public.pet_contacts t on t.pet_id = p.id
    left join lateral (
      select d.object_path from public.pet_documents d
      join storage.objects o on o.bucket_id = d.bucket_id and o.name = d.object_path
      where d.pet_id = p.id and d.bucket_id = 'pawpass-fotos' and d.categoria = 'foto'
        and d.tipo = 'imagen' and d.visible_publico
      order by d.created_at, d.id limit 1
    ) photo on true
    where p.estado = 'en_casa'
      and not exists (select 1 from public.pet_lost_alerts a where a.pet_id = p.id and a.ended_at is null)
    order by p.created_at desc
    limit least(greatest(coalesce(p_limite, 50), 1), 100)
    offset greatest(coalesce(p_offset, 0), 0)
  ) profile;
$function$;

revoke all on function private.obtener_perfil_publico(text) from public;
grant execute on function private.obtener_perfil_publico(text) to anon, authenticated;
revoke all on function private.listar_perfiles_publicos(integer, integer) from public;
grant execute on function private.listar_perfiles_publicos(integer, integer) to anon, authenticated;

create or replace function public.obtener_perfil_publico(p_codigo text)
returns jsonb language sql stable security invoker set search_path = ''
as $function$
  select case
    when profile is null then null
    when profile ->> 'filesPublished' is distinct from 'true' then
      (profile - 'filesPublished' - 'photoPath' - 'photoUrl') || jsonb_build_object('photos', '[]'::jsonb, 'documents', '[]'::jsonb)
    when profile ->> 'photoPath' is null then
      (profile - 'filesPublished') || jsonb_build_object('photoUrl', private.foto_historica_perfil(profile ->> 'publicCode'))
    else profile - 'filesPublished'
  end
  from (select private.obtener_perfil_publico(p_codigo) as profile) result;
$function$;

create or replace function public.listar_perfiles_publicos(p_limite integer default 50, p_offset integer default 0)
returns jsonb language sql stable security invoker set search_path = ''
as $function$
  select coalesce(jsonb_agg(case
    when profile ->> 'filesPublished' is distinct from 'true' then profile - 'filesPublished' - 'photoPath' - 'photoUrl'
    when profile ->> 'photoPath' is null then
      (profile - 'filesPublished') || jsonb_build_object('photoUrl', private.foto_historica_perfil(profile ->> 'publicCode'))
    else profile - 'filesPublished'
  end order by position), '[]'::jsonb)
  from jsonb_array_elements(private.listar_perfiles_publicos(p_limite, p_offset)) with ordinality as result(profile, position);
$function$;

revoke all on function public.obtener_perfil_publico(text) from public;
grant execute on function public.obtener_perfil_publico(text) to anon, authenticated;
revoke all on function public.listar_perfiles_publicos(integer, integer) from public;
grant execute on function public.listar_perfiles_publicos(integer, integer) to anon, authenticated;
