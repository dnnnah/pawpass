-- Registros privados de desparasitación y consultas médicas.
-- El proyecto conectado ya tiene este esquema; IF NOT EXISTS permite usar
-- esta migración también para reconstruir entornos locales que parten del
-- esquema base sin estos historiales.
create table if not exists public.pet_dewormings (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets(id) on delete cascade,
  producto text not null check (char_length(btrim(producto)) between 1 and 200),
  fecha date not null,
  proxima_fecha date,
  dosis text check (char_length(dosis) <= 200),
  veterinario text check (char_length(veterinario) <= 200),
  origen text check (char_length(origen) <= 120),
  visible_publico boolean not null default false,
  documento_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pet_dewormings_next_date_check check (proxima_fecha is null or proxima_fecha >= fecha),
  constraint pet_dewormings_pet_id_documento_id_fkey
    foreign key (pet_id, documento_id) references public.pet_documents(pet_id, id)
);

create table if not exists public.pet_consultations (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets(id) on delete cascade,
  fecha date not null,
  motivo text not null check (char_length(btrim(motivo)) between 1 and 2000),
  diagnostico text check (char_length(diagnostico) <= 8000),
  tratamiento text check (char_length(tratamiento) <= 8000),
  medicamentos text[] not null default '{}',
  veterinario text check (char_length(veterinario) <= 200),
  origen text check (char_length(origen) <= 120),
  visible_publico boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pet_consultations_medications_check
    check (cardinality(medicamentos) <= 100 and octet_length(medicamentos::text) <= 12000),
  constraint pet_consultations_pet_id_id_key unique (pet_id, id)
);

create table if not exists public.consultation_documents (
  pet_id uuid not null references public.pets(id) on delete cascade,
  consultation_id uuid not null,
  document_id uuid not null,
  primary key (consultation_id, document_id),
  constraint consultation_documents_pet_id_consultation_id_fkey
    foreign key (pet_id, consultation_id) references public.pet_consultations(pet_id, id) on delete cascade,
  constraint consultation_documents_pet_id_document_id_fkey
    foreign key (pet_id, document_id) references public.pet_documents(pet_id, id)
);

create index if not exists pet_dewormings_pet_date_idx
  on public.pet_dewormings (pet_id, fecha desc);
create index if not exists pet_consultations_pet_date_idx
  on public.pet_consultations (pet_id, fecha desc);

alter table public.pet_dewormings enable row level security;
alter table public.pet_consultations enable row level security;
alter table public.consultation_documents enable row level security;

drop policy if exists pet_dewormings_select on public.pet_dewormings;
create policy pet_dewormings_select on public.pet_dewormings
  for select to authenticated using (private.es_tutor(pet_id));
drop policy if exists pet_dewormings_insert on public.pet_dewormings;
create policy pet_dewormings_insert on public.pet_dewormings
  for insert to authenticated with check (private.administra_mascota(pet_id));
drop policy if exists pet_dewormings_update on public.pet_dewormings;
create policy pet_dewormings_update on public.pet_dewormings
  for update to authenticated using (private.administra_mascota(pet_id)) with check (private.administra_mascota(pet_id));
drop policy if exists pet_dewormings_delete on public.pet_dewormings;
create policy pet_dewormings_delete on public.pet_dewormings
  for delete to authenticated using (private.administra_mascota(pet_id));

drop policy if exists pet_consultations_select on public.pet_consultations;
create policy pet_consultations_select on public.pet_consultations
  for select to authenticated using (private.es_tutor(pet_id));
drop policy if exists pet_consultations_insert on public.pet_consultations;
create policy pet_consultations_insert on public.pet_consultations
  for insert to authenticated with check (private.administra_mascota(pet_id));
drop policy if exists pet_consultations_update on public.pet_consultations;
create policy pet_consultations_update on public.pet_consultations
  for update to authenticated using (private.administra_mascota(pet_id)) with check (private.administra_mascota(pet_id));
drop policy if exists pet_consultations_delete on public.pet_consultations;
create policy pet_consultations_delete on public.pet_consultations
  for delete to authenticated using (private.administra_mascota(pet_id));

drop policy if exists consultation_documents_select on public.consultation_documents;
create policy consultation_documents_select on public.consultation_documents
  for select to authenticated using (private.es_tutor(pet_id));
drop policy if exists consultation_documents_insert on public.consultation_documents;
create policy consultation_documents_insert on public.consultation_documents
  for insert to authenticated with check (private.administra_mascota(pet_id));
drop policy if exists consultation_documents_update on public.consultation_documents;
create policy consultation_documents_update on public.consultation_documents
  for update to authenticated using (private.administra_mascota(pet_id)) with check (private.administra_mascota(pet_id));
drop policy if exists consultation_documents_delete on public.consultation_documents;
create policy consultation_documents_delete on public.consultation_documents
  for delete to authenticated using (private.administra_mascota(pet_id));

grant select, insert, update, delete on public.pet_dewormings to authenticated;
grant select, insert, update, delete on public.pet_consultations to authenticated;
grant select, insert, update, delete on public.consultation_documents to authenticated;
