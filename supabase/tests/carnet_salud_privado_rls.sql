-- Regresión reversible del CRUD y RLS para salud privada. Ejecutar solo en
-- una base local/de desarrollo con el esquema PawPass completo.
begin;

do $test$
declare
  v_owner uuid := gen_random_uuid();
  v_tutor uuid := gen_random_uuid();
  v_other uuid := gen_random_uuid();
  v_pet uuid := gen_random_uuid();
  v_code text := 'PC-' || upper(replace(gen_random_uuid()::text, '-', '')) || '-001';
  v_deworming uuid;
  v_consultation uuid;
  v_document uuid;
  v_count integer;
  v_updated integer;
  v_anon_denied boolean := false;
begin
  insert into auth.users(id, aud, role, email, email_confirmed_at, created_at, updated_at)
  values
    (v_owner, 'authenticated', 'authenticated', v_owner::text || '@salud.invalid', now(), now(), now()),
    (v_tutor, 'authenticated', 'authenticated', v_tutor::text || '@salud.invalid', now(), now(), now()),
    (v_other, 'authenticated', 'authenticated', v_other::text || '@salud.invalid', now(), now(), now());

  insert into public.pets(id, codigo_publico, nombre, especie, fecha_nacimiento)
  values (v_pet, v_code, 'Mascota de prueba salud privada', 'gato', current_date - 300);
  insert into public.pet_ownerships(pet_id, user_id, rol)
  values (v_pet, v_owner, 'administrador'), (v_pet, v_tutor, 'tutor');
  insert into public.pet_documents(pet_id, nombre, categoria, tipo, bucket_id, mime_type, tamano_bytes)
  values (v_pet, 'Receta privada.pdf', 'salud', 'pdf', 'pawpass-documentos', 'application/pdf', 8)
  returning id into v_document;

  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', v_owner::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', v_owner, 'role', 'authenticated')::text, true);
  insert into public.pet_dewormings(pet_id, producto, fecha, proxima_fecha, dosis, veterinario, documento_id)
  values (v_pet, 'Producto de prueba', current_date - 10, current_date + 80, '1 tableta', 'Dra. Prueba', v_document)
  returning id into v_deworming;
  insert into public.pet_consultations(pet_id, fecha, motivo, diagnostico, tratamiento, medicamentos, veterinario)
  values (v_pet, current_date - 5, 'Consulta de prueba', 'Hallazgo de prueba', 'Reposo', array['Medicamento de prueba'], 'Dra. Prueba')
  returning id into v_consultation;
  insert into public.consultation_documents(pet_id, consultation_id, document_id)
  values (v_pet, v_consultation, v_document);
  select count(*) into v_count from public.pet_dewormings where id = v_deworming and not visible_publico;
  if v_count <> 1 then raise exception 'new dewormings must remain private by default'; end if;
  select count(*) into v_count from public.pet_consultations where id = v_consultation and not visible_publico;
  if v_count <> 1 then raise exception 'new consultations must remain private by default'; end if;
  update public.pet_dewormings set visible_publico = true where id = v_deworming and pet_id = v_pet;
  update public.pet_dewormings set visible_publico = false where id = v_deworming and pet_id = v_pet;
  update public.pet_dewormings set dosis = '2 tabletas' where id = v_deworming and pet_id = v_pet;
  get diagnostics v_updated = row_count;
  if v_updated <> 1 then raise exception 'administrator cannot update a deworming'; end if;
  update public.pet_consultations set tratamiento = 'Tratamiento actualizado' where id = v_consultation and pet_id = v_pet;
  get diagnostics v_updated = row_count;
  if v_updated <> 1 then raise exception 'administrator cannot update a consultation'; end if;

  perform set_config('request.jwt.claim.sub', v_tutor::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', v_tutor, 'role', 'authenticated')::text, true);
  select count(*) into v_count from public.pet_dewormings where id = v_deworming and dosis = '2 tabletas';
  if v_count <> 1 then raise exception 'active tutor cannot read dewormings'; end if;
  select count(*) into v_count from public.pet_consultations where id = v_consultation and tratamiento = 'Tratamiento actualizado';
  if v_count <> 1 then raise exception 'active tutor cannot read consultations'; end if;
  select count(*) into v_count from public.consultation_documents where consultation_id = v_consultation and document_id = v_document;
  if v_count <> 1 then raise exception 'active tutor cannot read consultation document links'; end if;
  update public.pet_dewormings set dosis = 'No autorizado' where id = v_deworming;
  get diagnostics v_updated = row_count;
  if v_updated <> 0 then raise exception 'non-administrator tutor edited a deworming'; end if;
  update public.pet_consultations set motivo = 'No autorizado' where id = v_consultation;
  get diagnostics v_updated = row_count;
  if v_updated <> 0 then raise exception 'non-administrator tutor edited a consultation'; end if;

  perform set_config('request.jwt.claim.sub', v_other::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', v_other, 'role', 'authenticated')::text, true);
  select count(*) into v_count from public.pet_dewormings where pet_id = v_pet;
  if v_count <> 0 then raise exception 'another account read private dewormings'; end if;
  select count(*) into v_count from public.pet_consultations where pet_id = v_pet;
  if v_count <> 0 then raise exception 'another account read private consultations'; end if;
  begin
    insert into public.pet_dewormings(pet_id, producto, fecha) values (v_pet, 'Intento externo', current_date);
    raise exception 'another account inserted a private deworming';
  exception when insufficient_privilege then
    null;
  end;

  perform set_config('request.jwt.claim.sub', v_owner::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', v_owner, 'role', 'authenticated')::text, true);
  delete from public.pet_dewormings where id = v_deworming and pet_id = v_pet;
  get diagnostics v_updated = row_count;
  if v_updated <> 1 then raise exception 'administrator cannot delete a deworming'; end if;
  delete from public.pet_consultations where id = v_consultation and pet_id = v_pet;
  get diagnostics v_updated = row_count;
  if v_updated <> 1 then raise exception 'administrator cannot delete a consultation'; end if;

  perform set_config('role', 'anon', true);
  perform set_config('request.jwt.claim.sub', '', true);
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  begin
    execute 'select count(*) from public.pet_consultations where pet_id = $1' into v_count using v_pet;
    if v_count <> 0 then raise exception 'visitor read private consultations'; end if;
  exception when insufficient_privilege then
    v_anon_denied := true;
  end;
  if not v_anon_denied then raise exception 'visitor unexpectedly has private health table access'; end if;

  raise notice 'PASS: administrator CRUD, active tutor read-only, other account and visitor denied';
end
$test$;

rollback;
