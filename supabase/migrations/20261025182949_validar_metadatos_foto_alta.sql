-- Reject incomplete or malformed photo metadata before creating any pet rows.
create or replace function private.crear_mascota(
  p_nombre text,
  p_especie text,
  p_nacimiento date,
  p_medio_contacto text,
  p_valor_contacto text,
  p_foto_nombre text,
  p_foto_mime text,
  p_foto_tamano bigint
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user uuid := private.usuario_verificado();
  v_pet uuid;
  v_document uuid;
  v_photo_path text;
  v_contact text := btrim(coalesce(p_valor_contacto, ''));
  v_photo_name text := btrim(coalesce(p_foto_nombre, ''));
  v_email text;
  v_public_code text;
begin
  if p_especie not in ('perro', 'gato') then
    raise exception 'Especie inválida' using errcode = '22023';
  end if;
  if p_nacimiento > current_date then
    raise exception 'La fecha de nacimiento no puede ser futura' using errcode = '22023';
  end if;
  if p_nacimiento is null then
    raise exception 'La fecha de nacimiento es obligatoria' using errcode = '22023';
  end if;
  if char_length(btrim(coalesce(p_nombre, ''))) not between 1 and 120 then
    raise exception 'El nombre debe tener entre 1 y 120 caracteres' using errcode = '22023';
  end if;

  if p_medio_contacto in ('phone', 'whatsapp') then
    if v_contact !~ '^\+?[0-9]{10,15}$' then
      raise exception 'El teléfono de contacto no es válido' using errcode = '22023';
    end if;
  elsif p_medio_contacto = 'email' then
    if char_length(v_contact) > 254 or v_contact !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
      raise exception 'El correo de contacto no es válido' using errcode = '22023';
    end if;
    v_email := lower(v_contact);
  else
    raise exception 'Selecciona un medio de contacto válido' using errcode = '22023';
  end if;

  if p_foto_mime is null
     or p_foto_mime not in ('image/jpeg', 'image/png', 'image/webp')
     or p_foto_tamano is null or p_foto_tamano < 1 or p_foto_tamano > 5242880
     or v_photo_name = '' or char_length(v_photo_name) > 200 then
    raise exception 'La foto debe ser JPEG, PNG o WebP y pesar hasta 5 MiB' using errcode = '22023';
  end if;

  v_public_code := 'PC-' || upper(replace(gen_random_uuid()::text, '-', '')) || '-001';
  insert into public.pets(codigo_publico, nombre, especie, fecha_nacimiento)
  values (v_public_code, btrim(p_nombre), p_especie, p_nacimiento)
  returning id into v_pet;

  insert into public.pet_ownerships(pet_id, user_id, rol)
  values (v_pet, v_user, 'administrador');

  insert into public.pet_contacts(pet_id, telefono_principal, whatsapp, email)
  values (
    v_pet,
    case when p_medio_contacto = 'phone' then v_contact else null end,
    case when p_medio_contacto = 'whatsapp' then v_contact else null end,
    v_email
  );

  insert into public.pet_privacy(pet_id) values (v_pet);

  insert into public.pet_documents(
    pet_id, nombre, categoria, tipo, bucket_id, mime_type, tamano_bytes, visible_publico
  ) values (
    v_pet, v_photo_name, 'foto', 'imagen', 'pawpass-fotos', p_foto_mime, p_foto_tamano, false
  ) returning id, object_path into v_document, v_photo_path;

  return jsonb_build_object(
    'petId', v_pet,
    'documentId', v_document,
    'objectPath', v_photo_path,
    'publicCode', v_public_code
  );
end
$function$;
