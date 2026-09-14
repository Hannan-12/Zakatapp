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
create policy "Allow anon read" on receipts
  for select using (true);

create policy "Allow anon insert" on receipts
  for insert with check (true);
