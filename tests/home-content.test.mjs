import test from 'node:test';
import assert from 'node:assert/strict';
import { buildHomeFeedShareData } from '../lib/home-content.ts';

test('buildHomeFeedShareData formats Event summary with site, date, time, location and details', () => {
  const payload = buildHomeFeedShareData(
    {
      id: 'ev-1',
      type: 'Event',
      title: 'Fire Mock Drill — Bay 4',
      date: '2026-11-20T10:00:00+05:30',
      summary: 'Evacuation and fire-extinguisher hands-on drill.',
      details: 'All Bay 4 workers must assemble at muster point B.',
      location: 'Bay 4, Jamshedpur Works'
    },
    'Jamshedpur Works',
    'en-IN',
    'https://portal.example.com/portal/acme'
  );

  assert.equal(payload.title, 'Fire Mock Drill — Bay 4 · Jamshedpur Works');
  assert.match(payload.text, /^Event: Fire Mock Drill — Bay 4/m);
  assert.match(payload.text, /Jamshedpur Works/);
  assert.match(payload.text, /Bay 4, Jamshedpur Works/);
  assert.match(payload.text, /Evacuation and fire-extinguisher hands-on drill\./);
  assert.match(payload.text, /All Bay 4 workers must assemble at muster point B\./);
  assert.equal(payload.url, 'https://portal.example.com/portal/acme');
});

test('buildHomeFeedShareData resolves safe relative attachment URLs and blocks unsafe schemes', () => {
  const withRelative = buildHomeFeedShareData(
    {
      id: 'ci-1',
      type: 'Circular',
      title: 'Revised PPE Policy',
      date: '2026-11-10T09:00:00+05:30',
      summary: 'Helmet chin-strap is mandatory.',
      details: 'Helmet chin-strap is mandatory.',
      attachmentUrl: '/docs/ppe-policy.pdf'
    },
    'Jamshedpur Works',
    'en-IN',
    'https://portal.example.com/portal/acme'
  );

  assert.equal(withRelative.url, 'https://portal.example.com/docs/ppe-policy.pdf');
  // Duplicate summary/details are not repeated twice
  assert.equal(withRelative.text.split('Helmet chin-strap is mandatory.').length - 1, 1);

  const withUnsafe = buildHomeFeedShareData(
    {
      id: 'no-1',
      type: 'Notice',
      title: 'Hot Work Zone',
      date: '2026-11-12T11:00:00+05:30',
      summary: 'Permit required before welding.',
      details: 'Check gas levels prior to entry.',
      attachmentUrl: 'javascript:alert(1)'
    },
    'Kalinganagar Works',
    'en-IN',
    'javascript:void(0)'
  );

  assert.equal(withUnsafe.url, undefined);
  assert.match(withUnsafe.text, /Permit required before welding\./);
  assert.match(withUnsafe.text, /Check gas levels prior to entry\./);
});
