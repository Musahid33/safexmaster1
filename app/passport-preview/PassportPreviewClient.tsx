'use client';

/**
 * DESIGN PREVIEW ONLY — shows which screen opens after an Employee ID match and how
 * it looks, using one invented sample employee. Not wired to the real directory;
 * gated to development mode by app/passport-preview/page.tsx.
 */
import { useEffect, useMemo, useState } from 'react';
import ProfileSearchDialog from '@/app/components/ProfileSearchDialog';
import type { PassportHistory } from '@/app/components/EmployeePassport';
import type { EmployeeDirectory } from '@/lib/employee-directory';
import type { PrivateAccessGateway } from '@/lib/private-access';
import type { Employee, Site } from '@/lib/types';

const DEMO_SITE: Site = { id: '11111111-1111-4111-8111-111111111111', name: 'Jamshedpur Works', region: 'Jharkhand', sosNumber: null };

const DEMO_EMPLOYEE: Employee = {
  id: '22222222-2222-4222-8222-222222222222',
  empNo: '1001',
  name: 'Ramesh Kumar',
  designation: 'Fitter – Grade II',
  siteId: DEMO_SITE.id,
  department: 'Mechanical Maintenance',
  skillGrade: 'Skilled – A',
  active: true
};

const DEMO_HISTORY: PassportHistory = {
  nearMiss: [
    { date: '12 Nov 2026', isoDate: '2026-11-12T00:00:00Z', title: 'Workshop bay 3', detail: 'Crane hook swung over walkway', severity: 'High', status: 'Closed' },
    { date: '28 Oct 2026', isoDate: '2026-10-28T00:00:00Z', title: 'Loading dock', detail: 'Forklift reversed near pedestrian line', severity: 'Medium', status: 'In Progress' }
  ],
  hazard: [
    { date: '03 Nov 2026', isoDate: '2026-11-03T00:00:00Z', title: 'Substation corridor', detail: 'Oil spillage near transformer', severity: 'High', status: 'Closed' }
  ],
  safetyObservation: [
    { date: '10 Nov 2026', isoDate: '2026-11-10T00:00:00Z', title: 'Grinding bay 2', detail: 'Guard missing on bench grinder', tag: 'UC', severity: 'High', status: 'Open' },
    { date: '26 Oct 2026', isoDate: '2026-10-26T00:00:00Z', title: 'Scaffold area', detail: 'Worked without harness anchor', tag: 'UA', severity: 'High', status: 'Closed' },
    { date: '18 Oct 2026', isoDate: '2026-10-18T00:00:00Z', title: 'Store gate 4', detail: 'Walkway kept clear of pallets', tag: 'Safe', severity: 'Low', status: 'Closed' }
  ],
  training: [
    { date: '05 Nov 2026', isoDate: '2026-11-05T00:00:00Z', title: 'Working at Height', detail: '2 hrs', status: 'Completed' },
    { date: '21 Oct 2026', isoDate: '2026-10-21T00:00:00Z', title: 'LOTO refresher', detail: '1 hr', status: 'Completed' },
    { date: '30 Sep 2026', isoDate: '2026-09-30T00:00:00Z', title: 'Fire watch duties', detail: '3 hrs', status: 'Completed' }
  ],
  rewards: [
    { date: '15 Oct 2026', isoDate: '2026-10-15T00:00:00Z', title: 'Safety Champion', detail: 'Maximum hazard reports in Q3', status: 'Awarded' }
  ],
  feedbackSuggestion: [
    { date: '09 Nov 2026', isoDate: '2026-11-09T00:00:00Z', title: 'Mirror at blind corner', detail: 'Install convex mirror at bay 2 exit', tag: 'Suggestion', status: 'Under review' },
    { date: '02 Oct 2026', isoDate: '2026-10-02T00:00:00Z', title: 'Toolbox talk quality', detail: 'Asked for Hindi handouts', tag: 'Feedback', status: 'Shared' }
  ],
  grievanceSpeakUp: [
    { date: '20 Oct 2026', isoDate: '2026-10-20T00:00:00Z', title: 'Canteen timing', detail: 'Late shift misses hot meals', tag: 'Grievance', status: 'In Progress' },
    { date: '30 Oct 2026', isoDate: '2026-10-30T00:00:00Z', title: 'Contractor shortcut', detail: 'Reported ladder misuse, fixed same day', tag: 'Speak Up', status: 'Closed' }
  ],
  consequence: [
    { date: '14 Aug 2026', isoDate: '2026-08-14T00:00:00Z', title: 'Written warning', detail: 'Helmet not worn at bay 4', status: 'Issued' },
    { date: '02 Mar 2026', isoDate: '2026-03-02T00:00:00Z', title: '1-day suspension', detail: 'Repeat PPE violation', status: 'Served' }
  ]
};

const DEMO_DIRECTORY: EmployeeDirectory = {
  mode: 'master',
  minQueryLength: 1,
  async search() { return [DEMO_EMPLOYEE]; },
  async findByEmployeeNo(_siteId, employeeNo) {
    return employeeNo.replace(/[^\d]/g, '') === '1001' ? DEMO_EMPLOYEE : null;
  }
};

export default function PassportPreviewClient() {
  const [open, setOpen] = useState(true);
  const [autoId, setAutoId] = useState<string | undefined>(undefined);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('emp');
    if (id) { setAutoId(id.toUpperCase()); setOpen(true); }
  }, []);
  const [demoOtp, setDemoOtp] = useState<string | null>(null);

  const demoGateway = useMemo<PrivateAccessGateway>(() => {
    let issued: string | null = null;
    return {
      async sendOtp() {
        issued = String(Math.floor(100000 + Math.random() * 900000));
        setDemoOtp(issued);
      },
      async verifyOtp(_mobile, otp) {
        return issued !== null && otp === issued;
      }
    };
  }, []);

  return (
    <div style={{ minHeight: '100dvh', background: '#eef3f9' }}>
      <div role="status" style={{ position: 'fixed', bottom: 12, left: '50%', transform: 'translateX(-50%)', zIndex: 200, background: '#513900', color: '#ffe9b0', borderRadius: 999, padding: '8px 16px', fontSize: 13, fontWeight: 700, boxShadow: '0 6px 18px rgba(0,0,0,.2)', whiteSpace: 'nowrap' }}>
        DESIGN PREVIEW · sample employee · Emp ID 1001{demoOtp ? ` · demo OTP: ${demoOtp}` : ' · demo OTP will appear here'}
      </div>
      {open
        ? <ProfileSearchDialog
            site={DEMO_SITE}
            sites={[DEMO_SITE]}
            companyName="Sample Steel Co."
            directory={DEMO_DIRECTORY}
            directoryMode={undefined}
            onClose={() => setOpen(false)}
            privateAccess={demoGateway}
            autoEmployeeId={autoId}
            profileQrPath="/passport-preview"
            history={DEMO_HISTORY}
          />
        : <div style={{ display: 'grid', placeItems: 'center', minHeight: '100dvh' }}>
            <button
              type="button"
              onClick={() => setOpen(true)}
              style={{ border: 0, borderRadius: 12, background: '#0f2540', color: '#fff', padding: '14px 22px', fontSize: 15, fontWeight: 800, cursor: 'pointer' }}
            >
              Reopen employee profile search
            </button>
          </div>}
    </div>
  );
}
