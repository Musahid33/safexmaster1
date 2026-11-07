-- Publication is explicit and off by default; table access stays private.
alter table public.company_settings add column public_portal_enabled boolean not null default false;
create function public.get_public_portal(p_slug text) returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('companyId', c.id, 'companySlug', c.slug, 'companyName', c.name, 'sites', coalesce((select jsonb_agg(jsonb_build_object('id', l.id, 'name', l.name, 'region', coalesce(l.region, ''), 'sosNumber', l.emergency_number) order by l.name, l.id) from public.locations l where l.company_id = c.id and l.active), '[]'::jsonb))
  from public.companies c join public.company_settings s on s.company_id = c.id
  where c.slug = p_slug and c.status = 'active' and s.public_portal_enabled and length(p_slug) <= 100 and p_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
$$;
revoke all on function public.get_public_portal(text) from public, anon, authenticated;
grant execute on function public.get_public_portal(text) to anon, authenticated, service_role;
