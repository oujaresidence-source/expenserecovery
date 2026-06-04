create table apartments (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  district text not null default '',
  project text not null default '',
  start_date date,
  start_date_certainty text not null default 'لا أتذكر',
  furnished_status text not null default 'لا أتذكر',
  status text not null default 'لم تبدأ',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create table expenses (
  id uuid primary key default gen_random_uuid(),
  apartment_id uuid not null references apartments(id) on delete cascade,
  section text not null,
  item_name text not null,
  description text not null default '',
  did_pay text not null default 'لا أتذكر',
  expense_type text not null default 'لا أتذكر',
  recurring_type text not null default 'لا أتذكر',
  start_date date,
  start_date_certainty text not null default 'لا أتذكر',
  end_date date,
  end_date_certainty text not null default 'لا أتذكر',
  is_still_active boolean not null default false,
  amount_sar numeric(12, 2),
  amount_type text not null default 'لا أتذكر',
  min_amount_sar numeric(12, 2),
  max_amount_sar numeric(12, 2),
  number_of_periods numeric(10, 2),
  total_calculated_amount_sar numeric(12, 2) not null default 0,
  payment_source text not null default 'لا أتذكر',
  payment_source_other text not null default '',
  payment_method text not null default 'لا أتذكر',
  payment_method_other text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  constraint expenses_did_pay_check check (did_pay in ('نعم', 'لا', 'لا أتذكر')),
  constraint expenses_expense_type_check check (expense_type in ('مرة واحدة', 'متكرر', 'لا أتذكر')),
  constraint expenses_amount_type_check check (amount_type in ('مؤكد', 'تقديري', 'نطاق تقريبي', 'لا أتذكر'))
);

create index expenses_apartment_id_idx on expenses(apartment_id);
create index expenses_section_idx on expenses(section);

alter table apartments enable row level security;
alter table expenses enable row level security;

create policy "read apartments" on apartments for select using (true);
create policy "write apartments" on apartments for all using (true) with check (true);
create policy "read expenses" on expenses for select using (true);
create policy "write expenses" on expenses for all using (true) with check (true);
