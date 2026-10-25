-- Reversible authorization probe for the existing private account tables.
-- Run against a Supabase development database; all fixture rows are rolled back.
begin;

do $test$
declare
  v_owner uuid := gen_random_uuid();
  v_other uuid := gen_random_uuid();
  v_pet uuid := gen_random_uuid();
  v_document uuid := gen_random_uuid();
  v_code text := 'PC-' || upper(replace(gen_random_uuid()::text, '-', '')) || '-001';
  v_count integer;
  v_anon_denied boolean := false;
begin
  insert into auth.users(id, aud, role, email, email_confirmed_at, created_at, updated_at)
  values
    (v_owner, 'authenticated', 'authenticated', v_owner::text || '@phase1.invalid', now(), now(), now()),
    (v_other, 'authenticated', 'authenticated', v_other::text || '@phase1.invalid', now(), now(), now());

  insert into public.pets(id, codigo_publico, nombre, especie)
  values (v_pet, v_code, 'Mascota de prueba Fase 1', 'gato');
  insert into public.pet_ownerships(pet_id, user_id, rol)
  values (v_pet, v_owner, 'administrador');
  insert into public.pet_contacts(pet_id, telefono_principal)
  values (v_pet, '+525512345678');
  insert into public.pet_privacy(pet_id) values (v_pet);
  insert into public.pet_documents(id, pet_id, nombre, categoria, tipo, bucket_id, object_path, mime_type, tamano_bytes)
  values (v_document, v_pet, 'foto.png', 'foto', 'imagen', 'pawpass-fotos', v_document::text || '/archivo', 'image/png', 4);

  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', v_owner::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', v_owner, 'role', 'authenticated')::text, true);
  select count(*) into v_count from public.pets where id = v_pet;
  if v_count <> 1 then raise exception 'owner cannot read own pet'; end if;
  select count(*) into v_count from public.pet_ownerships where pet_id = v_pet;
  if v_count <> 1 then raise exception 'owner cannot read own ownership'; end if;
  select count(*) into v_count from public.pet_contacts where pet_id = v_pet;
  if v_count <> 1 then raise exception 'owner cannot read own contact'; end if;
  select count(*) into v_count from public.pet_documents where pet_id = v_pet;
  if v_count <> 1 then raise exception 'owner cannot read own photo metadata'; end if;

  perform set_config('request.jwt.claim.sub', v_other::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', v_other, 'role', 'authenticated')::text, true);
  select count(*) into v_count from public.pets where id = v_pet;
  if v_count <> 0 then raise exception 'another account read pet'; end if;
  select count(*) into v_count from public.pet_ownerships where pet_id = v_pet;
  if v_count <> 0 then raise exception 'another account read ownership'; end if;
  select count(*) into v_count from public.pet_contacts where pet_id = v_pet;
  if v_count <> 0 then raise exception 'another account read contact'; end if;
  select count(*) into v_count from public.pet_documents where pet_id = v_pet;
  if v_count <> 0 then raise exception 'another account read photo metadata'; end if;

  perform set_config('role', 'anon', true);
  perform set_config('request.jwt.claim.sub', '', true);
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  begin
    execute 'select count(*) from public.pets where id = $1' into v_count using v_pet;
    if v_count <> 0 then raise exception 'visitor read pet'; end if;
  exception when insufficient_privilege then
    v_anon_denied := true;
  end;
  if not v_anon_denied then raise exception 'visitor unexpectedly has table access'; end if;

  raise notice 'PASS: owner reads; another account is filtered; visitor is denied';
end
$test$;

rollback;
