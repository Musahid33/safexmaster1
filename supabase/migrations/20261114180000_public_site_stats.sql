-- Per-site safety stats for the public portal hero banner.
-- Days Without Injury counts whole days since the site's last recordable injury
-- (or since the location record was created when none has been recorded).
alter table public.locations add column last_recordable_injury_at timestamptz;

-- Stats are exposed per location inside each site entry. Counts are aggregates only;
-- they carry no report contents and stay scoped to the company resolved by p_slug.
create or replace function public.get_public_portal(p_slug text) returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('companyId', c.id, 'companySlug', c.slug, 'companyName', c.name, 'sites', coalesce((select jsonb_agg(jsonb_build_object('id', l.id, 'name', l.name, 'region', coalesce(l.region, ''), 'sosNumber', l.emergency_number,
    'stats', jsonb_build_object(
      'daysWithoutInjury', greatest(current_date - coalesce(l.last_recordable_injury_at, l.created_at)::date, 0),
      'nearMissCount', (select count(*)::int from public.reports r where r.company_id = c.id and r.location_id = l.id and r.type = 'Near Miss'),
      'safetyObservationCount', (select count(*)::int from public.reports r where r.company_id = c.id and r.location_id = l.id and r.type = 'Safety Observation'),
      'trainingCount', (select count(*)::int from public.training t where t.company_id = c.id and t.location_id = l.id and t.status = 'published')))
    order by l.name, l.id) from public.locations l where l.company_id = c.id and l.active), '[]'::jsonb))
  from public.companies c join public.company_settings s on s.company_id = c.id
  where c.slug = p_slug and c.status = 'active' and s.public_portal_enabled and length(p_slug) <= 100 and p_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
$$;
