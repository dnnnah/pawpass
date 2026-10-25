-- Run after 20261025120000_cuenta_registro_sencillo.sql in a development DB.
-- Fixture accounts and the created pet are rolled back at the end.
begin;

do $test$
declare
  v_owner uuid := gen_random_uuid();
  v_other uuid := gen_random_uuid();
  v_result jsonb;
  v_pet uuid;
  v_document uuid;
  v_path text;
  v_photo jsonb;
  v_count integer;
  v_anon_denied boolean := false;
  v_photo_rejected boolean;
  v_invalid_photo record;
begin
  insert into auth.users(id, aud, role, email, email_confirmed_at, created_at, updated_at)
  values
    (v_owner, 'authenticated', 'authenticated', v_owner::text || '@phase1.invalid', now(), now(), now()),
    (v_other, 'authenticated', 'authenticated', v_other::text || '@phase1.invalid', now(), now(), now());

  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', v_owner::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', v_owner, 'role', 'authenticated')::text, true);

  for v_invalid_photo in
    select * from (values
      ('nala.png'::text, 'image/png'::text, null::bigint, 'tamaño nulo'),
      ('nala.png'::text, 'image/png'::text, 0::bigint, 'tamaño cero'),
      ('nala.png'::text, 'image/png'::text, -1::bigint, 'tamaño negativo'),
      ('nala.png'::text, 'image/png'::text, 5242881::bigint, 'tamaño superior a 5 MiB'),
      ('nala.gif'::text, 'image/gif'::text, 4::bigint, 'tipo MIME no permitido'),
      (''::text, 'image/png'::text, 4::bigint, 'nombre vacío'),
      (repeat('a', 201)::text, 'image/png'::text, 4::bigint, 'nombre demasiado largo')
    ) as invalid_photo(name, mime, size, label)
  loop
    v_photo_rejected := false;
    begin
      execute 'select public.crear_mascota($1,$2,$3,$4,$5,$6,$7,$8)'
        using 'Foto inválida', 'gato', current_date - 300, 'phone', '+525512345678',
          v_invalid_photo.name, v_invalid_photo.mime, v_invalid_photo.size;
    exception when sqlstate '22023' then
      v_photo_rejected := true;
    end;
    if not v_photo_rejected then
      raise exception 'RPC accepted invalid photo metadata: %', v_invalid_photo.label;
    end if;
  end loop;

  execute 'select public.crear_mascota($1,$2,$3,$4,$5,$6,$7,$8)'
    into v_result
    using 'Nala Fase 1', 'gato', current_date - 300, 'phone', '+525512345678', 'nala.png', 'image/png', 4::bigint;

  v_pet := (v_result ->> 'petId')::uuid;
  v_document := (v_result ->> 'documentId')::uuid;
  v_path := v_result ->> 'objectPath';
  if v_pet is null or v_document is null or v_path <> v_document::text || '/archivo' then
    raise exception 'RPC did not return the expected pet and photo metadata';
  end if;

  select count(*) into v_count from public.pets where id = v_pet;
  if v_count <> 1 then raise exception 'owner cannot read created pet'; end if;
  select count(*) into v_count from public.pet_ownerships where pet_id = v_pet and user_id = v_owner and rol = 'administrador';
  if v_count <> 1 then raise exception 'owner relationship is missing'; end if;
  select count(*) into v_count from public.pet_contacts where pet_id = v_pet and telefono_principal = '+525512345678' and whatsapp is null and email is null;
  if v_count <> 1 then raise exception 'selected contact was not stored exclusively'; end if;
  select count(*) into v_count from public.pet_privacy where pet_id = v_pet and not publicado;
  if v_count <> 1 then raise exception 'new pet must remain unpublished'; end if;
  select to_jsonb(d) into v_photo from public.pet_documents d where id = v_document;
  if v_photo is null then
    raise exception 'owner cannot read the generated private photo metadata';
  end if;
  if v_photo ->> 'pet_id' <> v_pet::text
     or v_photo ->> 'bucket_id' <> 'pawpass-fotos'
     or v_photo ->> 'object_path' <> v_path
     or v_photo ->> 'visible_publico' <> 'false' then
    raise exception 'private photo metadata has unexpected values: %', v_photo;
  end if;
  select count(*) into v_count from public.pet_documents where id = v_document;
  if v_count <> 1 then raise exception 'owner cannot read private photo metadata'; end if;
  if not private.puede_escribir_archivo('pawpass-fotos', v_path) then raise exception 'owner cannot upload registered photo'; end if;

  perform set_config('request.jwt.claim.sub', v_other::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', v_other, 'role', 'authenticated')::text, true);
  select count(*) into v_count from public.pets where id = v_pet;
  if v_count <> 0 then raise exception 'another account read created pet'; end if;
  if private.puede_escribir_archivo('pawpass-fotos', v_path) then raise exception 'another account can upload photo'; end if;

  perform set_config('role', 'anon', true);
  perform set_config('request.jwt.claim.sub', '', true);
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  begin
    execute 'select count(*) from public.pets where id = $1' into v_count using v_pet;
    if v_count <> 0 then raise exception 'visitor read created pet'; end if;
  exception when insufficient_privilege then
    v_anon_denied := true;
  end;
  if not v_anon_denied then raise exception 'visitor unexpectedly has table access'; end if;

  raise notice 'PASS: RPC creates a private pet for its verified owner; other account and visitor are denied';
end
$test$;

rollback;
