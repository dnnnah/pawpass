-- Deletion is explicit and limited to the active, verified administrator.
-- Related pet records already have ON DELETE CASCADE foreign keys. Files are
-- removed through the authenticated Storage API before removing this row.
drop policy if exists pets_admin_delete on public.pets;
create policy pets_admin_delete on public.pets
  for delete to authenticated
  using (private.administra_mascota(id));
grant delete on public.pets to authenticated;
