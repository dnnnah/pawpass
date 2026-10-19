-- The public RPC is the only entry point for QR lookups. It must execute with
-- the function owner's privileges so the private implementation can remain
-- inaccessible to anon/authenticated clients.

create or replace function public.obtener_ficha_publica(p_codigo text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $function$
  select private.obtener_ficha_publica(p_codigo);
$function$;

revoke all on function private.obtener_ficha_publica(text) from public, anon, authenticated;
revoke all on function public.obtener_ficha_publica(text) from public;
grant execute on function public.obtener_ficha_publica(text) to anon, authenticated;
