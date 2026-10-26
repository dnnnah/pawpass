-- Compatibility only: no changes to anonymous QR access.
-- QR básico accesible por código y modo público de rescate.

alter table public.pet_contacts
  add column if not exists medio_contacto_qr text;

update public.pet_contacts
set medio_contacto_qr = case
  when telefono_principal is not null and whatsapp is null and email is null then 'phone'
  when whatsapp is not null and telefono_principal is null and email is null then 'whatsapp'
  when email is not null and telefono_principal is null and whatsapp is null then 'email'
  else null
end
where medio_contacto_qr is null;

do $migration$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.pet_contacts'::regclass
      and conname = 'pet_contacts_medio_contacto_qr_check'
  ) then
    alter table public.pet_contacts
      add constraint pet_contacts_medio_contacto_qr_check
      check (
        medio_contacto_qr is null
        or (medio_contacto_qr = 'phone' and telefono_principal is not null)
        or (medio_contacto_qr = 'whatsapp' and whatsapp is not null)
        or (medio_contacto_qr = 'email' and email is not null)
      );
  end if;
end
$migration$;

create or replace function private.inferir_medio_contacto_qr()
returns trigger
language plpgsql
set search_path = ''
as $function$
begin
  if tg_op = 'INSERT' and new.medio_contacto_qr is null then
    new.medio_contacto_qr := case
      when new.telefono_principal is not null and new.whatsapp is null and new.email is null then 'phone'
      when new.whatsapp is not null and new.telefono_principal is null and new.email is null then 'whatsapp'
      when new.email is not null and new.telefono_principal is null and new.whatsapp is null then 'email'
      else null
    end;
  end if;
  return new;
end
$function$;

revoke all on function private.inferir_medio_contacto_qr() from public;

drop trigger if exists pet_contacts_inferir_medio_qr on public.pet_contacts;
create trigger pet_contacts_inferir_medio_qr
  before insert or update of telefono_principal, whatsapp, email, medio_contacto_qr
  on public.pet_contacts
  for each row execute function private.inferir_medio_contacto_qr();


-- Consent flag is private and starts closed for all existing pets.
alter table public.pets add column adopcion_publicada boolean not null default false;
