/**
 * ============================ DEMO FIXTURE (TEMPORARY) ============================
 * The app is currently frontend-only: no backend, no database. Everything below is sample
 * data for ONE demo location — West Bokaro (WBD) — so every form and screen can be opened
 * and reviewed on a deployed URL without any configuration.
 *
 * When the database is connected back in: replace this file with a real tenant source,
 * remove the demo directory and the sample reports, and delete the demo ribbon in
 * app/page.tsx. Nothing in here is ever written to a database.
 * ================================================================================
 */
import type { HomeFeedItem } from './home-content';
import type { Employee, Site } from './types';
import type { RecognitionGalleryItem } from '@/app/components/RewardCarousel';
import type { LoggedReport } from '@/app/components/LoggedReports';

export const DEMO_SITE_ID = 'demo-wbd';

export const DEMO_SITES: Site[] = [
  {
    id: DEMO_SITE_ID,
    name: 'West Bokaro (WBD)',
    region: 'Jharkhand',
    sosNumber: '+91 99999 00003',
    stats: { daysWithoutInjury: 12, nearMissCount: 4, safetyObservationCount: 7, trainingCount: 35 },
    lifeSavingRules: [
      { title: 'Work at height', text: 'Harness aur lifeline ke bina 1.8 m se upar kaam mat karo.' },
      { title: 'Working near water bodies', text: 'Life jacket ke bina tailing dam ke paas kaam nahi.' },
      { title: 'Heavy equipment isolation', text: 'Shovel/dumper ki maintenance se pehle isolation lagao.' },
      { title: 'Energy isolation', text: 'Machine par kaam se pehle lockout-tagout lagao.' }
    ]
  }
];

/**
 * Demo reporter records so the report form's employee lookup and the passport search can be
 * exercised without a server. Employee IDs are obvious placeholders (DEMO-…).
 */
export const DEMO_EMPLOYEES: Employee[] = [
  { id: 'demo-emp-1', empNo: 'DEMO-3001', name: 'Vikash Mahto', designation: 'Dumper Operator', siteId: DEMO_SITE_ID, department: 'Mining', skillGrade: 'A', active: true },
  { id: 'demo-emp-2', empNo: 'DEMO-3002', name: 'Anita Soren', designation: 'Technician', siteId: DEMO_SITE_ID, department: 'Electrical', skillGrade: 'C', active: true },
  { id: 'demo-emp-3', empNo: 'DEMO-3003', name: 'Ramesh Kumar', designation: 'Welder', siteId: DEMO_SITE_ID, department: 'Maintenance', skillGrade: 'B', active: true },
  { id: 'demo-emp-4', empNo: 'DEMO-3004', name: 'Sunita Devi', designation: 'Fitter', siteId: DEMO_SITE_ID, department: 'Maintenance', skillGrade: 'A', active: true },
  { id: 'demo-emp-5', empNo: 'DEMO-3005', name: 'Ajay Singh', designation: 'Crane Operator', siteId: DEMO_SITE_ID, department: 'Dispatch', skillGrade: 'A', active: true },
  { id: 'demo-emp-6', empNo: 'DEMO-3006', name: 'Pooja Kumari', designation: 'Safety Steward', siteId: DEMO_SITE_ID, department: 'Operations', skillGrade: 'B', active: true }
];

/**
 * In-memory directory mirroring the real directory contract (debounced search plus exact
 * Employee ID match), so the UI paths stay the same when a server directory is added back.
 */
export function demoDirectory(records: readonly Employee[] = DEMO_EMPLOYEES) {
  const bySite = (siteId: string) => records.filter((employee) => !siteId || employee.siteId === siteId);
  const like = (siteId: string, query: string) => {
    const needle = query.trim().toLowerCase();
    if (!needle) return [];
    return bySite(siteId).filter((employee) =>
      employee.name.toLowerCase().includes(needle) || employee.empNo.toLowerCase().includes(needle)
    );
  };
  return {
    mode: 'master' as const,
    minQueryLength: 2,
    async search(siteId: string, query: string) { return like(siteId, query); },
    async findByEmployeeNo(siteId: string, employeeNo: string) {
      const needle = employeeNo.trim().toLowerCase();
      return bySite(siteId).find((employee) => employee.empNo.toLowerCase() === needle) ?? null;
    }
  };
}

export const DEMO_FEED: HomeFeedItem[] = [
  {
    id: 'demo-ev-1', type: 'Event', siteId: DEMO_SITE_ID,
    title: 'Tailing Dam Emergency Drill', date: '2026-11-28T09:30:00',
    summary: 'Dam breach siren aur evacuation route drill.',
    details: 'West Bokaro ke sabhi shift workers ke liye. Assembly point: Gate 2.',
    location: 'Tailing Dam Gate'
  },
  {
    id: 'demo-ev-2', type: 'Event', siteId: DEMO_SITE_ID,
    title: 'Dumper Safety Toolbox Talk', date: '2026-12-02T08:00:00',
    summary: 'Blind spot aur reversing procedure par session.',
    details: 'Sabhi dumper operators aur spotters ke liye.',
    location: 'Dumper Workshop'
  },
  {
    id: 'demo-ci-1', type: 'Circular', siteId: DEMO_SITE_ID,
    title: 'Revised isolation procedure — WBD', date: '2026-11-15T10:00:00',
    summary: 'Dumper/shovel maintenance isolation checklist update.',
    details: 'Purana checklist 20 Nov se invalid hai. Naya checklist workshop notice board par hai.'
  },
  {
    id: 'demo-no-1', type: 'Notice', siteId: DEMO_SITE_ID,
    title: 'Notice: Hot work permit timing change', date: '2026-11-18T16:00:00',
    summary: 'Hot work permit ab 6 AM se 6 PM tak hi jari hoga.',
    details: 'Night shift me hot work ke liye alag approval chahiye.'
  }
];

