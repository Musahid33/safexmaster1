-- Privileged catalog checks. This does not replace end-to-end JWT and tenant-isolation tests.
do $$
declare function_oid oid := 'public.current_admin_access()'::regprocedure;
begin
  if not (select prosecdef and proconfig @> array['search_path=""'] from pg_proc where oid = function_oid) then
    raise exception 'Admin access helper must use a fixed search path and definer privileges';
  end if;
  if has_function_privilege('anon', function_oid, 'EXECUTE')
     or not has_function_privilege('authenticated', function_oid, 'EXECUTE') then
    raise exception 'Admin access helper privileges are incorrect';
  end if;
  if not (select relrowsecurity from pg_class where oid = 'public.company_admins'::regclass)
     or has_table_privilege('anon', 'public.company_admins', 'SELECT, INSERT, UPDATE, DELETE')
     or has_table_privilege('authenticated', 'public.company_admins', 'SELECT, INSERT, UPDATE, DELETE') then
    raise exception 'Admin assignments must not be directly accessible to clients';
  end if;
  if (select auth.uid()) is null and exists (select 1 from public.current_admin_access()) then
    raise exception 'An unauthenticated identity must not receive access context';
  end if;
end $$;
