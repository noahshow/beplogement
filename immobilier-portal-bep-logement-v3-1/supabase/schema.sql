-- =========================
-- Extensions
-- =========================
create extension if not exists "pgcrypto";

-- =========================
-- Tables
-- =========================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null check (role in ('client','agent','admin')) default 'client',
  created_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  status text not null check (status in ('active','inactive','expired')) default 'active',
  paid_amount_eur integer not null default 210,
  starts_at date not null default current_date,
  ends_at date,
  created_at timestamptz not null default now()
);

create table if not exists public.search_criteria (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null unique references public.profiles(id) on delete cascade,
  city text,
  radius_km integer not null default 0,
  min_price integer,
  max_price integer,
  min_surface integer,
  min_rooms integer,
  property_types text[] default array[]::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  city text not null,
  zip text,
  price integer,
  surface integer,
  rooms integer,
  type text,
  status text not null check (status in ('active','rented','archived')) default 'active',
  -- owner contact (SENSITIVE)
  owner_name text,
  owner_phone text,
  owner_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.property_images (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  path text not null,
  order_index integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.contact_requests (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  status text not null check (status in ('pending','approved','rejected')) default 'pending',
  decided_by uuid references public.profiles(id),
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  unique (client_id, property_id)
);

-- =========================
-- Updated_at triggers
-- =========================
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_search_criteria_updated_at on public.search_criteria;
create trigger set_search_criteria_updated_at
before update on public.search_criteria
for each row execute function public.set_updated_at();

drop trigger if exists set_properties_updated_at on public.properties;
create trigger set_properties_updated_at
before update on public.properties
for each row execute function public.set_updated_at();

-- =========================
-- Helper functions
-- =========================
create or replace function public.is_agent()
returns boolean as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('agent','admin')
  );
$$ language sql stable;

create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$ language sql stable;

create or replace function public.subscription_active(_client_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.subscriptions s
    where s.client_id = _client_id
      and s.status = 'active'
      and (s.ends_at is null or s.ends_at >= current_date)
  );
$$ language sql stable;

-- A view that exposes properties WITHOUT owner contact to clients.
create or replace view public.properties_public as
select
  p.id, p.title, p.description, p.city, p.zip, p.price, p.surface, p.rooms, p.type, p.status, p.created_at, p.updated_at
from public.properties p;

-- A view for client to see owner contact only when approved
create or replace view public.approved_owner_contacts as
select
  cr.client_id,
  cr.property_id,
  p.owner_name,
  p.owner_phone,
  p.owner_email
from public.contact_requests cr
join public.properties p on p.id = cr.property_id
where cr.status = 'approved';

-- =========================
-- RLS
-- =========================
alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.search_criteria enable row level security;
alter table public.properties enable row level security;
alter table public.property_images enable row level security;
alter table public.contact_requests enable row level security;

-- PROFILES
drop policy if exists "profiles self read" on public.profiles;
create policy "profiles self read"
on public.profiles for select
using (id = auth.uid() or public.is_agent());

drop policy if exists "profiles self update" on public.profiles;
create policy "profiles self update"
on public.profiles for update
using (id = auth.uid() or public.is_agent())
with check (id = auth.uid() or public.is_agent());

-- SUBSCRIPTIONS
drop policy if exists "subscriptions agent all" on public.subscriptions;
create policy "subscriptions agent all"
on public.subscriptions for all
using (public.is_agent())
with check (public.is_agent());

drop policy if exists "subscriptions client read own" on public.subscriptions;
create policy "subscriptions client read own"
on public.subscriptions for select
using (client_id = auth.uid());

-- SEARCH CRITERIA
drop policy if exists "criteria agent all" on public.search_criteria;
create policy "criteria agent all"
on public.search_criteria for all
using (public.is_agent())
with check (public.is_agent());

drop policy if exists "criteria client read own" on public.search_criteria;
create policy "criteria client read own"
on public.search_criteria for select
using (client_id = auth.uid());

-- PROPERTIES
drop policy if exists "properties agent all" on public.properties;
create policy "properties agent all"
on public.properties for all
using (public.is_agent())
with check (public.is_agent());

-- Clients can select only public fields via view; direct select from table is denied by default (no policy)

-- PROPERTY IMAGES
drop policy if exists "images agent all" on public.property_images;
create policy "images agent all"
on public.property_images for all
using (public.is_agent())
with check (public.is_agent());

drop policy if exists "images client read for active properties" on public.property_images;
create policy "images client read for active properties"
on public.property_images for select
using (
  exists(select 1 from public.properties p where p.id = property_id and p.status='active')
);

-- CONTACT REQUESTS
drop policy if exists "requests client read own" on public.contact_requests;
create policy "requests client read own"
on public.contact_requests for select
using (client_id = auth.uid());

drop policy if exists "requests client create own" on public.contact_requests;
create policy "requests client create own"
on public.contact_requests for insert
with check (
  client_id = auth.uid()
  and public.subscription_active(auth.uid())
);

drop policy if exists "requests agent update" on public.contact_requests;
create policy "requests agent update"
on public.contact_requests for update
using (public.is_agent())
with check (public.is_agent());

drop policy if exists "requests agent read" on public.contact_requests;
create policy "requests agent read"
on public.contact_requests for select
using (public.is_agent());

-- =========================
-- Views security (grant)
-- =========================
grant select on public.properties_public to anon, authenticated;
grant select on public.approved_owner_contacts to authenticated;

-- Optional: Storage policies (run in SQL editor if you want)
-- NOTE: Supabase Storage policies are managed in Dashboard > Storage > Policies.
