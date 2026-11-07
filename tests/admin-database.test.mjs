import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

// Ephemeral PostgreSQL, with a minimal Supabase Auth identity stub. No external service or real data.
async function freshDatabase() {
  const db = await PGlite.create();
  await db.exec(`
    create role anon nologin;
    create role authenticated nologin;
    create role service_role nologin;
    create schema auth;
    create table auth.users (id uuid primary key, email text, email_confirmed_at timestamptz);
    create function auth.uid() returns uuid language sql stable as $$
      select coalesce(nullif(current_setting('request.jwt.claim.sub', true), ''),
        (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub'))::uuid
    $$;
    grant usage on schema auth to anon, authenticated, service_role;
    grant execute on function auth.uid() to anon, authenticated, service_role;
  `);
  const files = (await readdir(new URL('../supabase/migrations/', import.meta.url))).filter((f) => f.endsWith('.sql')).sort();
  for (const file of files) await db.exec(await readFile(new URL(`../supabase/migrations/${file}`, import.meta.url), 'utf8'));
  return db;
}

test('foundation migrations and rollback-only multi-company isolation checks', async () => {
  const db = await freshDatabase();
  try {
    for (const file of ['foundation_invariants.sql', 'admin_access_invariants.sql', 'admin_isolation_rollback.sql']) {
      await db.exec(await readFile(new URL(`../supabase/tests/${file}`, import.meta.url), 'utf8'));
    }
    const counts = await db.query('select (select count(*) from public.companies)::int as companies, (select count(*) from auth.users)::int as auth_users');
    assert.deepEqual(counts.rows[0], { companies: 0, auth_users: 0 }, 'test fixtures must be rolled back');
  } finally { await db.close(); }
});

test('database roles cannot directly read private data or resolve company logins', async () => {
  const db = await freshDatabase();
  try {
    await db.exec('set role anon');
    await assert.rejects(db.query('select * from public.companies'), /permission denied/i);
    await assert.rejects(db.query('select * from public.current_admin_access()'), /permission denied/i);
    await assert.rejects(db.query("select * from public.resolve_company_admin_login('company', 'admin')"), /permission denied/i);
    await db.exec('reset role; set role authenticated');
    await assert.rejects(db.query('select * from public.reports'), /permission denied/i);
    await assert.rejects(db.query('select * from public.company_admins'), /permission denied/i);
    await assert.rejects(db.query("select * from public.resolve_company_admin_login('company', 'admin')"), /permission denied/i);
    const access = await db.query('select * from public.current_admin_access()');
    assert.equal(access.rows.length, 0, 'authenticated role without a user identity has no access');
    await db.exec('reset role');
  } finally { await db.close(); }
});

test('username resolution is scoped and rate limiting fails closed', async () => {
  const db = await freshDatabase();
  try {
    const ids = await db.query(`select gen_random_uuid() as company_a, gen_random_uuid() as company_b,
      gen_random_uuid() as user_a, gen_random_uuid() as user_b, gen_random_uuid() as auth_a, gen_random_uuid() as auth_b`);
    const { company_a, company_b, user_a, user_b, auth_a, auth_b } = ids.rows[0];
    await db.query('insert into auth.users(id, email, email_confirmed_at) values ($1, $2, now()), ($3, $4, now())', [auth_a, 'a@example.invalid', auth_b, 'b@example.invalid']);
    await db.query("insert into public.companies(id, name, slug, status) values ($1, 'A', 'company-a', 'active'), ($2, 'B', 'company-b', 'active')", [company_a, company_b]);
    await db.query('insert into public.users(id, company_id, auth_user_id) values ($1, $2, $3), ($4, $5, $6)', [user_a, company_a, auth_a, user_b, company_b, auth_b]);
    await db.query("insert into public.company_admins(company_id, user_id, username) values ($1, $2, 'officer'), ($3, $4, 'officer')", [company_a, user_a, company_b, user_b]);
    await db.exec('set role service_role');
    const resolve = (slug) => db.query("select * from public.resolve_company_admin_login($1, 'officer')", [slug]);
    assert.deepEqual((await resolve('company-a')).rows, [{ email: 'a@example.invalid', company_id: company_a }]);
    assert.deepEqual((await resolve('company-b')).rows, [{ email: 'b@example.invalid', company_id: company_b }]);
    assert.deepEqual((await resolve('unknown')).rows, []);
    const bucket = 'a'.repeat(64);
    for (const allowed of [true, true, false]) {
      const result = await db.query('select public.check_admin_login_limit($1, 2, 60) as allowed', [bucket]);
      assert.equal(result.rows[0].allowed, allowed);
    }
    assert.equal((await db.query("select public.check_admin_login_limit('bad-bucket', 2, 60) as allowed")).rows[0].allowed, false);
    await db.exec('reset role');
    await db.query('update public.company_admins set active = false where company_id = $1', [company_a]);
    await db.exec('set role service_role');
    assert.deepEqual((await resolve('company-a')).rows, []);
    assert.equal((await resolve('company-b')).rows.length, 1);
    await db.exec('reset role');
    await db.query("update public.companies set status = 'suspended' where id = $1", [company_b]);
    await db.exec('set role service_role');
    assert.deepEqual((await resolve('company-b')).rows, []);
    await db.exec('reset role');
  } finally { await db.close(); }
});

test('public portal exposes only enabled companies and active locations', async () => {
  const db = await freshDatabase();
  try {
    const { rows: [ids] } = await db.query('select gen_random_uuid() as a, gen_random_uuid() as b, gen_random_uuid() as active_site, gen_random_uuid() as inactive_site');
    await db.query("insert into public.companies(id,name,slug,status) values ($1,'Company A','company-a','active'),($2,'Company B','company-b','active')", [ids.a,ids.b]);
    await db.query("insert into public.company_settings(company_id,public_portal_enabled,email) values ($1,true,'private@example.invalid'),($2,false,'private@example.invalid')", [ids.a,ids.b]);
    await db.query("insert into public.locations(id,company_id,name,active,emergency_number) values ($1,$2,'Active site',true,'123'),($3,$2,'Inactive site',false,'456')", [ids.active_site,ids.a,ids.inactive_site]);
    await db.exec('set role anon');
    const { rows: [row] } = await db.query("select public.get_public_portal('company-a') as portal");
    assert.deepEqual(row.portal, { companyId: ids.a, companySlug: 'company-a', companyName: 'Company A', sites: [{ id: ids.active_site, name: 'Active site', region: '', sosNumber: '123' }] });
    assert.equal((await db.query("select public.get_public_portal('company-b') as portal")).rows[0].portal, null);
    assert.equal((await db.query("select public.get_public_portal('unknown') as portal")).rows[0].portal, null);
    await assert.rejects(db.query('select * from public.company_settings'), /permission denied/i);
    await assert.rejects(db.query('select * from public.locations'), /permission denied/i);
    await db.exec('reset role');
    await db.query("update public.companies set status='suspended' where id=$1", [ids.a]);
    await db.exec('set role anon');
    assert.equal((await db.query("select public.get_public_portal('company-a') as portal")).rows[0].portal, null);
    await db.exec('reset role');
  } finally { await db.close(); }
});
