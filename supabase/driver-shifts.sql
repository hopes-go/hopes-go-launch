-- Run this second query in Supabase after schema.sql.
-- It securely records who is clocked in so customers see real availability.

create table if not exists public.driver_shifts (
  driver_username text primary key,
  clocked_in boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.driver_shifts enable row level security;
