-- Run this in Supabase Dashboard > SQL Editor to enable deleting one receipt
-- from the dashboard. receipt_items are removed by the foreign-key cascade.
create or replace function public.delete_receipt(p_receipt_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_deleted integer;
begin
  delete from public.receipts where id = p_receipt_id;
  get diagnostics v_deleted = row_count;
  return v_deleted = 1;
end;
$$;

revoke all on function public.delete_receipt(uuid) from public;
grant execute on function public.delete_receipt(uuid) to anon;

notify pgrst, 'reload schema';