export const DEMO_RECOGNITIONS: RecognitionGalleryItem[] = [
  { id: 'demo-rw-1', siteId: DEMO_SITE_ID, altText: 'Reward — West Bokaro', artworkIndex: 0, isPublished: true, employeeName: 'Anita Soren', designation: 'Technician', rewardFor: 'Reported 5 hazards in a month' },
  { id: 'demo-rw-2', siteId: DEMO_SITE_ID, altText: 'Reward — West Bokaro', artworkIndex: 1, isPublished: true, employeeName: 'Vikash Mahto', designation: 'Dumper Operator', rewardFor: 'Stopped a lift with a damaged sling' },
  { id: 'demo-rw-3', siteId: DEMO_SITE_ID, altText: 'Reward — West Bokaro', artworkIndex: 2, isPublished: true, employeeName: 'Pooja Kumari', designation: 'Safety Steward', rewardFor: 'Best safety observation of the month' }
];

/** Site-tagged sample reports so the View Reports location dropdown is reviewable. */
export const DEMO_REPORTS: LoggedReport[] = [
  {
    reference: 'HZ-3006', type: 'Hazard', siteId: DEMO_SITE_ID, siteName: 'West Bokaro (WBD)',
    category: 'Mechanical', area: 'Dumper Workshop', department: 'Mining', severity: 'Major',
    occurredAt: '2026-11-16T08:15:00', filedAt: '2026-11-16T08:40:00', status: 'In Progress',
    summary: 'Dumper hydraulic hose me leak',
    description: 'Dumper-07 ki hydraulic hose me leak tha; high pressure spray ka risk.',
    immediateAction: 'Machine isolated, hose replaced', reporterName: 'Vikash Mahto', hasPhoto: false, photoUrl: null
  },
  {
    reference: 'NM-3007', type: 'Near Miss', siteId: DEMO_SITE_ID, siteName: 'West Bokaro (WBD)',
    category: 'Physical', area: 'Tailing Dam', department: 'Mining', severity: 'High',
    occurredAt: '2026-11-14T13:20:00', filedAt: '2026-11-14T13:55:00', status: 'Open',
    summary: 'Slippery walkway near tailing dam',
    description: 'Mud ke karan walkway slippery ho gayi thi; worker slip hone se bacha.',
    immediateAction: 'Area barricaded, sand spread', reporterName: 'Anita Soren', hasPhoto: true, photoUrl: '/demo/photo-oil-spill.jpg'
  },
  {
    reference: 'SO-3008', type: 'Safety Observation', siteId: DEMO_SITE_ID, siteName: 'West Bokaro (WBD)',
    category: 'Electrical', area: 'Workshop Bay 2', department: 'Electrical', severity: 'Critical',
    occurredAt: '2026-11-11T09:40:00', filedAt: '2026-11-11T09:52:00', status: 'Closed',
    summary: 'Exposed live wire near walkway',
    description: 'Temporary panel ka cover khula tha; live wire exposed.',
    immediateAction: 'Power isolated, cover fixed', reporterName: 'Sunita Devi', hasPhoto: true, photoUrl: '/demo/photo-wire.jpg'
  },
  {
    reference: 'UC-3009', type: 'Unsafe Condition', siteId: DEMO_SITE_ID, siteName: 'West Bokaro (WBD)',
    category: 'Physical', area: 'Store Yard', department: 'Logistics', severity: 'Moderate',
    occurredAt: '2026-11-09T16:10:00', filedAt: '2026-11-09T16:30:00', status: 'Closed',
    summary: 'Scrap pieces scattered on walkway',
    description: 'Walkway blocked by scrap; trip hazard.',
    immediateAction: 'Area cleaned and marked', reporterName: 'Ajay Singh', hasPhoto: false, photoUrl: null
  },
  {
    reference: 'SO-3010', type: 'Safety Observation', siteId: DEMO_SITE_ID, siteName: 'West Bokaro (WBD)',
    category: 'Ergonomical', area: 'Loading Zone', department: 'Dispatch', severity: 'Minor',
    occurredAt: '2026-11-08T11:05:00', filedAt: '2026-11-08T11:22:00', status: 'Open',
    summary: 'Manual lifting without trolley',
    description: 'Workers 25 kg bags manually utha rahe the; trolley available nahi tha.',
    immediateAction: 'Trolley arranged for the shift', reporterName: 'Pooja Kumari', hasPhoto: false, photoUrl: null
  }
];
