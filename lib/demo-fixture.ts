/**
 * ============================ TEMPORARY DEMO FIXTURE ============================
 * For design/feature testing with the ?demo=1 URL flag ONLY, and ONLY in
 * development mode (the flag is ignored in production builds). Contains fictional
 * sites, stats, rules, feed items, recognitions and reports so site filtering,
 * the View Reports location dropdown and the hero banner can be reviewed before
 * the real database connects. REMOVE this file, the public/demo/ images and the
 * demoMode wiring in app/page.tsx before production. Never ship this data to real users.
 * ===============================================================================
 */
import type { HomeFeedItem } from './home-content';
import type { Site } from './types';
import type { RecognitionGalleryItem } from '@/app/components/RewardCarousel';
import type { LoggedReport } from '@/app/components/LoggedReports';

export const DEMO_SITES: Site[] = [
  {
    id: 'demo-jsr',
    name: 'Jamshedpur Works',
    region: 'Jharkhand',
    sosNumber: '+91 99999 00001',
    stats: { daysWithoutInjury: 128, nearMissCount: 27, safetyObservationCount: 61, trainingCount: 342 },
    lifeSavingRules: [
      { title: 'Work at height', text: 'Harness aur lifeline ke bina 1.8 m se upar kaam mat karo.' },
      { title: 'Energy isolation', text: 'Machine/service par kaam se pehle lockout-tagout lagao.' },
      { title: 'Moving vehicles', text: 'Chalti gaadi ya crane ke load ke neeche kabhi mat jao.' }
    ]
  },
  {
    id: 'demo-kal',
    name: 'Kalinganagar Works',
    region: 'Odisha',
    sosNumber: '+91 99999 00002',
    stats: { daysWithoutInjury: 46, nearMissCount: 9, safetyObservationCount: 22, trainingCount: 118 },
    lifeSavingRules: [
      { title: 'Confined space', text: 'Confined space me bina permit aur gas-test ke pravesh nahi.' },
      { title: 'Bypassing safety controls', text: 'Safety interlock/guard ko kabhi bypass mat karo.' }
    ]
  }
];

export const DEMO_FEED: HomeFeedItem[] = [
  {
    id: 'demo-ev-jsr', type: 'Event', siteId: 'demo-jsr',
    title: 'Fire Mock Drill — Bay 4', date: '2026-11-20T10:00:00',
    summary: 'Evacuation aur fire-extinguisher hands-on drill.', details: 'Sabhi bay 4 ke workers ko shamil hona hai.', location: 'Bay 4, Jamshedpur Works'
  },
  {
    id: 'demo-ev-kal', type: 'Event', siteId: 'demo-kal',
    title: 'Crane Safety Toolbox Talk', date: '2026-11-25T08:30:00',
    summary: 'EOT crane blind-spot safety session.', details: 'Crane operators aur riggers ke liye.', location: 'CRM Gate, Kalinganagar Works'
  },
  {
    id: 'demo-ev-all', type: 'Event',
    title: 'National Safety Week — Planning Meet', date: '2026-12-02T15:00:00',
    summary: 'Dono sites ke safety officers ka joint meeting.', details: 'Safety Week ke themes aur responsibilities finalize hongi.', location: 'Online'
  },
  {
    id: 'demo-ci-jsr', type: 'Circular', siteId: 'demo-jsr',
    title: 'Revised PPE Policy — Jamshedpur', date: '2026-11-10T09:00:00',
    summary: 'Helmet chin-strap ab compulsory hai.', details: '12 Nov se checking start hogi; bina chin-strap entry nahi.'
  },
  {
    id: 'demo-ci-all', type: 'Circular',
    title: 'Company-wide: Near Miss reporting drive', date: '2026-11-05T09:00:00',
    summary: 'Har employee se maheene me kam se kam 1 near miss report.', details: 'Ye drive dono sites par lagu hai.'
  },
  {
    id: 'demo-no-kal', type: 'Notice', siteId: 'demo-kal',
    title: 'Notice: Hot work zone extension', date: '2026-11-12T11:00:00',
    summary: 'Furni platform tak hot work zone badhaya gaya.', details: 'Permit ke bina welding/grinding nahi.'
  },
  {
    id: 'demo-no-all', type: 'Notice',
    title: 'Notice: Safety portal update', date: '2026-11-14T18:00:00',
    summary: 'Passport search ab company-wide hai.', details: 'Employee ID se koi bhi employee kisi bhi location ka khulega.'
  }
];

