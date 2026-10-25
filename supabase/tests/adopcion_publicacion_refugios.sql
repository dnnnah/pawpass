-- Ejecutar en una base local/de desarrollo con Fase 2 y esta migración aplicada.
-- Comprueba permisos de dueño/refugio y que adopción no dependa del perfil voluntario.
begin;

do $test$
declare
  v_owner uuid := gen_random_uuid();
  v_member uuid := gen_random_uuid();
  v_stranger uuid := gen_random_uuid();
  v_shelter uuid := gen_random_uuid();
  v_owner_pet uuid := gen_random_uuid();
  v_shelter_pet uuid := gen_random_uuid();
  v_unlinked_pet uuid := gen_random_uuid();
  v_owner_code text := 'PC-' || upper(replace(gen_random_uuid()::text, '-', '')) || '-001';
  v_shelter_code text := 'PC-' || upper(replace(gen_random_uuid()::text, '-', '')) || '-001';
  v_unlinked_code text := 'PC-' || upper(replace(gen_random_uuid()::text, '-', '')) || '-001';
  v_owner_photo text;
  v_shelter_photo text;
  v_catalog jsonb;
  v_preview jsonb;
begin
  insert into auth.users(id, aud, role, email, email_confirmed_at, created_at, updated_at)
  values
    (v_owner, 'authenticated', 'authenticated', v_owner::text || '@owner.invalid', now(), now(), now()),
    (v_member, 'authenticated', 'authenticated', v_member::text || '@member.invalid', now(), now(), now()),
    (v_stranger, 'authenticated', 'authenticated', v_stranger::text || '@stranger.invalid', now(), now(), now());
  insert into public.profiles(id, full_name)
  values (v_owner, 'Dueño de prueba'), (v_member, 'Miembro de prueba'), (v_stranger, 'Cuenta ajena');

  insert into public.shelters(id, slug, nombre, email, publicado, publicar_contacto, verificado)
  values (v_shelter, 'refugio-prueba-' || left(v_shelter::text, 8), 'Refugio de prueba', 'refugio@example.invalid', true, false, true);
  insert into public.shelter_memberships(shelter_id, user_id, rol)
  values (v_shelter, v_member, 'administrador');

  insert into public.pets(id, codigo_publico, nombre, especie, estado)
  values
    (v_owner_pet, v_owner_code, 'Mascota dueña', 'perro', 'en_casa'),
    (v_shelter_pet, v_shelter_code, 'Mascota refugio', 'gato', 'en_casa'),
    (v_unlinked_pet, v_unlinked_code, 'Mascota sin vínculo', 'perro', 'en_casa');
  insert into public.pet_ownerships(pet_id, user_id, rol)
  values
    (v_owner_pet, v_owner, 'administrador'),
    (v_shelter_pet, v_owner, 'administrador'),
    (v_unlinked_pet, v_owner, 'administrador');
  insert into public.pet_contacts(pet_id, email, zona_segura)
  values (v_owner_pet, 'private-owner@example.invalid', 'Zona aproximada');
  insert into public.pet_privacy(pet_id, publicado, listar_catalogo)
  values (v_owner_pet, false, false), (v_shelter_pet, false, false), (v_unlinked_pet, false, false);
  insert into public.pet_shelters(pet_id, shelter_id)
  values (v_shelter_pet, v_shelter);

  insert into public.pet_documents(pet_id, nombre, categoria, tipo, bucket_id, mime_type, tamano_bytes)
  values (v_owner_pet, 'Foto dueña', 'foto', 'imagen', 'pawpass-fotos', 'image/jpeg', 12)
  returning object_path into v_owner_photo;
  insert into storage.objects(bucket_id, name, owner, owner_id, metadata)
  values ('pawpass-fotos', v_owner_photo, v_owner, v_owner::text, '{"mimetype":"image/jpeg","size":12}'::jsonb);

  insert into public.pet_documents(pet_id, nombre, categoria, tipo, bucket_id, mime_type, tamano_bytes)
  values (v_shelter_pet, 'Foto refugio', 'foto', 'imagen', 'pawpass-fotos', 'image/jpeg', 13)
  returning object_path into v_shelter_photo;
  insert into storage.objects(bucket_id, name, owner, owner_id, metadata)
  values ('pawpass-fotos', v_shelter_photo, v_owner, v_owner::text, '{"mimetype":"image/jpeg","size":13}'::jsonb);

  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', v_owner::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('role', 'authenticated', 'sub', v_owner)::text, true);
  perform public.cambiar_estado_adopcion(v_owner_pet, 'en_adopcion', null);

  perform set_config('request.jwt.claim.sub', v_member::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('role', 'authenticated', 'sub', v_member)::text, true);
  select public.listar_mascotas_refugio_adopcion(v_shelter) into v_preview;
  if not exists (select 1 from jsonb_array_elements(v_preview) item where item ->> 'publicCode' = v_shelter_code) then
    raise exception 'El miembro no puede previsualizar la mascota vinculada';
  end if;
  if v_preview::text like '%email%' or v_preview::text like '%telefono%' or v_preview::text like '%salud%' then
    raise exception 'El preview del refugio expuso datos privados';
  end if;
  perform public.cambiar_estado_adopcion(v_shelter_pet, 'en_adopcion', v_shelter);

  perform set_config('request.jwt.claim.sub', v_stranger::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('role', 'authenticated', 'sub', v_stranger)::text, true);
  begin
    perform public.cambiar_estado_adopcion(v_unlinked_pet, 'en_adopcion', v_shelter);
    raise exception 'Una cuenta ajena publicó una mascota sin vínculo';
  exception when insufficient_privilege then
    null;
  end;

  perform set_config('role', 'anon', true);
  perform set_config('request.jwt.claim.sub', '', true);
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  select public.listar_catalogo_publico(100, 0) into v_catalog;
  if not exists (select 1 from jsonb_array_elements(v_catalog) item where item ->> 'codigoPublico' = v_owner_code) then
    raise exception 'La mascota del dueño debe ser pública aunque su perfil voluntario esté apagado';
  end if;
  if not exists (select 1 from jsonb_array_elements(v_catalog) item where item ->> 'codigoPublico' = v_shelter_code) then
    raise exception 'La mascota publicada por refugio no aparece en catálogo';
  end if;
  if exists (select 1 from jsonb_array_elements(v_catalog) item where item ->> 'codigoPublico' = v_unlinked_code) then
    raise exception 'La mascota no publicada apareció en el catálogo';
  end if;
  if private.puede_leer_foto_adopcion('pawpass-fotos', v_owner_photo) is not true then
    raise exception 'La foto principal de adopción no está disponible al público';
  end if;
  if v_catalog::text like '%private-owner@example.invalid%' or v_catalog::text like '%contact%' or v_catalog::text like '%health%' then
    raise exception 'El contrato de catálogo expuso contacto o datos del carnet';
  end if;

  insert into public.pet_lost_alerts(pet_id, fecha_perdida, zona)
  values (v_owner_pet, current_date, 'Zona aproximada');
  select public.listar_catalogo_publico(100, 0) into v_catalog;
  if exists (select 1 from jsonb_array_elements(v_catalog) item where item ->> 'codigoPublico' = v_owner_code) then
    raise exception 'Una mascota perdida siguió en el catálogo de adopción';
  end if;
  if private.puede_leer_foto_adopcion('pawpass-fotos', v_owner_photo) then
    raise exception 'La foto de adopción siguió legible durante una alerta';
  end if;

  raise notice 'PASS: publicación dueña/refugio, membresías, perfil privado y exclusión por pérdida';
end
$test$;

rollback;
