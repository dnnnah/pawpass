-- Reversible authorization test for the private carnet. Run after
-- 20261025183650_carnet_privado_mascotas.sql in a development database.
begin;

do $test$
declare
  v_owner uuid := gen_random_uuid();
  v_tutor uuid := gen_random_uuid();
  v_other uuid := gen_random_uuid();
  v_pet uuid := gen_random_uuid();
  v_code text := 'PC-' || upper(replace(gen_random_uuid()::text, '-', '')) || '-001';
  v_document uuid;
  v_path text;
  v_count integer;
  v_updated integer;
  v_anon_denied boolean := false;
begin
  insert into auth.users(id, aud, role, email, email_confirmed_at, created_at, updated_at)
  values
    (v_owner, 'authenticated', 'authenticated', v_owner::text || '@carnet.invalid', now(), now(), now()),
    (v_tutor, 'authenticated', 'authenticated', v_tutor::text || '@carnet.invalid', now(), now(), now()),
    (v_other, 'authenticated', 'authenticated', v_other::text || '@carnet.invalid', now(), now(), now());

  insert into public.pets(id, codigo_publico, nombre, especie, fecha_nacimiento)
  values (v_pet, v_code, 'Mascota de prueba carnet', 'gato', current_date - 300);
  insert into public.pet_ownerships(pet_id, user_id, rol)
  values (v_pet, v_owner, 'administrador'), (v_pet, v_tutor, 'tutor');
  insert into public.pet_health(pet_id, nota_cuidados_emergencia)
  values (v_pet, 'No ofrecer comida con pollo.');
  insert into public.pet_documents(pet_id, nombre, categoria, tipo, bucket_id, mime_type, tamano_bytes)
  values (v_pet, 'Cartilla de vacunas.pdf', 'vacunas', 'pdf', 'pawpass-documentos', 'application/pdf', 8)
  returning id, object_path into v_document, v_path;
  insert into public.pet_vaccines(pet_id, nombre, fecha_aplicacion, proxima_dosis, documento_id)
  values (v_pet, 'Rabia', current_date - 10, current_date + 355, v_document);

  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', v_owner::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', v_owner, 'role', 'authenticated')::text, true);
  select count(*) into v_count from public.pets where id = v_pet;
  if v_count <> 1 then raise exception 'administrator cannot read the pet'; end if;
  select count(*) into v_count from public.pet_health where pet_id = v_pet and nota_cuidados_emergencia = 'No ofrecer comida con pollo.';
  if v_count <> 1 then raise exception 'administrator cannot read the private care note'; end if;
  select count(*) into v_count from public.pet_vaccines where pet_id = v_pet;
  if v_count <> 1 then raise exception 'administrator cannot read vaccines'; end if;
  select count(*) into v_count from public.pet_documents where pet_id = v_pet and tamano_bytes = 8;
  if v_count <> 1 then raise exception 'administrator cannot read private document metadata'; end if;
  update public.pets set color = 'Negro' where id = v_pet;
  get diagnostics v_updated = row_count;
  if v_updated <> 1 then raise exception 'administrator cannot update pet identity'; end if;
  update public.pet_health set nota_cuidados_emergencia = 'Mantener bajo techo.' where pet_id = v_pet;
  get diagnostics v_updated = row_count;
  if v_updated <> 1 then raise exception 'administrator cannot update health data'; end if;

  perform set_config('request.jwt.claim.sub', v_tutor::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', v_tutor, 'role', 'authenticated')::text, true);
  select count(*) into v_count from public.pet_health where pet_id = v_pet;
  if v_count <> 1 then raise exception 'active tutor cannot read the private carnet'; end if;
  select count(*) into v_count from public.pets where id = v_pet;
  if v_count <> 1 then raise exception 'active tutor cannot read pet identity'; end if;
  update public.pets set color = 'No autorizado' where id = v_pet;
  get diagnostics v_updated = row_count;
  if v_updated <> 0 then raise exception 'non-administrator tutor edited pet identity'; end if;
  update public.pet_health set nota_cuidados_emergencia = 'No autorizado' where pet_id = v_pet;
  get diagnostics v_updated = row_count;
  if v_updated <> 0 then raise exception 'non-administrator tutor edited health data'; end if;

  perform set_config('request.jwt.claim.sub', v_other::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', v_other, 'role', 'authenticated')::text, true);
  select count(*) into v_count from public.pets where id = v_pet;
  if v_count <> 0 then raise exception 'another account read the pet'; end if;
  select count(*) into v_count from public.pet_health where pet_id = v_pet;
  if v_count <> 0 then raise exception 'another account read the private health record'; end if;
  select count(*) into v_count from public.pet_vaccines where pet_id = v_pet;
  if v_count <> 0 then raise exception 'another account read vaccines'; end if;
  select count(*) into v_count from public.pet_documents where pet_id = v_pet;
  if v_count <> 0 then raise exception 'another account read private documents'; end if;

  perform set_config('role', 'anon', true);
  perform set_config('request.jwt.claim.sub', '', true);
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  begin
    execute 'select count(*) from public.pet_health where pet_id = $1' into v_count using v_pet;
    if v_count <> 0 then raise exception 'visitor read private health data'; end if;
  exception when insufficient_privilege then
    v_anon_denied := true;
  end;
  if not v_anon_denied then raise exception 'visitor unexpectedly has private table access'; end if;

  raise notice 'PASS: administrator edits; active tutor reads; unrelated account and visitor are denied';
end
$test$;

rollback;
