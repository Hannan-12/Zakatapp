-- Run this in Supabase Dashboard > SQL Editor to enable the dashboard's
-- "Clear all data" action without re-running the full application schema.
create or replace function public.clear_all_data()
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  delete from public.expenses where id is not null;
  delete from public.receipts where id is not null;
end;
$$;

revoke all on function public.clear_all_data() from public;
grant execute on function public.clear_all_data() to anon;

-- Make PostgREST see the newly created RPC immediately.
notify pgrst, 'reload schema';
