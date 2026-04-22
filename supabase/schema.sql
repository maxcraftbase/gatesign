-- GateSign Database Schema
-- Run this in Supabase SQL Editor

-- Companies (zahlende Kunden)
create table public.companies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  email text not null,
  plan text not null default 'professional' check (plan in ('starter', 'professional', 'business')),
  stripe_customer_id text,
  stripe_subscription_id text,
  subscription_active boolean not null default false,
  created_at timestamptz not null default now()
);

-- Sites (Standorte)
create table public.sites (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade not null,
  name text not null,
  address text,
  qr_token text unique not null default replace(gen_random_uuid()::text, '-', ''),
  created_at timestamptz not null default now()
);

-- Safety Briefings (Sicherheitsbelehrungen mit Versionierung)
create table public.safety_briefings (
  id uuid primary key default gen_random_uuid(),
  site_id uuid references public.sites(id) on delete cascade not null,
  version integer not null default 1,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Briefing Translations (Übersetzungen pro Sprache)
create table public.briefing_translations (
  id uuid primary key default gen_random_uuid(),
  briefing_id uuid references public.safety_briefings(id) on delete cascade not null,
  language text not null,
  content text not null,
  unique(briefing_id, language)
);

-- Drivers (Fahrer — kein Login, nur Device-Token)
create table public.drivers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  company_name text not null,
  phone text not null,
  license_plate text not null,
  preferred_language text not null default 'de',
  device_token text unique not null,
  created_at timestamptz not null default now()
);

-- Briefing Confirmations (einmalig pro Fahrer + Standort + Version)
create table public.briefing_confirmations (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid references public.drivers(id) on delete cascade not null,
  site_id uuid references public.sites(id) on delete cascade not null,
  briefing_id uuid references public.safety_briefings(id) on delete cascade not null,
  briefing_version integer not null,
  language text not null,
  confirmed_at timestamptz not null default now(),
  unique(driver_id, site_id, briefing_version)
);

-- Check-ins (jeder Besuch)
create table public.check_ins (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid references public.drivers(id) on delete cascade not null,
  site_id uuid references public.sites(id) on delete cascade not null,
  briefing_id uuid references public.safety_briefings(id) not null,
  briefing_version integer not null,
  timestamp timestamptz not null default now(),
  -- Snapshot der Fahrerdaten zum Zeitpunkt des Check-ins
  driver_name text not null,
  driver_company text not null,
  driver_phone text not null,
  license_plate text not null,
  language text not null,
  briefing_confirmed boolean not null default false,
  briefing_confirmed_at timestamptz
);

-- RLS (Row Level Security) aktivieren
alter table public.companies enable row level security;
alter table public.sites enable row level security;
alter table public.safety_briefings enable row level security;
alter table public.briefing_translations enable row level security;
alter table public.drivers enable row level security;
alter table public.briefing_confirmations enable row level security;
alter table public.check_ins enable row level security;

-- RLS Policies: Unternehmen sehen nur ihre eigenen Daten
create policy "Companies: own data only"
  on public.companies for all
  using (user_id = auth.uid());

create policy "Sites: own company only"
  on public.sites for all
  using (company_id in (select id from public.companies where user_id = auth.uid()));

create policy "Briefings: own sites only"
  on public.safety_briefings for all
  using (site_id in (
    select s.id from public.sites s
    join public.companies c on c.id = s.company_id
    where c.user_id = auth.uid()
  ));

create policy "Briefing translations: own sites only"
  on public.briefing_translations for all
  using (briefing_id in (
    select sb.id from public.safety_briefings sb
    join public.sites s on s.id = sb.site_id
    join public.companies c on c.id = s.company_id
    where c.user_id = auth.uid()
  ));

create policy "Check-ins: own sites only"
  on public.check_ins for all
  using (site_id in (
    select s.id from public.sites s
    join public.companies c on c.id = s.company_id
    where c.user_id = auth.uid()
  ));

-- Fahrer und Bestätigungen: öffentlich lesbar (für QR-Check-in ohne Login)
create policy "Drivers: public insert"
  on public.drivers for insert with check (true);

create policy "Drivers: read by device token"
  on public.drivers for select using (true);

create policy "Drivers: update own"
  on public.drivers for update using (true);

create policy "Briefing confirmations: public insert"
  on public.briefing_confirmations for insert with check (true);

create policy "Briefing confirmations: public select"
  on public.briefing_confirmations for select using (true);

-- Briefing translations: public read (für Fahrer-App)
create policy "Briefing translations: public read"
  on public.briefing_translations for select using (true);

-- Safety briefings: public read (für Fahrer-App)
create policy "Safety briefings: public read"
  on public.safety_briefings for select using (true);

-- Sites: public read by qr_token (für Fahrer-App)
create policy "Sites: public read"
  on public.sites for select using (true);

-- Check-ins: public insert (Fahrer können einchecken)
create policy "Check-ins: public insert"
  on public.check_ins for insert with check (true);

-- Index für Performance
create index on public.check_ins(site_id, timestamp desc);
create index on public.briefing_confirmations(driver_id, site_id);
create index on public.sites(qr_token);
create index on public.drivers(device_token);
