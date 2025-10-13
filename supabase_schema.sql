-- Motrac Service Portaal • Supabase schema
-- Dit script richt de volledige database in (tabellen, views, policies en hulpmiddelen)
-- voor zowel lezen als schrijven via de Supabase JavaScript client.

-- Vereiste extensies --------------------------------------------------------
create extension if not exists "pgcrypto";

-- Custom enums --------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'bmw_status') then
    create type public.bmw_status as enum ('Goedgekeurd', 'Afkeur', 'In_beoordeling');
  end if;

  if not exists (select 1 from pg_type where typname = 'activity_status') then
    create type public.activity_status as enum ('Open', 'Afgerond');
  end if;

  if not exists (select 1 from pg_type where typname = 'activity_type') then
    create type public.activity_type as enum ('Onderhoud', 'Storing', 'Schade', 'Inspectie');
  end if;

  if not exists (select 1 from pg_type where typname = 'motrac_service_portaal_role') then
    create type public.motrac_service_portaal_role as enum ('Beheerder', 'Gebruiker', 'Gast');
  end if;

  if exists (select 1 from pg_type where typname = 'motrac_service_portaal_role') then
    begin
      alter type public.motrac_service_portaal_role add value if not exists 'Klant';
    exception
      when duplicate_object then null;
    end;
  end if;
end;
$$;

