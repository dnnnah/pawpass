-- Una alerta no revoca el consentimiento previo del perfil voluntario.
-- El RPC sigue limitado por privacidad.publicado y por cada consentimiento.
-- El listado público se mantiene limitado a mascotas en casa.
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
    and p.estado in ('en_casa', 'en_adopcion', 'perdido')
  order by p.id
  limit 1;
$function$;

revoke all on function private.obtener_perfil_publico(text) from public;
grant execute on function private.obtener_perfil_publico(text) to anon, authenticated;
