-- Motrac Service Portaal • Supabase schema
-- Deze SQL maakt de tabellen aan die overeenkomen met de data-structuur
-- in de frontend (locaties, vloot, contracten, activiteiten en gebruikers).

-- Zorg dat de vereiste extensies beschikbaar zijn (Supabase heeft pgcrypto standaard beschikbaar).
create extension if not exists "pgcrypto";

-- Enumeraties voor consistente status- en rolegegevens.
create type public.bmw_status as enum ('Goedgekeurd', 'Afkeur', 'In_beoordeling');
create type public.activity_status as enum ('Open', 'Afgerond');
create type public.activity_type as enum ('Onderhoud', 'Storing', 'Schade', 'Inspectie');
create type public.motrac_service_portaal_role as enum ('Beheerder', 'Gebruiker', 'Gast');

-- Locaties waar assets en gebruikers aan gekoppeld zijn.
create table public.locations (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default timezone('utc', now())
);

-- Overzicht van alle heftrucks / voertuigen.
create table public.fleet_assets (
  id text primary key,
  reference text,
  model text not null,
  bmw_status public.bmw_status not null default 'Goedgekeurd',
  bmw_expiry date,
  odo integer,
  odo_date date,
  location_id uuid not null references public.locations(id) on delete restrict,
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- Functie om automatisch de updated_at kolom bij te werken.
create or replace function public.set_updated_at()
returns trigger as
$$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$ language plpgsql;

-- Houd de updated_at kolom automatisch bij.
create trigger update_fleet_assets_timestamp
before update on public.fleet_assets
for each row
execute function public.set_updated_at();

-- Contractinformatie behorend bij een asset (1-op-1).
create table public.fleet_contracts (
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

-- Historiek van meldingen / activiteiten per asset.
create table public.fleet_activity (
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

-- Gebruikersprofielen voor het Motrac Service Portaal.
create table public.motrac_service_portaal_profiles (
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

create trigger update_motrac_profiles_timestamp
before update on public.motrac_service_portaal_profiles
for each row
execute function public.set_updated_at();

-- Koppelt gebruikers aan meerdere locaties binnen het portaal.
create table public.motrac_service_portaal_location_memberships (
  profile_id uuid references public.motrac_service_portaal_profiles(id) on delete cascade,
  location_id uuid references public.locations(id) on delete cascade,
  is_primary boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (profile_id, location_id)
);

-- Garandeert één primaire locatie per gebruiker.
create unique index motrac_service_portaal_location_memberships_primary_unique
  on public.motrac_service_portaal_location_memberships (profile_id)
  where is_primary;

create trigger update_motrac_memberships_timestamp
before update on public.motrac_service_portaal_location_memberships
for each row
execute function public.set_updated_at();

-- View voor het gebruikersoverzicht in de frontend.
create view public.motrac_service_portaal_user_directory as
select
  profile.id,
  profile.display_name,
  profile.email,
  profile.phone,
  profile.role,
  profile.default_location_id,
  coalesce(loc.name, 'Onbekende locatie') as default_location_name
from public.motrac_service_portaal_profiles profile
left join public.locations loc on loc.id = profile.default_location_id;

-- Handige view voor frontend filters om "Alle locaties" optie op te halen.
create view public.locations_with_all as
select '00000000-0000-0000-0000-000000000000'::uuid as id,
       'Alle locaties'::text as name
union all
select id, name from public.locations;

-- Voorbeeld seed-data (optioneel uit te voeren na het aanmaken van de tabellen).
-- insert into public.locations (name) values
--   ('Demovloot Motrac – Almere'),
--   ('Demovloot Motrac – Venlo'),
--   ('Demovloot Motrac – Zwijndrecht');
