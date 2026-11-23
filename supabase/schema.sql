-- Run in Supabase SQL editor. Safe to re-run.
create extension if not exists "pgcrypto";

create table if not exists profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  resume_text text,
  headline text,
  target_titles text[] default '{}',
  locations text[] default '{}',
  work_modes text[] default '{remote,hybrid,onsite}',
  min_salary integer,
  seniority text[] default '{}',
  industries text[] default '{}',
  must_haves text,
  deal_breakers text,
  muse_categories text[] default '{}',
  min_score integer default 70,
  scan_enabled boolean default true,
  last_scan_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists jobs (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  external_id text not null,
  title text not null,
  company text not null,
  location text,
  work_mode text,
  salary_min integer,
  salary_max integer,
  url text not null,
  description text,
  posted_at timestamptz,
  found_at timestamptz default now(),
  unique (source, external_id)
);
create index if not exists jobs_company_title on jobs (lower(company), lower(title));

create table if not exists matches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_id uuid not null references jobs(id) on delete cascade,
  score integer not null,
  reasons text[] default '{}',
  concerns text[] default '{}',
  status text not null default 'new' check (status in ('new','saved','dismissed')),
  created_at timestamptz default now(),
  unique (user_id, job_id)
);

create table if not exists tailored_resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_id uuid not null references jobs(id) on delete cascade,
  resume_md text not null,
  cover_letter_md text,
  changes text[] default '{}',
  created_at timestamptz default now(),
  unique (user_id, job_id)
);

create table if not exists applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_id uuid not null references jobs(id) on delete cascade,
  status text not null default 'saved'
    check (status in ('saved','ready','applied','screening','interview','offer','rejected','withdrawn')),
  applied_at timestamptz,
  follow_up_at date,
  notes text,
  updated_at timestamptz default now(),
  unique (user_id, job_id)
);

create table if not exists scan_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  started_at timestamptz default now(),
  finished_at timestamptz,
  candidates integer default 0,
  matched integer default 0,
  error text
);

alter table profiles enable row level security;
alter table jobs enable row level security;
alter table matches enable row level security;
alter table tailored_resumes enable row level security;
alter table applications enable row level security;
alter table scan_runs enable row level security;

drop policy if exists "own profile" on profiles;
create policy "own profile" on profiles for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "read jobs" on jobs;
create policy "read jobs" on jobs for select using (auth.role() = 'authenticated');
drop policy if exists "own matches" on matches;
create policy "own matches" on matches for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "own resumes" on tailored_resumes;
create policy "own resumes" on tailored_resumes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "own apps" on applications;
create policy "own apps" on applications for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "own runs" on scan_runs;
create policy "own runs" on scan_runs for select using (auth.uid() = user_id);
-- Writes to jobs and scan_runs happen server-side with the service-role key.

-- Per-user token so an outside agent (Muse, Claude, a script) can push jobs in via /api/ingest
alter table profiles add column if not exists ingest_token text unique;

-- Raw questionnaire answers, so people can reopen and edit them
alter table profiles add column if not exists preferences jsonb;
