-- Verifica el contrato público del QR y el directorio de rescate.
-- Ejecutar en una base local/de desarrollo con la migración 2.3 aplicada.
begin;

do $test$
declare
  v_owner uuid := gen_random_uuid();
  v_pet uuid := gen_random_uuid();
  v_home_pet uuid := gen_random_uuid();
  v_code text := 'PC-' || upper(replace(gen_random_uuid()::text, '-', '')) || '-001';
  v_home_code text := 'PC-' || upper(replace(gen_random_uuid()::text, '-', '')) || '-001';
  v_card jsonb;
  v_lost jsonb;
  v_photo_path text;
begin
  insert into auth.users(id, aud, role, email, email_confirmed_at, created_at, updated_at)
  values (v_owner, 'authenticated', 'authenticated', v_owner::text || '@qr.invalid', now(), now(), now());
  insert into public.pets(id, codigo_publico, nombre, especie, estado)
  values (v_pet, v_code, 'Mascota QR de prueba', 'perro', 'perdido');
  insert into public.pet_ownerships(pet_id, user_id, rol)
  values (v_pet, v_owner, 'administrador');
  insert into public.pet_documents(pet_id, nombre, categoria, tipo, bucket_id, mime_type, tamano_bytes)
  values (v_pet, 'Foto principal QR', 'foto', 'imagen', 'pawpass-fotos', 'image/jpeg', 12)
  returning object_path into v_photo_path;
  insert into storage.objects(bucket_id, name, owner, owner_id, metadata)
  values ('pawpass-fotos', v_photo_path, v_owner, v_owner::text, '{"mimetype":"image/jpeg","size":12}'::jsonb);
  insert into public.pet_contacts(pet_id, telefono_principal, email, medio_contacto_qr, zona_segura)
  values (v_pet, '+525512345678', 'privado@qr.invalid', 'phone', 'Parque cercano');
  insert into public.pet_privacy(pet_id, publicado, mostrar_nombre_contacto)
  values (v_pet, false, false);
  insert into public.pet_health(pet_id, nota_cuidados_emergencia, alergias)
  values (v_pet, 'No ofrecer pollo.', array['Dato médico privado']);
  insert into public.pet_lost_alerts(pet_id, fecha_perdida, zona)
  values (v_pet, current_date - 1, 'Colonia Centro');
  insert into public.pet_vaccines(pet_id, nombre, fecha_aplicacion, proxima_dosis)
  values (v_pet, 'Rabia', current_date - 10, current_date + 355);

  insert into public.pets(id, codigo_publico, nombre, especie, estado)
  values (v_home_pet, v_home_code, 'Mascota QR en casa', 'gato', 'en_casa');
  insert into public.pet_ownerships(pet_id, user_id, rol)
  values (v_home_pet, v_owner, 'administrador');
  insert into public.pet_contacts(pet_id, email, medio_contacto_qr, zona_segura)
  values (v_home_pet, 'familia@qr.invalid', 'email', 'Zona tranquila');
  insert into public.pet_privacy(pet_id, publicado) values (v_home_pet, false);
  insert into public.pet_health(pet_id, nota_cuidados_emergencia)
  values (v_home_pet, 'No darle chocolate.');

  perform set_config('role', 'anon', true);
  perform set_config('request.jwt.claim.sub', '', true);
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);

  select public.obtener_ficha_publica(v_code) into v_card;
  if v_card ->> 'name' <> 'Mascota QR de prueba' then raise exception 'QR is unavailable while voluntary profile is disabled'; end if;
  if v_card ->> 'photoPath' <> v_photo_path then raise exception 'QR primary photo is missing'; end if;
  if not private.puede_leer_foto_qr('pawpass-fotos', v_photo_path) then raise exception 'anonymous role cannot sign the QR primary photo'; end if;
  if v_card ->> 'status' <> 'perdido'
    or v_card #>> '{lost,zona}' <> 'Colonia Centro'
    or v_card #>> '{lost,fechaPerdida}' <> (current_date - 1)::text
    or v_card #>> '{lost,mensaje}' <> 'Ayuda a reunirnos'
    or v_card #>> '{lost,instrucciones,0}' <> 'No lo persigas'
  then raise exception 'lost rescue details are missing'; end if;
  if v_card #>> '{contact,phone}' <> '+525512345678' or v_card #>> '{contact,email}' is not null then raise exception 'QR did not restrict contact to the selected channel'; end if;
  if v_card ->> 'emergencyCareNote' <> 'No ofrecer pollo.' then raise exception 'emergency care note is missing'; end if;
  if v_card ->> 'vaccinationStatus' <> 'al_dia' then raise exception 'vaccination summary is incorrect'; end if;
  if v_card ? 'health' or v_card ? 'vaccines' or v_card ? 'documents' then raise exception 'private carnet data leaked into the QR'; end if;

  select public.obtener_ficha_publica(v_home_code) into v_card;
  if v_card ->> 'status' <> 'en_casa' or v_card -> 'lost' is distinct from 'null'::jsonb then raise exception 'home QR should not expose a lost alert'; end if;
  if v_card #>> '{contact,email}' <> 'familia@qr.invalid' or v_card #>> '{contact,phone}' is not null then raise exception 'home QR did not show the selected email channel'; end if;
  if v_card ->> 'zone' <> 'Zona tranquila' or v_card ->> 'emergencyCareNote' <> 'No darle chocolate.' then raise exception 'home QR is missing agreed basic fields'; end if;
  if v_card ->> 'vaccinationStatus' is not null then raise exception 'home QR must not expose the vaccination summary'; end if;

  select public.listar_mascotas_perdidas(20, 0) into v_lost;
  if not exists (select 1 from jsonb_array_elements(v_lost) item where item ->> 'publicCode' = v_code) then
    raise exception 'active lost pet is missing from the public directory';
  end if;
  raise notice 'PASS: unpublished QR, chosen contact, rescue summary and allowlisted fields';
end
$test$;

rollback;
