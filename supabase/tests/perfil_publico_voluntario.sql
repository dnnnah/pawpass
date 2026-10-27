-- Verifica el perfil voluntario y su límite por campo/archivo.
-- Ejecutar en una base local o de desarrollo con Fase 2.4 aplicada.
begin;

do $test$
declare
  v_owner uuid := gen_random_uuid();
  v_pet uuid := gen_random_uuid();
  v_private_pet uuid := gen_random_uuid();
  v_code text := 'PC-' || upper(replace(gen_random_uuid()::text, '-', '')) || '-001';
  v_private_code text := 'PC-' || upper(replace(gen_random_uuid()::text, '-', '')) || '-001';
  v_primary_path text;
  v_public_photo_path text;
  v_gallery_photo_path text;
  v_public_document_path text;
  v_private_document_path text;
  v_profile jsonb;
  v_list jsonb;
  v_primary_id uuid;
  v_public_photo_id uuid;
  v_public_document_id uuid;
  v_private_document_id uuid;
begin
  insert into auth.users(id, aud, role, email, email_confirmed_at, created_at, updated_at)
  values (v_owner, 'authenticated', 'authenticated', v_owner::text || '@public-profile.invalid', now(), now(), now());

  insert into public.pets(id, codigo_publico, nombre, especie, estado, fecha_nacimiento, raza, color, microchip)
  values (v_pet, v_code, 'Lola pública', 'perro', 'en_casa', current_date - 700, 'Mestiza', 'Canela', 'CHIP-123');
  insert into public.pet_ownerships(pet_id, user_id, rol) values (v_pet, v_owner, 'administrador');
  insert into public.pet_contacts(pet_id, medio_contacto_qr, telefono_principal, email, zona_segura, zona_habitual)
  values (v_pet, 'phone', '+525512345678', 'privado@example.invalid', 'Parque Norte', 'Colonia Sur');
  insert into public.pet_privacy(pet_id, publicado, mostrar_nombre_contacto, mostrar_email, mostrar_zona, mostrar_salud, mostrar_microchip)
  values (v_pet, true, false, false, true, true, true);
  insert into public.pet_health(pet_id, alergias, condiciones_medicas, dieta_especial, nota_cuidados_emergencia)
  values (v_pet, array['Pollo'], array['Piel sensible'], 'Alimento especial', 'No ofrecer pollo.');

  insert into public.pet_documents(pet_id, nombre, categoria, tipo, bucket_id, mime_type, tamano_bytes, visible_publico, created_at)
  values (v_pet, 'Foto privada', 'foto', 'imagen', 'pawpass-fotos', 'image/jpeg', 12, false, now() - interval '3 minutes')
  returning id, object_path into v_primary_id, v_primary_path;
  insert into storage.objects(bucket_id, name, owner, owner_id, metadata)
  values ('pawpass-fotos', v_primary_path, v_owner, v_owner::text, '{"mimetype":"image/jpeg","size":12}'::jsonb);

  insert into public.pet_documents(pet_id, nombre, categoria, tipo, bucket_id, mime_type, tamano_bytes, visible_publico, created_at)
  values (v_pet, 'Foto elegida', 'foto', 'imagen', 'pawpass-fotos', 'image/jpeg', 13, true, now() - interval '2 minutes')
  returning id, object_path into v_public_photo_id, v_public_photo_path;
  insert into storage.objects(bucket_id, name, owner, owner_id, metadata)
  values ('pawpass-fotos', v_public_photo_path, v_owner, v_owner::text, '{"mimetype":"image/jpeg","size":13}'::jsonb);

  insert into public.pet_documents(pet_id, nombre, categoria, tipo, bucket_id, mime_type, tamano_bytes, visible_publico, created_at)
  values (v_pet, 'Foto de galería', 'foto', 'imagen', 'pawpass-fotos', 'image/jpeg', 14, true, now() - interval '1 minute')
  returning object_path into v_gallery_photo_path;
  insert into storage.objects(bucket_id, name, owner, owner_id, metadata)
  values ('pawpass-fotos', v_gallery_photo_path, v_owner, v_owner::text, '{"mimetype":"image/jpeg","size":14}'::jsonb);

  insert into public.pet_documents(pet_id, nombre, categoria, tipo, bucket_id, mime_type, tamano_bytes, visible_publico)
  values (v_pet, 'Cartilla elegida', 'vacunas', 'pdf', 'pawpass-documentos', 'application/pdf', 15, true)
  returning id, object_path into v_public_document_id, v_public_document_path;
  insert into storage.objects(bucket_id, name, owner, owner_id, metadata)
  values ('pawpass-documentos', v_public_document_path, v_owner, v_owner::text, '{"mimetype":"application/pdf","size":15}'::jsonb);

  insert into public.pet_documents(pet_id, nombre, categoria, tipo, bucket_id, mime_type, tamano_bytes, visible_publico)
  values (v_pet, 'Expediente privado', 'salud', 'pdf', 'pawpass-documentos', 'application/pdf', 16, false)
  returning id, object_path into v_private_document_id, v_private_document_path;
  insert into storage.objects(bucket_id, name, owner, owner_id, metadata)
  values ('pawpass-documentos', v_private_document_path, v_owner, v_owner::text, '{"mimetype":"application/pdf","size":16}'::jsonb);

  insert into public.pet_vaccines(pet_id, nombre, fecha_aplicacion, proxima_dosis, visible_publico)
  values (v_pet, 'Rabia pública', current_date - 20, current_date + 345, true),
         (v_pet, 'Vacuna privada', current_date - 10, current_date + 355, false);

  insert into public.pets(id, codigo_publico, nombre, especie, estado)
  values (v_private_pet, v_private_code, 'Lola privada', 'perro', 'en_casa');
  insert into public.pet_ownerships(pet_id, user_id, rol) values (v_private_pet, v_owner, 'administrador');
  insert into public.pet_privacy(pet_id, publicado) values (v_private_pet, false);

  perform set_config('role', 'anon', true);
  perform set_config('request.jwt.claim.sub', '', true);
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);

  select public.obtener_perfil_publico(v_code) into v_profile;
  if v_profile ->> 'name' <> 'Lola pública' then raise exception 'published profile was not returned'; end if;
  if v_profile ->> 'email' is not null or v_profile #>> '{contact,email}' is not null then raise exception 'private email leaked'; end if;
  if v_profile #>> '{contact,phone}' <> '+525512345678' then raise exception 'selected QR contact is missing'; end if;
  if v_profile ->> 'zone' <> 'Parque Norte' then raise exception 'selected approximate zone is missing'; end if;
  if v_profile #>> '{health,allergies,0}' <> 'Pollo' or v_profile ->> 'veterinarian' is not null then raise exception 'health allowlist is incorrect'; end if;
  if jsonb_array_length(v_profile -> 'vaccines') <> 1 or v_profile #>> '{vaccines,0,name}' <> 'Rabia pública' then raise exception 'unselected vaccine was exposed'; end if;
  if v_profile ->> 'photoPath' <> v_public_photo_path then raise exception 'the selected primary photo was not used'; end if;
  if jsonb_array_length(v_profile -> 'photos') <> 1 or v_profile #>> '{photos,0,path}' <> v_gallery_photo_path then raise exception 'photo consent was not applied'; end if;
  if jsonb_array_length(v_profile -> 'documents') <> 1 or v_profile #>> '{documents,0,path}' <> v_public_document_path then raise exception 'document consent was not applied'; end if;
  if private.puede_leer_archivo_perfil_publico('pawpass-documentos', v_private_document_path) then raise exception 'private document became readable'; end if;
  if public.obtener_perfil_publico(v_private_code) is not null then raise exception 'unpublished profile was returned'; end if;

  select public.listar_perfiles_publicos(50, 0) into v_list;
  if not exists (select 1 from jsonb_array_elements(v_list) card where card ->> 'publicCode' = v_code) then raise exception 'published profile is missing from list'; end if;
  if exists (select 1 from jsonb_array_elements(v_list) card where card ->> 'publicCode' = v_private_code) then raise exception 'unpublished profile appeared in list'; end if;

  -- An active lost alert keeps the separate rescue page available, but must
  -- not revoke an already-enabled voluntary profile or widen its allowlist.
  update public.pets set estado = 'perdido' where id = v_pet;
  insert into public.pet_lost_alerts(pet_id, fecha_perdida, zona)
  values (v_pet, current_date, 'Parque Norte');
  select public.obtener_perfil_publico(v_code) into v_profile;
  if v_profile ->> 'status' <> 'perdido' then raise exception 'published profile became unavailable during an active lost alert'; end if;
  if v_profile #>> '{contact,phone}' <> '+525512345678' or v_profile #>> '{contact,email}' is not null then raise exception 'lost status changed the existing contact allowlist'; end if;
  if v_profile ->> 'photoPath' <> v_public_photo_path or v_profile #>> '{photos,0,path}' <> v_gallery_photo_path then raise exception 'lost status changed the existing public photo consent'; end if;
  if v_profile #>> '{documents,0,path}' <> v_public_document_path then raise exception 'lost status changed the existing public document consent'; end if;
  if v_profile #>> '{health,allergies,0}' <> 'Pollo' or jsonb_array_length(v_profile -> 'vaccines') <> 1 then raise exception 'lost status changed existing health/vaccine consent'; end if;
  if exists (select 1 from jsonb_array_elements(public.listar_perfiles_publicos(50, 0)) card where card ->> 'publicCode' = v_code) then
    raise exception 'lost pets were forced into the voluntary profile directory';
  end if;

  raise notice 'PASS: unpublished profiles and unselected records remain hidden from the public profile';
end
$test$;

rollback;
