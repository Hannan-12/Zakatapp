-- Run this in Supabase Dashboard > SQL Editor to enable the new
-- "کلی اختیار" category on an existing database.
alter table public.receipts drop constraint if exists receipts_category_check;
alter table public.receipts add constraint receipts_category_check
  check (category in ('zakat', 'fitra', 'ushr', 'sadaqat_wajiba', 'sadaqat_nafila', 'kulli_ikhtiyar', 'sadqa', 'general'));

alter table public.receipt_items drop constraint if exists receipt_items_category_check;
alter table public.receipt_items add constraint receipt_items_category_check
  check (category in ('zakat', 'fitra', 'ushr', 'sadaqat_wajiba', 'sadaqat_nafila', 'kulli_ikhtiyar', 'sadqa', 'general'));

alter table public.expenses drop constraint if exists expenses_category_check;
alter table public.expenses add constraint expenses_category_check
  check (category in ('zakat', 'fitra', 'ushr', 'sadaqat_wajiba', 'sadaqat_nafila', 'kulli_ikhtiyar', 'sadqa', 'general'));

notify pgrst, 'reload schema';
