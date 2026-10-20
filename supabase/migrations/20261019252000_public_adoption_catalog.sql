-- Public adoption catalog contract.
-- Only pets explicitly published and listed in the catalog are returned. The
-- function intentionally exposes presentation fields only; private profile,
-- contact and health data remain behind the authenticated preview contract.

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
      case p.genero
        when 'macho' then 'Macho'
        when 'hembra' then 'Hembra'
        else ''
      end as genero,
      case p.talla
        when 'miniatura' then 'Miniatura'
        when 'pequeno' then 'Pequeño'
        when 'mediano' then 'Mediano'
        when 'grande' then 'Grande'
        else ''
      end as talla,
      p.fecha_nacimiento as "fechaNacimiento",
      ''::text as "fotoUrl",
      p.verificado,
      s.slug as "shelterId",
      s.nombre as "shelterNombre",
      case
        when s.id is not null then coalesce(s.ubicacion, '')
        when c.mostrar_zona then coalesce(t.zona_habitual, '')
        else ''
      end as zona
    from public.pets p
    join public.pet_privacy c on c.pet_id = p.id
    left join public.pet_contacts t on t.pet_id = p.id
    left join lateral (
      select s0.slug, s0.nombre, s0.ubicacion
      from public.pet_shelters ps0
      join public.shelters s0 on s0.id = ps0.shelter_id
      where ps0.pet_id = p.id
        and ps0.ended_at is null
        and s0.publicado
      order by ps0.started_at desc, ps0.id
      limit 1
    ) s on true
    where c.publicado
      and c.listar_catalogo
      and p.estado = 'en_adopcion'
      and not exists (
        select 1
        from public.pet_lost_alerts a
        where a.pet_id = p.id and a.ended_at is null
      )
    order by p.codigo_publico
    limit least(greatest(coalesce(p_limite, 20), 1), 100)
    offset greatest(coalesce(p_offset, 0), 0)
  ) t;
$function$;

create or replace function public.listar_catalogo_publico(p_limite integer default 20, p_offset integer default 0)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $function$
  select private.listar_catalogo_publico(p_limite, p_offset);
$function$;

revoke all on function private.listar_catalogo_publico(integer, integer) from public, anon, authenticated;
revoke all on function public.listar_catalogo_publico(integer, integer) from public;
grant execute on function public.listar_catalogo_publico(integer, integer) to anon, authenticated;
