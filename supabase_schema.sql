-- Motrac Service Portaal • Supabase schema
-- Deze SQL maakt de tabellen aan die overeenkomen met de data-structuur
-- in de frontend (locaties, vloot, contracten, activiteiten en gebruikers).

-- Zorg dat de vereiste extensies beschikbaar zijn (Supabase heeft pgcrypto standaard beschikbaar).
create extension if not exists "pgcrypto";

-- Enumeraties voor consistente status- en rolegegevens.
create type public.bmw_status as enum ('Goedgekeurd', 'Afkeur', 'In_beoordeling');
create type public.activity_status as enum ('Open', 'Afgerond');
create type public.activity_type as enum ('Onderhoud', 'Storing', 'Schade', 'Inspectie');
create type public.portal_role as enum ('Beheerder', 'Gebruiker');

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
create trigger set_timestamp
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

-- Applicatiegebruikers, optioneel gekoppeld aan auth.users.
create table public.portal_users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid references auth.users(id) on delete set null,
  display_name text not null,
  email text not null unique,
  phone text,
  location_id uuid references public.locations(id) on delete set null,
  role public.portal_role not null default 'Gebruiker',
  created_at timestamptz not null default timezone('utc', now())
);

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
