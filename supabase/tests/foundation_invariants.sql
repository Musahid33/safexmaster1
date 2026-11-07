-- Run as a privileged database user on the foundation-only schema.
-- No records are created or modified. An exception means the check failed.
do $$
declare bad_tables text; missing_indexes text;
begin
  select string_agg(c.relname, ', ' order by c.relname) into bad_tables
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r'
    and (not c.relrowsecurity
      or has_table_privilege('anon', c.oid, 'SELECT, INSERT, UPDATE, DELETE')
      or has_table_privilege('authenticated', c.oid, 'SELECT, INSERT, UPDATE, DELETE'));
  if bad_tables is not null then
    raise exception 'Foundation access check failed: %', bad_tables;
  end if;
  select string_agg(c.conrelid::regclass::text || '.' || c.conname, ', ' order by c.conname) into missing_indexes
  from pg_constraint c join pg_namespace n on n.oid = c.connamespace
  where n.nspname = 'public' and c.contype = 'f'
    and not exists (select 1 from pg_index i where i.indrelid = c.conrelid and i.indisvalid
      and i.indpred is null and i.indexprs is null
      and (i.indkey::smallint[])[0:cardinality(c.conkey)-1] = c.conkey);
  if missing_indexes is not null then
    raise exception 'Unindexed foreign keys: %', missing_indexes;
  end if;
end $$;
