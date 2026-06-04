create type app_role as enum ('founder', 'finance', 'viewer');
create type apartment_status as enum ('Not started', 'Started', 'Needs memory', 'Needs evidence', 'Ready for finance', 'Reviewed');
create type evidence_status as enum ('none', 'memory', 'receipt', 'bank', 'invoice', 'requested');
create type amount_confidence as enum ('exact', 'estimated', 'range', 'unknown');
create type recurrence_type as enum ('one-time', 'monthly', 'weekly', 'per booking', 'every time needed', 'not sure');
create type review_status as enum ('draft', 'ready', 'approved', 'rejected', 'needs evidence');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role app_role not null default 'viewer',
  display_name text,
  created_at timestamptz not null default now()
);

create table apartments (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  district text not null,
  status apartment_status not null default 'Not started',
  archived boolean not null default false,
  started_at date,
  start_date_confidence text not null default 'unknown',
  furnishing text not null default 'unknown',
  operation_state text not null default 'not sure',
  notes text not null default '',
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table expenses (
  id uuid primary key default gen_random_uuid(),
  apartment_id uuid not null references apartments(id) on delete cascade,
  category text not null,
  expense_group text not null check (expense_group in ('setup', 'recurring', 'repair', 'consumable')),
  amount numeric(12, 2),
  amount_min numeric(12, 2),
  amount_max numeric(12, 2),
  amount_confidence amount_confidence not null default 'estimated',
  recurrence recurrence_type not null default 'one-time',
  start_date date,
  end_date date,
  payment_method text not null default '',
  paid_by text not null default 'Founder',
  evidence_status evidence_status not null default 'memory',
  confidence int not null default 3 check (confidence between 1 and 5),
  notes text not null default '',
  review_status review_status not null default 'draft',
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table evidence_files (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid not null references expenses(id) on delete cascade,
  storage_path text not null,
  original_name text not null,
  uploaded_by uuid references profiles(id),
  uploaded_at timestamptz not null default now()
);

create or replace function current_app_role()
returns app_role
language sql
stable
as $$
  select coalesce((select role from profiles where id = auth.uid()), 'viewer'::app_role);
$$;

alter table profiles enable row level security;
alter table apartments enable row level security;
alter table expenses enable row level security;
alter table evidence_files enable row level security;

create policy "profiles self read" on profiles for select using (auth.uid() = id or current_app_role() in ('founder', 'finance'));
create policy "founder manages profiles" on profiles for all using (current_app_role() = 'founder') with check (current_app_role() = 'founder');

create policy "all roles read apartments" on apartments for select using (current_app_role() in ('founder', 'finance', 'viewer'));
create policy "founder manages apartments" on apartments for all using (current_app_role() = 'founder') with check (current_app_role() = 'founder');

create policy "all roles read expenses" on expenses for select using (current_app_role() in ('founder', 'finance', 'viewer'));
create policy "founder manages expenses" on expenses for all using (current_app_role() = 'founder') with check (current_app_role() = 'founder');
create policy "finance reviews expenses" on expenses for update using (current_app_role() in ('founder', 'finance')) with check (current_app_role() in ('founder', 'finance'));

create policy "all roles read evidence" on evidence_files for select using (current_app_role() in ('founder', 'finance', 'viewer'));
create policy "founder uploads evidence" on evidence_files for insert with check (current_app_role() = 'founder');
