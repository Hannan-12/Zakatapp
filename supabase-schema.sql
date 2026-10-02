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
