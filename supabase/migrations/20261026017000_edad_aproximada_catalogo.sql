-- Public adoption consent includes approximate age, never exact birth date.
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
      greatest(0, (extract(year from age(current_date, p.fecha_nacimiento)) * 12
        + extract(month from age(current_date, p.fecha_nacimiento)))::integer) as "edadMeses",
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