-- Tabellen -----------------------------------------------------------------
create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.customer_fleets (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.fleet_assets (
  id text primary key,
  reference text,
  model text not null,
  bmw_status public.bmw_status not null default 'Goedgekeurd',
  bmw_expiry date,
  odo integer,
  odo_date date,
  location_id uuid not null references public.locations(id) on delete restrict,
  customer_fleet_id uuid references public.customer_fleets(id) on delete set null,
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create or replace function public.set_updated_at()
returns trigger as
$$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$ language plpgsql;

drop trigger if exists update_customer_fleets_timestamp on public.customer_fleets;
create trigger update_customer_fleets_timestamp
before update on public.customer_fleets
for each row
execute function public.set_updated_at();

drop trigger if exists update_fleet_assets_timestamp on public.fleet_assets;
create trigger update_fleet_assets_timestamp
before update on public.fleet_assets
for each row
execute function public.set_updated_at();

alter table if exists public.fleet_assets
  add column if not exists customer_fleet_id uuid references public.customer_fleets(id) on delete set null;

create table if not exists public.fleet_contracts (
  id uuid primary key default gen_random_uuid(),
  fleet_id text not null references public.fleet_assets(id) on delete cascade,
  contract_number text not null,
  start_date date not null,
  end_date date,
  hours_per_year integer,
  contract_type text,
  model text,
  created_at timestamptz not null default timezone('utc', now()),
  unique (fleet_id)
);

create table if not exists public.fleet_activity (
  id uuid primary key default gen_random_uuid(),
  fleet_id text not null references public.fleet_assets(id) on delete cascade,
  activity_code text not null,
  activity_type public.activity_type not null,
  description text,
  status public.activity_status not null default 'Open',
  activity_date date not null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (fleet_id, activity_code)
);

create table if not exists public.motrac_service_portaal_profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  display_name text not null,
  email text not null unique,
  phone text,
  role public.motrac_service_portaal_role not null default 'Gebruiker',
  default_location_id uuid references public.locations(id) on delete set null,
  last_sign_in_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists update_motrac_profiles_timestamp on public.motrac_service_portaal_profiles;
create trigger update_motrac_profiles_timestamp
before update on public.motrac_service_portaal_profiles
for each row
execute function public.set_updated_at();

create or replace function public.sync_motrac_profile_from_auth()
returns trigger
language plpgsql
security definer
set search_path = public
as
$$
declare
  resolved_email text;
  resolved_name text;
begin
  resolved_email := coalesce(new.email, new.raw_user_meta_data ->> 'email');
  resolved_name := coalesce(new.raw_user_meta_data ->> 'full_name', resolved_email);

  if resolved_email is null then
    return new;
  end if;

  insert into public.motrac_service_portaal_profiles (auth_user_id, display_name, email)
  values (new.id, coalesce(resolved_name, resolved_email), resolved_email)
  on conflict (auth_user_id) do update
    set display_name = excluded.display_name,
        email = excluded.email;

  return new;
end;
$$;

drop trigger if exists sync_motrac_profile_from_auth on auth.users;
create trigger sync_motrac_profile_from_auth
after insert or update on auth.users
for each row
execute function public.sync_motrac_profile_from_auth();

create table if not exists public.motrac_service_portaal_location_memberships (
  profile_id uuid references public.motrac_service_portaal_profiles(id) on delete cascade,
  location_id uuid references public.locations(id) on delete cascade,
  is_primary boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (profile_id, location_id)
);

create unique index if not exists motrac_service_portaal_location_memberships_primary_unique
  on public.motrac_service_portaal_location_memberships (profile_id)
  where is_primary;

drop trigger if exists update_motrac_memberships_timestamp on public.motrac_service_portaal_location_memberships;
create trigger update_motrac_memberships_timestamp
before update on public.motrac_service_portaal_location_memberships
for each row
execute function public.set_updated_at();

create table if not exists public.motrac_service_portaal_fleet_memberships (
  profile_id uuid references public.motrac_service_portaal_profiles(id) on delete cascade,
  customer_fleet_id uuid references public.customer_fleets(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (profile_id, customer_fleet_id)
);

drop trigger if exists update_motrac_fleet_memberships_timestamp on public.motrac_service_portaal_fleet_memberships;
create trigger update_motrac_fleet_memberships_timestamp
before update on public.motrac_service_portaal_fleet_memberships
for each row
execute function public.set_updated_at();

create or replace function public.touch_portal_profile_last_sign_in()
returns void
language plpgsql
security definer
set search_path = public
as
$$
begin
  update public.motrac_service_portaal_profiles
  set
    last_sign_in_at = timezone('utc', now()),
    updated_at = timezone('utc', now())
  where auth_user_id = auth.uid();
end;
$$;

-- Row Level Security --------------------------------------------------------
alter table public.locations enable row level security;
alter table public.customer_fleets enable row level security;
alter table public.fleet_assets enable row level security;
alter table public.fleet_contracts enable row level security;
alter table public.fleet_activity enable row level security;
alter table public.motrac_service_portaal_profiles enable row level security;
alter table public.motrac_service_portaal_location_memberships enable row level security;
alter table public.motrac_service_portaal_fleet_memberships enable row level security;

-- Toegangsbeleid ------------------------------------------------------------
drop policy if exists "Public select on locations" on public.locations;
drop policy if exists "Authenticated write locations" on public.locations;
drop policy if exists "Portal read locations" on public.locations;
drop policy if exists "Service role manage locations" on public.locations;
create policy "Portal read locations"
  on public.locations
  for select
  using (auth.role() in ('authenticated', 'service_role'));
create policy "Service role manage locations"
  on public.locations
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists "Public select on fleet assets" on public.fleet_assets;
drop policy if exists "Authenticated write fleet assets" on public.fleet_assets;
drop policy if exists "Portal read customer fleets" on public.customer_fleets;
drop policy if exists "Service role manage customer fleets" on public.customer_fleets;
create policy "Portal read customer fleets"
  on public.customer_fleets
  for select
  using (
    auth.role() = 'service_role'
    or exists (
      select 1
      from public.motrac_service_portaal_profiles profile
      where profile.auth_user_id = auth.uid()
        and profile.role in ('Beheerder', 'Gebruiker')
    )
    or exists (
      select 1
      from public.motrac_service_portaal_profiles profile
      join public.motrac_service_portaal_fleet_memberships membership on membership.profile_id = profile.id
      where profile.auth_user_id = auth.uid()
        and membership.customer_fleet_id = customer_fleets.id
    )
  );
create policy "Service role manage customer fleets"
  on public.customer_fleets
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists "Portal read fleet assets" on public.fleet_assets;
drop policy if exists "Service role manage fleet assets" on public.fleet_assets;
create policy "Portal read fleet assets"
  on public.fleet_assets
  for select
  using (
    auth.role() = 'service_role'
    or exists (
      select 1
      from public.motrac_service_portaal_profiles profile
      left join public.motrac_service_portaal_fleet_memberships membership on membership.profile_id = profile.id
      where profile.auth_user_id = auth.uid()
        and (
          profile.role in ('Beheerder', 'Gebruiker')
          or (membership.customer_fleet_id is not null and membership.customer_fleet_id = public.fleet_assets.customer_fleet_id)
        )
    )
  );
create policy "Service role manage fleet assets"
  on public.fleet_assets
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists "Public select on fleet contracts" on public.fleet_contracts;
drop policy if exists "Authenticated write fleet contracts" on public.fleet_contracts;
drop policy if exists "Portal read fleet contracts" on public.fleet_contracts;
drop policy if exists "Service role manage fleet contracts" on public.fleet_contracts;
create policy "Portal read fleet contracts"
  on public.fleet_contracts
  for select
  using (
    auth.role() = 'service_role'
    or exists (
      select 1
      from public.motrac_service_portaal_profiles profile
      left join public.motrac_service_portaal_fleet_memberships membership on membership.profile_id = profile.id
      join public.fleet_assets asset on asset.id = public.fleet_contracts.fleet_id
      where profile.auth_user_id = auth.uid()
        and (
          profile.role in ('Beheerder', 'Gebruiker')
          or (membership.customer_fleet_id is not null and membership.customer_fleet_id = asset.customer_fleet_id)
        )
    )
  );
create policy "Service role manage fleet contracts"
  on public.fleet_contracts
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists "Public select on fleet activity" on public.fleet_activity;
drop policy if exists "Authenticated write fleet activity" on public.fleet_activity;
drop policy if exists "Portal read fleet activity" on public.fleet_activity;
drop policy if exists "Service role manage fleet activity" on public.fleet_activity;
create policy "Portal read fleet activity"
  on public.fleet_activity
  for select
  using (
    auth.role() = 'service_role'
    or exists (
      select 1
      from public.motrac_service_portaal_profiles profile
      left join public.motrac_service_portaal_fleet_memberships membership on membership.profile_id = profile.id
      join public.fleet_assets asset on asset.id = public.fleet_activity.fleet_id
      where profile.auth_user_id = auth.uid()
        and (
          profile.role in ('Beheerder', 'Gebruiker')
          or (membership.customer_fleet_id is not null and membership.customer_fleet_id = asset.customer_fleet_id)
        )
    )
  );
create policy "Service role manage fleet activity"
  on public.fleet_activity
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists "Public select on profiles" on public.motrac_service_portaal_profiles;
drop policy if exists "Authenticated write profiles" on public.motrac_service_portaal_profiles;
drop policy if exists "Portal read profiles" on public.motrac_service_portaal_profiles;
drop policy if exists "Users manage own profile" on public.motrac_service_portaal_profiles;
drop policy if exists "Service role manage profiles" on public.motrac_service_portaal_profiles;
create policy "Portal read profiles"
  on public.motrac_service_portaal_profiles
  for select
  using (
    auth.role() = 'service_role'
    or auth.uid() = auth_user_id
    or exists (
      select 1
      from public.motrac_service_portaal_profiles requester
      where requester.auth_user_id = auth.uid()
        and requester.role in ('Beheerder', 'Gebruiker')
    )
  );
create policy "Users manage own profile"
  on public.motrac_service_portaal_profiles
  for update
  using (auth.uid() = auth_user_id)
  with check (auth.uid() = auth_user_id);
create policy "Service role manage profiles"
  on public.motrac_service_portaal_profiles
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists "Public select on profile memberships" on public.motrac_service_portaal_location_memberships;
drop policy if exists "Authenticated write profile memberships" on public.motrac_service_portaal_location_memberships;
drop policy if exists "Portal read profile memberships" on public.motrac_service_portaal_location_memberships;
drop policy if exists "Service role manage profile memberships" on public.motrac_service_portaal_location_memberships;
create policy "Portal read profile memberships"
  on public.motrac_service_portaal_location_memberships
  for select
  using (
    auth.role() = 'service_role'
    or exists (
      select 1
      from public.motrac_service_portaal_profiles profile
      where profile.id = public.motrac_service_portaal_location_memberships.profile_id
        and profile.auth_user_id = auth.uid()
    )
  );
create policy "Service role manage profile memberships"
  on public.motrac_service_portaal_location_memberships
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists "Portal read fleet memberships" on public.motrac_service_portaal_fleet_memberships;
drop policy if exists "Service role manage fleet memberships" on public.motrac_service_portaal_fleet_memberships;
create policy "Portal read fleet memberships"
  on public.motrac_service_portaal_fleet_memberships
  for select
  using (
    auth.role() = 'service_role'
    or exists (
      select 1
      from public.motrac_service_portaal_profiles profile
      where profile.auth_user_id = auth.uid()
        and (
          profile.role in ('Beheerder', 'Gebruiker')
          or profile.id = public.motrac_service_portaal_fleet_memberships.profile_id
        )
    )
  );
create policy "Service role manage fleet memberships"
  on public.motrac_service_portaal_fleet_memberships
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop view if exists public.motrac_service_portaal_user_directory;
create view public.motrac_service_portaal_user_directory as
select
  profile.id,
  profile.auth_user_id,
  profile.display_name,
  profile.email,
  profile.phone,
  profile.role,
  profile.default_location_id,
  coalesce(loc.name, 'Onbekende locatie') as default_location_name,
  profile.last_sign_in_at
from public.motrac_service_portaal_profiles profile
left join public.locations loc on loc.id = profile.default_location_id;

drop view if exists public.locations_with_all;
create view public.locations_with_all as
select '00000000-0000-0000-0000-000000000000'::uuid as id,
       'Alle locaties'::text as name
union all
select id, name from public.locations;

drop view if exists public.fleet_assets_overview;
create view public.fleet_assets_overview as
select
  asset.id,
  asset.reference,
  asset.model,
  asset.bmw_status,
  asset.bmw_expiry,
  asset.odo,
  asset.odo_date,
  asset.active,
  asset.customer_fleet_id,
  fleet.name as customer_fleet_name,
  loc.name as location_name,
  coalesce(contract_data.contract, '{}'::jsonb) as contract,
  coalesce(activity_data.activity, '[]'::jsonb) as activity
from public.fleet_assets asset
left join public.customer_fleets fleet on fleet.id = asset.customer_fleet_id
left join public.locations loc on loc.id = asset.location_id
left join lateral (
  select to_jsonb(fc.*) - 'id' - 'fleet_id' - 'created_at' as contract
  from public.fleet_contracts fc
  where fc.fleet_id = asset.id
) contract_data on true
left join lateral (
  select jsonb_agg(
    jsonb_build_object(
      'activity_code', fa.activity_code,
      'activity_type', fa.activity_type,
      'description', fa.description,
      'status', fa.status,
      'activity_date', fa.activity_date
    )
    order by fa.activity_date desc, fa.created_at desc
  ) as activity
  from public.fleet_activity fa
  where fa.fleet_id = asset.id
) activity_data on true;

drop view if exists public.motrac_service_portaal_profile_fleet_memberships;
create view public.motrac_service_portaal_profile_fleet_memberships as
select
  membership.profile_id,
  membership.customer_fleet_id,
  coalesce(fleet.name, 'Onbekende vloot') as customer_fleet_name
from public.motrac_service_portaal_fleet_memberships membership
left join public.customer_fleets fleet on fleet.id = membership.customer_fleet_id;

-- Seeds (optioneel) --------------------------------------------------------
-- insert into public.locations (name) values
--   ('Demovloot Motrac – Almere'),
--   ('Demovloot Motrac – Venlo'),
--   ('Demovloot Motrac – Zwijndrecht');
