-- Company admin assignments are separate from employee records and role names.
-- Provision only through a trusted, audited onboarding process.
create table public.company_admins (
  company_id uuid not null references public.companies(id),
  user_id uuid not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (company_id, user_id),
  foreign key (company_id, user_id) references public.users(company_id, id)
);
alter table public.company_admins enable row level security;
revoke all on table public.company_admins from public, anon, authenticated;

-- Return only the verified caller's access. No user or company ID is accepted as input.
-- This helper provides authorization context, not authentication or table access.
create function public.current_admin_access()
returns table (is_platform_owner boolean, company_ids uuid[])
language sql stable security definer
set search_path = ''
as $$
  select
    exists (select 1 from public.platform_owners po where po.auth_user_id = (select auth.uid())),
    coalesce(array(
      select ca.company_id
      from public.company_admins ca
      join public.users u on u.company_id = ca.company_id and u.id = ca.user_id
      join public.companies c on c.id = ca.company_id
      where u.auth_user_id = (select auth.uid()) and u.active and ca.active and c.status = 'active'
      order by ca.company_id
    ), array[]::uuid[])
  where (select auth.uid()) is not null;
$$;
revoke all on function public.current_admin_access() from public, anon, authenticated;
grant execute on function public.current_admin_access() to authenticated;