export const DEMO_RECOGNITIONS: RecognitionGalleryItem[] = [
  { id: 'demo-rw-jsr-1', siteId: 'demo-jsr', altText: 'Reward — Jamshedpur', artworkIndex: 0, isPublished: true, employeeName: 'Ramesh Kumar', designation: 'Welder', rewardFor: '3 near miss reports in a month' },
  { id: 'demo-rw-jsr-2', siteId: 'demo-jsr', altText: 'Reward — Jamshedpur', artworkIndex: 1, isPublished: true, employeeName: 'Sunita Devi', designation: 'Fitter', rewardFor: 'Best safety observation' },
  { id: 'demo-rw-kal-1', siteId: 'demo-kal', altText: 'Reward — Kalinganagar', artworkIndex: 2, isPublished: true, employeeName: 'Ajay Singh', designation: 'Crane Operator', rewardFor: 'Hazard identified before lift' }
];

/** Site-tagged sample reports so the View Reports location dropdown is reviewable. */
export const DEMO_REPORTS: LoggedReport[] = [
  {
    reference: 'NM-2601', type: 'Near Miss', siteId: 'demo-jsr', siteName: 'Jamshedpur Works',
    category: 'Slip & Fall', area: 'Rolling Mill', department: 'Maintenance', severity: 'High',
    occurredAt: '2026-11-13T14:20:00', filedAt: '2026-11-13T15:02:00', status: 'Open',
    summary: 'Oil spillage ke karan worker slip hone se bacha', description: 'Bay 3 ke paas hydraulic oil spill tha; time par clean kiya gaya.',
    immediateAction: 'Area barricaded and cleaned', reporterName: 'Ramesh Kumar', hasPhoto: true, photoUrl: '/demo/photo-oil-spill.jpg'
  },
  {
    reference: 'HZ-2602', type: 'Hazard', siteId: 'demo-jsr', siteName: 'Jamshedpur Works',
    category: 'Electrical', area: 'Bay 4', department: 'Electrical', severity: 'Critical',
    occurredAt: '2026-11-11T09:40:00', filedAt: '2026-11-11T09:52:00', status: 'In Progress',
    summary: 'Exposed live wire near walkway', description: 'Temporary panel ka cover khula tha; livel wire exposed.',
    immediateAction: 'Power isolated, cover fixed', reporterName: 'Sunita Devi', hasPhoto: true, photoUrl: '/demo/photo-wire.jpg'
  },
  {
    reference: 'SO-2603', type: 'Safety Observation', siteId: 'demo-jsr', siteName: 'Jamshedpur Works',
    category: 'PPE', area: 'Store Yard', department: 'Logistics', severity: 'Low',
    occurredAt: '2026-11-09T16:10:00', filedAt: '2026-11-09T16:30:00', status: 'Closed',
    summary: 'Worker bina safety shoes ke loading zone me', description: 'Safe behaviour counselling done on the spot.',
    immediateAction: 'Counselled, PPE issued', reporterName: 'Mohan Prasad', hasPhoto: false, photoUrl: null
  },
  {
    reference: 'NM-2604', type: 'Near Miss', siteId: 'demo-kal', siteName: 'Kalinganagar Works',
    category: 'Material Handling', area: 'CRM Gate', department: 'Dispatch', severity: 'Medium',
    occurredAt: '2026-11-12T11:05:00', filedAt: '2026-11-12T11:22:00', status: 'Open',
    summary: 'Crane load ke neeche se worker guzra', description: 'Blind spot me rigger ko load swing paas se nikla.',
    immediateAction: 'Hooter before lift made mandatory', reporterName: 'Ajay Singh', hasPhoto: false, photoUrl: null
  },
  {
    reference: 'UC-2605', type: 'Unsafe Condition', siteId: 'demo-kal', siteName: 'Kalinganagar Works',
    category: 'Housekeeping', area: 'Furni Platform', department: 'Operations', severity: 'Medium',
    occurredAt: '2026-11-08T13:15:00', filedAt: '2026-11-08T13:40:00', status: 'Closed',
    summary: 'Scrap pieces scattered on walkway', description: 'Walkway blocked by scrap; trip hazard.',
    immediateAction: 'Area cleaned and marked', reporterName: 'Pooja Kumari', hasPhoto: false, photoUrl: null
  }
];
