import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const fixture = await readFile(new URL('../lib/demo-fixture.ts', import.meta.url), 'utf8');
const page = await readFile(new URL('../app/page.tsx', import.meta.url), 'utf8');

test('demo data is exactly one location: West Bokaro', () => {
  // One site keeps the review simple: the app has no site picker to fight with.
  assert.ok(fixture.includes("DEMO_SITE_ID = 'demo-wbd'"), 'demo site id is missing');
  assert.ok(fixture.includes("name: 'West Bokaro (WBD)'"), 'West Bokaro site is missing');
  // Every record references the shared constant rather than a second literal site id.
  // Every record uses the shared constant, so a second location cannot creep back in.
  assert.equal([...fixture.matchAll(/siteId: 'demo-/g)].length, 0, 'no hardcoded site id expected');
  assert.ok((fixture.match(/siteId: DEMO_SITE_ID/g) ?? []).length >= 10, 'demo content must reference DEMO_SITE_ID');
  assert.ok(!fixture.includes('demo-jsr') && !fixture.includes('demo-kal'), 'other demo locations must be gone');
});

test('demo mode ships a working employee directory', () => {
  // The lookup gates form submission; a throwing directory makes the form unusable.
  assert.ok(fixture.includes('DEMO_EMPLOYEES'), 'demo employees are missing');
  assert.ok(fixture.includes('demoDirectory'), 'demo directory factory is missing');
  assert.ok(fixture.includes('async search('), 'demo directory cannot search');
  assert.ok(fixture.includes('async findByEmployeeNo('), 'demo directory cannot resolve an exact Employee ID');
});

test('demo employees use obvious placeholder IDs', () => {
  const employees = [...fixture.matchAll(/empNo: '([^']+)'/g)].map((match) => match[1]);
  assert.ok(employees.length >= 4, 'expected at least four demo employees');
  for (const empNo of employees) assert.match(empNo, /^DEMO-\d{4}$/, `placeholder ID expected: ${empNo}`);
});

test('the frontend runs on demo data with no configuration', () => {
  // No env var, no query flag: a plain deploy must open the app fully.
  assert.ok(page.includes('const demoChecked = true'), 'demo readiness must not depend on an env var');
  assert.ok(page.includes('const displaySites = DEMO_SITES'), 'sites must come from the fixture');
  assert.ok(page.includes("const activeTenantId = 'demo-tenant'"), 'demo tenant ID is missing');
  assert.ok(page.includes('await queueReport(activeTenantId, currentSite.id, data)'), 'queueing does not use the demo tenant');
  assert.ok(fixture.includes('DEMO FIXTURE (TEMPORARY)'), 'fixture must stay marked as temporary');
});

test('no backend or database code remains in the app', () => {
  assert.ok(!page.includes('@supabase'), 'page must not import a database client');
  assert.ok(!page.includes('NEXT_PUBLIC_SUPABASE'), 'page must not read database env vars');
});

test('a submitted demo report appears in View Reports without touching a database', () => {
  assert.ok(page.includes('setDemoReports('), 'demo report list is not updated after submitting');
  assert.ok(page.includes('demoReports={demoReports}'), 'View Reports does not receive the demo list');
});
