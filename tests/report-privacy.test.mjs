import { test } from 'node:test';
import assert from 'node:assert/strict';
import { supportsAnonymousReporting } from '../lib/report-privacy.ts';
test('anonymous option is limited to the requested report types', () => {
  for (const type of ['Grievance', 'Speak Up', 'Feedback']) assert.equal(supportsAnonymousReporting(type), true);
  for (const type of ['Suggestion', 'Near Miss', 'Hazard', 'Safety Observation', 'Unsafe Condition', 'Unsafe Act']) assert.equal(supportsAnonymousReporting(type), false);
});
