-- Hope's & Go shared launch database
-- Run this once in Supabase: SQL Editor > New query > paste > Run.

create table if not exists public.service_requests (
  id uuid primary key default gen_random_uuid(),
  request_type text not null check (request_type in ('delivery', 'grocery', 'custom', 'after_hours')),
  status text not null default 'waiting' check (status in ('waiting', 'accepted', 'picked_up', 'dropped_off', 'completed', 'cancelled')),
  customer_details jsonb not null default '{}'::jsonb,
  pickup_details jsonb not null default '{}'::jsonb,
  dropoff_details jsonb not null default '{}'::jsonb,
  pricing_details jsonb not null default '{}'::jsonb,
  accepted_by text,
  accepted_at timestamptz,
  picked_up_at timestamptz,
  dropped_off_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.request_messages (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.service_requests(id) on delete cascade,
  sender_type text not null check (sender_type in ('customer', 'driver', 'owner')),
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

create table if not exists public.driver_location_events (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.service_requests(id) on delete cascade,
  driver_username text not null,
  latitude numeric(9,6) not null,
  longitude numeric(9,6) not null,
  recorded_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists service_requests_set_updated_at on public.service_requests;
create trigger service_requests_set_updated_at
before update on public.service_requests
for each row execute function public.set_updated_at();

alter table public.service_requests enable row level security;
alter table public.request_messages enable row level security;
alter table public.driver_location_events enable row level security;

-- There are deliberately no browser-access policies here. The app server will
-- use a private Supabase secret stored in its own environment to protect names,
-- addresses, messages, and active location data.
