import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const fixture = await readFile(new URL('../lib/demo-fixture.ts', import.meta.url), 'utf8');
const page = await readFile(new URL('../app/page.tsx', import.meta.url), 'utf8');

test('demo mode exposes three sample locations including a single-site entry', () => {
  const siteIds = [...fixture.matchAll(/id: '(demo-[a-z]+)'/g)].map((match) => match[1]).filter((id) => ['demo-jsr', 'demo-kal', 'demo-wbd'].includes(id));
  assert.deepEqual([...new Set(siteIds)].sort(), ['demo-jsr', 'demo-kal', 'demo-wbd']);
});

test('demo mode ships a working employee directory', () => {
  // The lookup is what gates form submission; a throwing directory makes the form unusable.
  assert.ok(fixture.includes('DEMO_EMPLOYEES'), 'demo employees are missing');
  assert.ok(fixture.includes('demoDirectory'), 'demo directory factory is missing');
  assert.ok(fixture.includes('async search('), 'demo directory cannot search');
  assert.ok(fixture.includes('async findByEmployeeNo('), 'demo directory cannot resolve an exact Employee ID');
});

test('demo directory records belong to a demo site and use obvious placeholder IDs', () => {
  const employees = [...fixture.matchAll(/empNo: '([^']+)',[\s\S]{0,120}?siteId: '([^']+)'/g)];
  assert.ok(employees.length >= 6, 'expected at least six demo employees');
  for (const [, empNo, siteId] of employees) {
    assert.match(empNo, /^DEMO-\d{4}$/, `demo employee ID must be a placeholder: ${empNo}`);
    assert.match(siteId, /^demo-/, `demo employee must belong to a demo site: ${siteId}`);
  }
});

test('demo mode supplies a tenant ID so reports can be queued', () => {
  // Without a tenant ID the report form refuses to save, so the review cannot happen.
  assert.ok(page.includes("DEMO_TENANT_ID = 'demo-tenant'"), 'demo tenant ID is missing');
  assert.ok(page.includes('const activeTenantId = demoMode ? DEMO_TENANT_ID : tenantId'), 'demo tenant is not wired in');
  assert.ok(page.includes('await queueReport(activeTenantId, currentSite.id, data)'), 'queueing does not use the demo tenant');
});

test('demo mode is opt-in per deployment and per visit', () => {
  // Two gates: the build must allow it (NEXT_PUBLIC_ENABLE_DEMO), and the visitor must ask
  // for it (?demo=1). Nothing appears by default.
  assert.ok(page.includes("process.env.NEXT_PUBLIC_ENABLE_DEMO === '1'"), 'demo build flag is missing');
  assert.ok(page.includes("new URLSearchParams(window.location.search).has('demo')"), 'demo is not opt-in per visit');
  assert.ok(page.includes('const [demoMode, setDemoMode] = useState(false)'), 'demo mode must start off');
  assert.ok(fixture.includes('TEMPORARY DEMO FIXTURE'), 'fixture must stay marked as temporary');
});

test('demo data can never render over a real tenant portal', () => {
  // tenantId is populated the moment a company resolves from the host or /portal/<slug>.
  assert.ok(page.includes("if (demoBuildEnabled && !tenantId)"), 'demo guard does not check for a resolved tenant');
});

test('a demo submission appears in View Reports without touching the database', () => {
  assert.ok(page.includes('setDemoReports('), 'demo report list is not updated after submitting');
  assert.ok(page.includes('demoReports={demoMode ? demoReports : undefined}'), 'View Reports does not receive the demo list');
});
