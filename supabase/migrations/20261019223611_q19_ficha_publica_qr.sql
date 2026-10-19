-- PawPass public QR contract.
-- The API-facing function is a controlled wrapper; the implementation stays
-- in the private schema so the exposed RPC has no table-level privileges.

create or replace function private.obtener_ficha_publica(p_codigo text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $function$
  select jsonb_build_object(
    'publicCode', p.codigo_publico,
    'photoUrl', null,
    'name', p.nombre,
    'species', case p.especie when 'perro' then 'Perro' else 'Gato' end,
    'breed', nullif(btrim(coalesce(p.raza, '')), ''),
    'status', p.estado,
    'privacy', jsonb_build_object(
      'mostrarNombreContacto', c.mostrar_nombre_contacto,
      'mostrarTelefono', c.mostrar_telefono,
      'mostrarWhatsapp', c.mostrar_whatsapp,
      'mostrarZona', c.mostrar_zona,
      'mostrarEmergencia', c.mostrar_emergencia
    ),
    'lost', case
      when p.estado = 'perdido' and a.id is not null then jsonb_build_object(
        'zona', case when c.mostrar_zona then a.zona else null end,
        'fechaPerdida', case when c.mostrar_emergencia then a.fecha_perdida else null end,
        'mensaje', case when c.mostrar_emergencia then a.mensaje else null end,
        'instrucciones', case
          when c.mostrar_emergencia then coalesce(a.instrucciones, '{}'::text[])
          else '{}'::text[]
        end
      )
      else null
    end,
    'contact', case
      when p.estado = 'perdido'
        and a.id is not null
        and (c.mostrar_telefono or c.mostrar_whatsapp)
      then jsonb_build_object(
        'name', case when c.mostrar_nombre_contacto then t.nombre_publico else null end,
        'phone', case when c.mostrar_telefono then t.telefono_principal else null end,
        'whatsapp', case when c.mostrar_whatsapp then t.whatsapp else null end
      )
      else null
    end,
    'recentPhotos', '[]'::jsonb
  )
  from public.pets p
  join public.pet_privacy c on c.pet_id = p.id
  left join public.pet_contacts t on t.pet_id = p.id
  left join public.pet_lost_alerts a on a.pet_id = p.id and a.ended_at is null
  where p_codigo is not null
    and char_length(btrim(p_codigo)) between 1 and 100
    and (p.codigo_publico = btrim(p_codigo) or p.slug = btrim(p_codigo))
    and c.publicado
  order by p.id
  limit 1;
$function$;

create or replace function public.obtener_ficha_publica(p_codigo text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $function$
  select private.obtener_ficha_publica(p_codigo);
$function$;

revoke all on function private.obtener_ficha_publica(text) from public;
revoke all on function public.obtener_ficha_publica(text) from public;
grant execute on function public.obtener_ficha_publica(text) to anon, authenticated;
