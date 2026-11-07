-- SafetyOS foundation. All application tables are private by default.
-- No public reporting, authentication UI, provisioning, or application access is enabled here.
create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  status text not null default 'draft' check (status in ('draft', 'active', 'suspended', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.company_settings (
  company_id uuid primary key references public.companies(id),
  logo_url text, about text, services text, address text, email text, mobile text,
  theme jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table public.locations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  name text not null check (length(trim(name)) > 0),
  region text, emergency_number text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (company_id, id), unique (company_id, name)
);

create table public.departments (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id),
  location_id uuid, name text not null check (length(trim(name)) > 0),
  created_at timestamptz not null default now(),
  unique (company_id, id), foreign key (company_id, location_id) references public.locations(company_id, id)
);

-- Company users are tied to Supabase Auth; credentials never live in application tables.
create table public.users (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id),
  auth_user_id uuid references auth.users(id), display_name text, employee_code text,
  location_id uuid, department_id uuid, active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (company_id, id), unique (company_id, auth_user_id), unique (company_id, employee_code),
  foreign key (company_id, location_id) references public.locations(company_id, id),
  foreign key (company_id, department_id) references public.departments(company_id, id)
);

-- Platform owners are independent of any company. Assignments must be made through a trusted process.
create table public.platform_owners (
  auth_user_id uuid primary key references auth.users(id),
  created_at timestamptz not null default now()
);
create table public.roles (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id),
  name text not null, description text, created_at timestamptz not null default now(),
  unique (company_id, id), unique (company_id, name)
);
create table public.permissions (
  id uuid primary key default gen_random_uuid(), code text not null unique, description text
);
create table public.role_permissions (
  company_id uuid not null references public.companies(id), role_id uuid not null,
  permission_id uuid not null references public.permissions(id),
  primary key (company_id, role_id, permission_id),
  foreign key (company_id, role_id) references public.roles(company_id, id)
);
create table public.user_roles (
  company_id uuid not null references public.companies(id), user_id uuid not null, role_id uuid not null,
  primary key (company_id, user_id, role_id),
  foreign key (company_id, user_id) references public.users(company_id, id),
  foreign key (company_id, role_id) references public.roles(company_id, id)
);

-- Global catalogues do not have a company_id; company-specific assignments do.
create table public.modules (
  id uuid primary key default gen_random_uuid(), code text not null unique, name text not null, description text, active boolean not null default true
);
create table public.company_modules (
  company_id uuid not null references public.companies(id), module_id uuid not null references public.modules(id),
  enabled boolean not null default false, primary key (company_id, module_id)
);
create table public.plans (
  id uuid primary key default gen_random_uuid(), code text not null unique, name text not null,
  description text, active boolean not null default true, created_at timestamptz not null default now()
);
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id),
  plan_id uuid not null references public.plans(id), status text not null default 'pending',
  starts_at timestamptz, ends_at timestamptz, created_at timestamptz not null default now(),
  unique (company_id, id), check (ends_at is null or starts_at is null or ends_at >= starts_at)
);

create table public.reports (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id),
  location_id uuid not null, department_id uuid, type text not null, category text,
  description text not null, anonymous boolean not null default false, reporter_name text,
  status text not null default 'open', created_at timestamptz not null default now(),
  unique (company_id, id),
  foreign key (company_id, location_id) references public.locations(company_id, id),
  foreign key (company_id, department_id) references public.departments(company_id, id),
  check (not anonymous or reporter_name is null)
);
create table public.documents (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id),
  location_id uuid, title text not null, storage_path text, status text not null default 'draft',
  created_at timestamptz not null default now(), unique (company_id, id),
  foreign key (company_id, location_id) references public.locations(company_id, id)
);
create table public.training (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id),
  location_id uuid, title text not null, content_type text, storage_path text,
  status text not null default 'draft', created_at timestamptz not null default now(), unique (company_id, id),
  foreign key (company_id, location_id) references public.locations(company_id, id)
);
create table public.rewards (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id),
  location_id uuid, recipient_user_id uuid, title text not null, description text,
  status text not null default 'draft', created_at timestamptz not null default now(), unique (company_id, id),
  foreign key (company_id, location_id) references public.locations(company_id, id),
  foreign key (company_id, recipient_user_id) references public.users(company_id, id)
);
create table public.events (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id),
  location_id uuid, title text not null, description text, starts_at timestamptz, ends_at timestamptz,
  status text not null default 'draft', created_at timestamptz not null default now(), unique (company_id, id),
  foreign key (company_id, location_id) references public.locations(company_id, id),
  check (ends_at is null or starts_at is null or ends_at >= starts_at)
);
create table public.notifications (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id),
  recipient_user_id uuid, title text not null, body text, read_at timestamptz,
  created_at timestamptz not null default now(), unique (company_id, id),
  foreign key (company_id, recipient_user_id) references public.users(company_id, id)
);
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(), company_id uuid references public.companies(id),
  actor_auth_user_id uuid references auth.users(id), action text not null, target_type text,
  target_id uuid, details jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);

create index users_auth_user_id_idx on public.users(auth_user_id);
create index reports_company_location_created_idx on public.reports(company_id, location_id, created_at desc);
create index audit_logs_company_created_idx on public.audit_logs(company_id, created_at desc);

-- Explicit privilege revocation plus RLS means neither anonymous nor authenticated clients
-- can read or write these tables until narrowly scoped access is designed and tested.
do $$
declare t text;
begin
  foreach t in array array['companies','company_settings','locations','departments','users','platform_owners','roles','permissions','role_permissions','user_roles','modules','company_modules','plans','subscriptions','reports','documents','training','rewards','events','notifications','audit_logs'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on table public.%I from anon, authenticated', t);
  end loop;
end $$;
