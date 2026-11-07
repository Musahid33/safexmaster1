-- Privileged SQL test. Test rows are created only inside a subtransaction that is
-- always rolled back, even on success. Run only on a development/staging database.
-- JWT claim settings below simulate identity for database authorization tests;
-- they do not test real signed JWT verification or application login.
do $$
declare
  owner_auth uuid := gen_random_uuid();
  admin_a_auth uuid := gen_random_uuid();
  admin_b_auth uuid := gen_random_uuid();
  outsider_auth uuid := gen_random_uuid();
  company_a uuid := gen_random_uuid();
  company_b uuid := gen_random_uuid();
  member_a uuid := gen_random_uuid();
  member_b uuid := gen_random_uuid();
  location_a uuid := gen_random_uuid();
  access_row record;
begin
  begin
    insert into auth.users (id) values (owner_auth), (admin_a_auth), (admin_b_auth), (outsider_auth);
    insert into public.companies (id, name, slug, status) values
      (company_a, 'Isolation test A', 'isolation-' || replace(company_a::text, '-', ''), 'active'),
      (company_b, 'Isolation test B', 'isolation-' || replace(company_b::text, '-', ''), 'active');
    insert into public.users (id, company_id, auth_user_id) values
      (member_a, company_a, admin_a_auth), (member_b, company_b, admin_b_auth);
    insert into public.company_admins (company_id, user_id) values
      (company_a, member_a), (company_b, member_b);
    insert into public.locations (id, company_id, name) values (location_a, company_a, 'Isolation test location');
    insert into public.platform_owners (auth_user_id) values (owner_auth);

    perform set_config('request.jwt.claim.sub', owner_auth::text, true);
    select * into strict access_row from public.current_admin_access();
    if not access_row.is_platform_owner or cardinality(access_row.company_ids) <> 0 then
      raise exception 'Owner access must not imply company membership';
    end if;

    perform set_config('request.jwt.claim.sub', admin_a_auth::text, true);
    select * into strict access_row from public.current_admin_access();
    if access_row.is_platform_owner or access_row.company_ids <> array[company_a] then
      raise exception 'Company A admin must only receive company A membership';
    end if;
    perform set_config('request.jwt.claim.sub', admin_b_auth::text, true);
    select * into strict access_row from public.current_admin_access();
    if access_row.is_platform_owner or access_row.company_ids <> array[company_b] then
      raise exception 'Company B admin must only receive company B membership';
    end if;
    perform set_config('request.jwt.claim.sub', outsider_auth::text, true);
    select * into strict access_row from public.current_admin_access();
    if access_row.is_platform_owner or cardinality(access_row.company_ids) <> 0 then
      raise exception 'Unassigned identity must not receive admin access';
    end if;

    begin
      insert into public.reports (company_id, location_id, type, description)
        values (company_b, location_a, 'test', 'rollback-only fixture');
      raise exception 'Cross-company location reference was incorrectly accepted';
    exception when foreign_key_violation then null;
    end;
    update public.company_admins set active = false where company_id = company_a and user_id = member_a;
    perform set_config('request.jwt.claim.sub', admin_a_auth::text, true);
    select * into strict access_row from public.current_admin_access();
    if cardinality(access_row.company_ids) <> 0 then raise exception 'Inactive assignment still grants access'; end if;
    update public.company_admins set active = true where company_id = company_a and user_id = member_a;
    update public.users set active = false where id = member_a;
    select * into strict access_row from public.current_admin_access();
    if cardinality(access_row.company_ids) <> 0 then raise exception 'Inactive user still grants access'; end if;
    update public.users set active = true where id = member_a;
    update public.companies set status = 'suspended' where id = company_a;
    select * into strict access_row from public.current_admin_access();
    if cardinality(access_row.company_ids) <> 0 then raise exception 'Suspended company still grants access'; end if;
    -- Roll back all test identities and rows while allowing the surrounding check to succeed.
    raise sqlstate 'ZX001' using message = 'rollback test fixtures';
  exception when sqlstate 'ZX001' then null;
  end;
end $$;
