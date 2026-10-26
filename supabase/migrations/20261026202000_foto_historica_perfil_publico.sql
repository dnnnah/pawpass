-- Recover the existing shipped photo only for these exact historical records.
-- The selected asset still requires both a published profile and its own
-- visible_publico consent flag. This migration never changes those flags.
create or replace function private.foto_historica_perfil(p_codigo text)
returns text language sql stable security definer set search_path = ''
as $function$
  select original.url
  from (values
    ('PC-LUCCA-001', 'ea2504bf-78db-43fd-a084-9d5f7ad17d10'::uuid, '/pets/lucca.jpeg'),
    ('PC-NIKO-002', '1c620cbd-ea1c-490d-bc64-32d1e5ffc36e'::uuid, '/pets/niko.jpeg'),
    ('PC-ALIX-003', 'f7c534de-a9b8-43df-b079-48f29a56a7d5'::uuid, '/pets/alix.jpeg'),
    ('PC-LOKI-001', '3c7e0917-7d1c-4038-920a-13907223e9aa'::uuid, '/pets/loki.jpeg'),
    ('PC-VISERYS-001', '76a0886b-52a3-4bbb-bdb1-71bbb643a620'::uuid, '/pets/viserys.jpeg')
  ) original(code, document_id, url)
  join public.pets pet on pet.codigo_publico = original.code
  join public.pet_privacy privacy on privacy.pet_id = pet.id and privacy.publicado
  join public.pet_documents photo on photo.id = original.document_id and photo.pet_id = pet.id
  where original.code = p_codigo and photo.visible_publico
    and photo.bucket_id = 'pawpass-fotos' and photo.categoria = 'foto' and photo.tipo = 'imagen'
  limit 1;
$function$;
revoke all on function private.foto_historica_perfil(text) from public;
grant execute on function private.foto_historica_perfil(text) to anon, authenticated;

create or replace function public.obtener_perfil_publico(p_codigo text)
returns jsonb language sql stable security invoker set search_path = ''
as $function$
  select case when profile is null then null
    when profile ->> 'photoPath' is null then profile || jsonb_build_object('photoUrl', private.foto_historica_perfil(profile ->> 'publicCode'))
    else profile end
  from (select private.obtener_perfil_publico(p_codigo) as profile) result;
$function$;
revoke all on function public.obtener_perfil_publico(text) from public;
grant execute on function public.obtener_perfil_publico(text) to anon, authenticated;

create or replace function public.listar_perfiles_publicos(p_limite integer default 50, p_offset integer default 0)
returns jsonb language sql stable security invoker set search_path = ''
as $function$
  select coalesce(jsonb_agg(case when profile ->> 'photoPath' is null
    then profile || jsonb_build_object('photoUrl', private.foto_historica_perfil(profile ->> 'publicCode'))
    else profile end order by position), '[]'::jsonb)
  from jsonb_array_elements(private.listar_perfiles_publicos(p_limite, p_offset)) with ordinality as result(profile, position);
$function$;
revoke all on function public.listar_perfiles_publicos(integer, integer) from public;
grant execute on function public.listar_perfiles_publicos(integer, integer) to anon, authenticated;
