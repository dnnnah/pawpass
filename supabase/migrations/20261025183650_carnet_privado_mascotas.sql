-- Owner-managed carnet data. The emergency note remains private until the QR route explicitly exposes it.
alter table public.pet_health
  add column nota_cuidados_emergencia text,
  add constraint pet_health_nota_cuidados_emergencia_check
    check (nota_cuidados_emergencia is null or char_length(nota_cuidados_emergencia) <= 2000);

comment on column public.pet_health.nota_cuidados_emergencia is
  'Nota escrita por el dueño para cuidados de emergencia; su lectura ordinaria queda bajo RLS de tutores.';

-- File metadata must always carry the byte count checked by its Storage bucket.
alter table public.pet_documents
  alter column tamano_bytes set not null;

-- Only the administrator may edit identifying data on the pet row.
drop policy if exists pets_tutor_update on public.pets;
create policy pets_admin_update
  on public.pets
  for update
  to authenticated
  using (private.administra_mascota(id))
  with check (private.administra_mascota(id));
