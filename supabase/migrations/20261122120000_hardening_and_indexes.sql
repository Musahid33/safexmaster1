-- Hardening, stats indexes, timezone-accurate hero day counters, and lower-contention rate limiting.

-- Composite indexes to keep per-site hero aggregations fast as report/training volume grows.
create index reports_company_location_type_idx on public.reports (company_id, location_id, type);
create index training_company_location_status_idx on public.training (company_id, location_id, status);

-- Constrain status values and prevent blank report types so hero aggregations do not silently drift.
alter table public.reports
  add constraint reports_type_nonempty_check check (length(trim(type)) > 0),
  add constraint reports_status_check check (status in ('open', 'in_progress', 'closed'));

alter table public.training
  add constraint training_status_check check (status in ('draft', 'published', 'archived'));

alter table public.subscriptions
  add constraint subscriptions_status_check check (status in ('pending', 'active', 'past_due', 'canceled', 'expired'));

-- Compute Days Without Injury in Asia/Kolkata (matching APP_TIME_ZONE) instead of DB session UTC.
create or replace function public.get_public_portal(p_slug text) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'companyId', c.id,
    'companySlug', c.slug,
    'companyName', c.name,
    'sites', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', l.id,
          'name', l.name,
          'region', coalesce(l.region, ''),
          'sosNumber', l.emergency_number,
          'stats', jsonb_build_object(
            'daysWithoutInjury', greatest(
              (now() at time zone 'Asia/Kolkata')::date
                - (coalesce(l.last_recordable_injury_at, l.created_at) at time zone 'Asia/Kolkata')::date,
              0
            ),
            'nearMissCount', (
              select count(*)::int
              from public.reports r
              where r.company_id = c.id and r.location_id = l.id and r.type = 'Near Miss'
            ),
            'safetyObservationCount', (
              select count(*)::int
              from public.reports r
              where r.company_id = c.id and r.location_id = l.id and r.type = 'Safety Observation'
            ),
            'trainingCount', (
              select count(*)::int
              from public.training t
              where t.company_id = c.id and t.location_id = l.id and t.status = 'published'
            )
          )
        )
        order by l.name, l.id
      )
      from public.locations l
      where l.company_id = c.id and l.active
    ), '[]'::jsonb)
  )
  from public.companies c
  join public.company_settings s on s.company_id = c.id
  where c.slug = p_slug
    and c.status = 'active'
    and s.public_portal_enabled
    and length(p_slug) <= 100
    and p_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
$$;

-- Avoid full expired-row delete contention on every login attempt; reset expired buckets inline
-- via ON CONFLICT and prune stale rows opportunistically (~5% of calls).
create or replace function public.check_admin_login_limit(
  p_bucket text,
  p_limit integer,
  p_window_seconds integer
) returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  count_now integer;
begin
  if p_bucket !~ '^[0-9a-f]{64}$'
     or p_limit not between 1 and 1000
     or p_window_seconds not between 1 and 86400 then
    return false;
  end if;

  if random() < 0.05 then
    delete from public.admin_login_attempts where expires_at < now();
  end if;

  insert into public.admin_login_attempts as a (bucket, attempts, expires_at)
  values (p_bucket, 1, now() + make_interval(secs => p_window_seconds))
  on conflict (bucket) do update set
    attempts = case when a.expires_at < now() then 1 else a.attempts + 1 end,
    expires_at = case when a.expires_at < now() then now() + make_interval(secs => p_window_seconds) else a.expires_at end
  returning attempts into count_now;

  return count_now <= p_limit;
end;
$$;
