-- Run this in your Supabase project's SQL Editor (Dashboard > SQL Editor > New query)

create table if not exists receipts (
  id uuid primary key default gen_random_uuid(),
  receipt_no text not null unique,
  donor_name text,
  phone text,
  category text not null check (category in ('zakat', 'sadqa', 'general')),
  amount numeric not null check (amount > 0),
  method text not null default 'cash' check (method in ('cash', 'bank_transfer', 'other')),
  note text,
  created_at timestamptz not null default now()
);

-- Enable Row Level Security
alter table receipts enable row level security;

-- Since this app uses a shared passcode instead of per-user auth,
-- we allow the anon key to read/write. Keep your Supabase anon key
-- and app passcode private, and only give them to your teacher.
drop policy if exists "Allow anon read" on receipts;
create policy "Allow anon read" on receipts
  for select using (true);

drop policy if exists "Allow anon insert" on receipts;
create policy "Allow anon insert" on receipts
  for insert with check (true);

-- ============================================================
-- Migration: donor address + multi-category receipts
-- Run this block in the SQL Editor if your project already has
-- the "receipts" table from before (safe to re-run; idempotent).
-- ============================================================

alter table receipts add column if not exists donor_address text;

-- A receipt can now split its total across more than one category
-- (e.g. Rs. 5,000 zakat + Rs. 2,000 sadqa in a single receipt).
-- receipts.category / receipts.amount still hold a single category
-- label (when only one is used) and the grand total, so existing
-- code paths that only need the total keep working unchanged.
alter table receipts alter column category drop not null;

create table if not exists receipt_items (
  id uuid primary key default gen_random_uuid(),
  receipt_id uuid not null references receipts(id) on delete cascade,
  category text not null check (category in ('zakat', 'sadqa', 'general')),
  amount numeric not null check (amount > 0)
);

alter table receipt_items enable row level security;

drop policy if exists "Allow anon read items" on receipt_items;
create policy "Allow anon read items" on receipt_items
  for select using (true);

drop policy if exists "Allow anon insert items" on receipt_items;
create policy "Allow anon insert items" on receipt_items
  for insert with check (true);

-- Backfill: give every existing receipt a matching line item so
-- category totals can always be computed from receipt_items alone.
insert into receipt_items (receipt_id, category, amount)
select id, category, amount from receipts
where category is not null
  and not exists (
    select 1 from receipt_items where receipt_items.receipt_id = receipts.id
  );

-- ============================================================
-- create_receipt(): insert a receipt and all its category line
-- items in one atomic transaction. The app used to do this as two
-- separate REST calls, which could leave an orphan receipt (no
-- items) if the second call failed partway through.
-- ============================================================

create or replace function create_receipt(
  p_receipt_no text,
  p_donor_name text,
  p_donor_address text,
  p_phone text,
  p_method text,
  p_note text,
  p_items jsonb -- [{"category": "zakat", "amount": 1000}, ...]
) returns receipts
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_receipt receipts;
  v_total numeric;
  v_category text;
  v_item jsonb;
begin
  if jsonb_array_length(p_items) = 0 then
    raise exception 'At least one category amount is required';
  end if;

  select coalesce(sum((item->>'amount')::numeric), 0) into v_total
  from jsonb_array_elements(p_items) as item;

  if v_total <= 0 then
    raise exception 'Total amount must be greater than zero';
  end if;

  v_category := case when jsonb_array_length(p_items) = 1 then p_items->0->>'category' else null end;

  insert into receipts (receipt_no, donor_name, donor_address, phone, category, amount, method, note)
  values (p_receipt_no, p_donor_name, p_donor_address, p_phone, v_category, v_total, p_method, p_note)
  returning * into v_receipt;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    insert into receipt_items (receipt_id, category, amount)
    values (v_receipt.id, v_item->>'category', (v_item->>'amount')::numeric);
  end loop;

  return v_receipt;
end;
$$;

grant execute on function create_receipt(text, text, text, text, text, text, jsonb) to anon;

-- ============================================================
-- Migration: Fiqh-based donation categories
-- Replaces the generic "sadqa" / "general" categories with the
-- specific types used on the organization's receipt book: Zakat,
-- Fitra, Ushr, Sadaqat-e-Wajiba, Sadaqat-e-Nafila. Old "sadqa" and
-- "general" values are kept allowed so existing receipts remain
-- valid; the app itself no longer offers them for new receipts.
-- ============================================================

alter table receipts drop constraint if exists receipts_category_check;
alter table receipts add constraint receipts_category_check
  check (category in ('zakat', 'fitra', 'ushr', 'sadaqat_wajiba', 'sadaqat_nafila', 'sadqa', 'general'));

alter table receipt_items drop constraint if exists receipt_items_category_check;
alter table receipt_items add constraint receipt_items_category_check
  check (category in ('zakat', 'fitra', 'ushr', 'sadaqat_wajiba', 'sadaqat_nafila', 'sadqa', 'general'));
