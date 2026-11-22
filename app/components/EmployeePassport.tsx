'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  ArrowDown, ArrowLeft, ArrowRight, Award, BriefcaseBusiness, Building2, CalendarDays,
  CheckCircle2, ChevronRight, ClipboardCheck, Copy, Download, Eye, FileSpreadsheet, Gavel, GraduationCap,
  HeartPulse, IdCard, KeyRound, Lightbulb, Lock, Mail, MapPin, Megaphone, MessageSquare, Phone, Printer,
  Search, ShieldAlert, ShieldCheck, SlidersHorizontal, Smartphone, TriangleAlert, UserRound, X
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Employee, Site } from '@/lib/types';
import { normalizeMobile, validOtpCode, validRegisteredMobile, type PrivateAccessGateway } from '@/lib/private-access';
import { useI18n } from './I18nProvider';
import './employee-passport.css';
import { initials } from '@/lib/initials';

type Category =
  | 'nearMiss' | 'hazard' | 'safetyObservation'
  | 'training' | 'rewards'
  | 'feedbackSuggestion' | 'grievanceSpeakUp' | 'consequence';
/**
 * `tag` carries the sub-type for merged cards (UC / UA / Safe Observation inside Safety
 * Observation; Feedback vs Suggestion; Grievance vs Speak Up) so one table holds them all.
 */
type HistoryRow = { id?: string; date: string; isoDate?: string; title: string; detail: string; status: string; severity?: string; tag?: string };
export type PassportHistory = Partial<Record<Category, HistoryRow[]>>;

type CardConfig = {
  label: string;
  caption: string;
  badge: string;
  icon: LucideIcon;
  tone: string;
  columns: string[];
  severity?: boolean;
  /** Header of the sub-type column slot between the detail and severity columns. */
  tagHeader?: string;
  /**
   * Locked sections never show counts in public search. They open only after the
   * employee verifies the registered mobile number with a server-issued OTP.
   */
  locked?: boolean;
};

/**
 * Safety Record Summary cards. UC/UA/Safe Observation records live together under one
 * Safety Observation card; Feedback + Suggestion and Grievance + Speak Up are merged
 * private pairs; the Consequence Record (warnings, suspensions) is private too.
 */
const CATEGORY: Record<Category, CardConfig> = {
  nearMiss: { label: 'Near Miss', caption: 'Incidents reported', badge: 'Logged', icon: ShieldCheck, tone: 'emerald', columns: ['Date', 'Location', 'Description', 'Severity', 'Status'], severity: true },
  hazard: { label: 'Hazard Reports', caption: 'Identified risks', badge: 'Reported', icon: ShieldAlert, tone: 'rose', columns: ['Date', 'Location', 'Hazard', 'Severity', 'Status'], severity: true },
  safetyObservation: { label: 'Safety Observation (UC/UA)', caption: 'UC · UA · Safe observations', badge: 'Logged', icon: Eye, tone: 'blue', columns: ['Date', 'Location', 'Observation', 'Type', 'Severity', 'Status'], severity: true, tagHeader: 'Type' },
  training: { label: 'Training Records', caption: 'Sessions attended', badge: 'Completed', icon: GraduationCap, tone: 'sky', columns: ['Date', 'Training', 'Duration', 'Status'] },
  rewards: { label: 'Rewards Records', caption: 'Recognitions', badge: 'Earned', icon: Award, tone: 'violet', columns: ['Date', 'Title', 'Reason', 'Status'] },
  feedbackSuggestion: { label: 'Feedback & Suggestion', caption: 'Verify by OTP to view', badge: '', icon: MessageSquare, tone: 'teal', columns: ['Date', 'Topic', 'Details', 'Type', 'Status'], tagHeader: 'Type', locked: true },
  grievanceSpeakUp: { label: 'Grievance & Speak Up', caption: 'Verify by OTP to view', badge: '', icon: Megaphone, tone: 'amber', columns: ['Date', 'Subject', 'Details', 'Type', 'Status'], tagHeader: 'Type', locked: true },
  consequence: { label: 'Consequence Record', caption: 'Warnings & suspensions', badge: '', icon: Gavel, tone: 'red', columns: ['Date', 'Action', 'Reason', 'Status'], locked: true }
};

const SUMMARY_CARDS: Category[] = [
  'nearMiss', 'hazard', 'safetyObservation', 'training', 'rewards', 'feedbackSuggestion', 'grievanceSpeakUp', 'consequence'
];

function exportCsv(rows: HistoryRow[], category: Category, employeeNo: string) {
  const headers = CATEGORY[category].columns;
  const escape = (value: string) => `"${value.replaceAll('"', '""')}"`;
  // Prepend an apostrophe to spreadsheet formula prefixes to prevent CSV injection.
  const safe = (value: string) => escape(/^[\s]*[=+@\-\t\r]/.test(value) ? `'${value}` : value);
  const csv = '\uFEFF' + [
    headers.join(','),
    ...rows.map((row) => [row.date, row.title, row.detail, ...(CATEGORY[category].tagHeader ? [row.tag ?? ''] : []), ...(CATEGORY[category].severity ? [row.severity ?? ''] : []), row.status].map(safe).join(','))
  ].join('\r\n');
  const href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = href;
  link.download = `${employeeNo.replace(/[^\w-]/g, '')}_${category}_records.csv`;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(href), 1000);
}

function formatPassportDate(date: Date) {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  }).format(date);
}

async function copyToClipboard(text: string) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const field = document.createElement('textarea');
  field.value = text;
  field.style.position = 'fixed';
  field.style.opacity = '0';
  document.body.append(field);
  field.focus();
  field.select();
  const copied = document.execCommand('copy');
  field.remove();
  if (!copied) throw new Error('copy failed');
}

type DetailRow = {
  label: string;
  value: string;
  icon: LucideIcon;
  /** `restricted` = withheld by policy, `missing` = no source column yet. */
  state?: 'restricted' | 'missing' | 'accent' | 'danger';
};

/**
 * Employee Safety Passport.
 *
 * Public lookup returns only directory-safe fields, so this renders exactly those and
 * labels the rest honestly: "Verified staff access required" for PII (mobile, blood group,
 * address, date of birth) and "Not on record" for fields the master does not hold yet
 * (photo, email, joining date, pass validity). No sample employee, photo or record count
 * is ever invented, and no fabricated history is drawn when a source is empty.
 */
/** OTP entry steps for a locked (private) section; reset whenever the dialog closes. */
type PrivateUnlock = {
  category: Category;
  mobile: string;
  otp: string;
  stage: 'mobileEntry' | 'otpEntry';
  busy: boolean;
  error: string | null;
  /** Set only after the gateway accepted the OTP — gates opening the records table. */
  verified: boolean;
};

export default function EmployeePassport({ employee, site, companyName, onBack, onClose, history = {}, privateAccess = null, profileQrPath = '/' }: {
  employee: Employee;
  site: Site | null;
  companyName?: string | null;
  onBack: () => void;
  onClose: () => void;
  history?: PassportHistory;
  /**
   * Server-backed OTP service for private sections. Absent (null) means the private
   * cards fail closed: the unlock dialog opens but cannot send an OTP.
   */
  privateAccess?: PrivateAccessGateway | null;
  /**
   * Path the footer QR points to (on this app's origin) followed by ?emp=<Employee ID>.
   * Default '/' keeps the URL identical to the home page; the design-preview route passes
   * '/passport-preview' so its demo QR reopens the demo search rather than the real app.
   */
  profileQrPath?: string;
}) {
  const { T } = useI18n();
  const sheetRef = useRef<HTMLDivElement>(null);
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All statuses');
  const [sort, setSort] = useState('Newest first');
  const [page, setPage] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');
  const [toast, setToast] = useState('');
  const [generatedAt] = useState(() => new Date());
  const [qrUrl, setQrUrl] = useState('');
  const [unlock, setUnlock] = useState<PrivateUnlock | null>(null);

  // The QR holds a URL on the home page (no extra route like /safety-passport): a scan
  // lands on {origin}/?emp=… and the app auto-opens THIS employee's profile, no typing.
  useEffect(() => {
    setQrUrl(`${window.location.origin}${profileQrPath}?emp=${encodeURIComponent(employee.empNo)}`);
  }, [employee.empNo, profileQrPath]);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (unlock) setUnlock(null);
      else if (activeCategory) setActiveCategory(null);
      else onClose();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [unlock, activeCategory, onClose]);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  // `undefined` means the server withheld the credential; `null` means it is not recorded.
  const passRevealed = employee.safetyPassNo !== undefined;
  const passNumber = typeof employee.safetyPassNo === 'string' && employee.safetyPassNo.trim()
    ? employee.safetyPassNo.trim()
    : null;
  const isActive = employee.active !== false;
  const employer = companyName?.trim() || 'Company not on record';
  const siteLabel = site ? `${site.name}${site.region ? ` · ${site.region}` : ''}` : 'Site not selected';

  const detailRows: DetailRow[] = ([
    { label: 'Full Name', value: employee.name, icon: UserRound },
    { label: 'Employee ID', value: employee.empNo, icon: IdCard },
    { label: 'Safety Pass Validity', value: 'Not on record', icon: CalendarDays, state: 'missing' },
    { label: 'Designation', value: employee.designation || 'Not on record', icon: BriefcaseBusiness },
    { label: 'Department', value: employee.department || 'Not on record', icon: BriefcaseBusiness, state: employee.department ? undefined : 'missing' },
    { label: 'Blood Group', value: 'Verified staff access required', icon: HeartPulse, state: 'restricted' },
    { label: 'Skill Grade', value: employee.skillGrade || 'Not on record', icon: Award, state: employee.skillGrade ? 'accent' : 'missing' },
    { label: 'Mobile No.', value: 'Verified staff access required', icon: Phone, state: 'restricted' },
    { label: 'Email ID', value: 'Not on record', icon: Mail, state: 'missing' },
    { label: 'Company', value: employer, icon: Building2 },
    { label: 'Site / Location', value: siteLabel, icon: MapPin },
    { label: 'Address', value: 'Verified staff access required', icon: MapPin, state: 'restricted' },
    { label: 'Joining Date', value: 'Not on record', icon: CalendarDays, state: 'missing' }
  ] as (Omit<DetailRow, 'icon'> & { icon?: LucideIcon })[]).map((row) => ({
    ...row,
    // Identity rows carry no icon in the design, so give them the same footprint.
    icon: row.icon ?? UserRound
  }));

  const allRows = activeCategory ? history[activeCategory] ?? [] : [];
  const statuses = [...new Set(allRows.map((row) => row.status))];
  const filtered = allRows
    .filter((row) => (filter === 'All statuses' || row.status === filter)
      && `${row.date} ${row.title} ${row.detail} ${row.tag ?? ''} ${row.status}`.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const compare = (Date.parse(a.isoDate ?? a.date) || 0) - (Date.parse(b.isoDate ?? b.date) || 0);
      return sort === 'Oldest first' ? compare : -compare;
    });
  const pageCount = Math.max(1, Math.ceil(filtered.length / 8));
  const visible = filtered.slice(page * 8, page * 8 + 8);
  const active = activeCategory ? CATEGORY[activeCategory] : null;

  const trainingRows = useMemo(() => (history.training ?? []).slice(0, 3), [history.training]);

  function openHistory(category: Category) {
    setSearch(''); setFilter('All statuses'); setSort('Newest first'); setPage(0);
    setActiveCategory(category);
  }

  /**
   * Locked cards never open directly: the employee first proves the registered mobile
   * by OTP. Records open only after the gateway confirms, and reveal whatever exists —
   * an empty table honestly shows "no records" rather than implying an error.
   */
  function requestPrivateSection(category: Category) {
    setUnlock({ category, mobile: '', otp: '', stage: 'mobileEntry', busy: false, error: null, verified: false });
  }

  async function sendOtp() {
    if (!unlock || unlock.busy) return;
    const mobile = normalizeMobile(unlock.mobile);
    if (!validRegisteredMobile(unlock.mobile)) {
      setUnlock({ ...unlock, error: 'Enter the 10-digit mobile number registered with the company.' });
      return;
    }
    if (!privateAccess) {
      setUnlock({ ...unlock, error: 'OTP is not connected on this portal yet. Ask the safety team for your records.' });
      return;
    }
    setUnlock({ ...unlock, busy: true, error: null });
    try {
      await privateAccess.sendOtp(mobile);
      setUnlock((current) => current && { ...current, mobile, busy: false, stage: 'otpEntry', otp: '' });
    } catch {
      setUnlock((current) => current && { ...current, busy: false, error: 'Could not send an OTP to this number. Check the registered number and try again.' });
    }
  }

  async function verifyOtp() {
    if (!unlock || unlock.busy || !privateAccess) return;
    if (!validOtpCode(unlock.otp)) {
      setUnlock((current) => current && { ...current, error: 'Enter the 6-digit OTP sent to your mobile.' });
      return;
    }
    const { mobile, otp, category } = unlock;
    setUnlock((current) => current && { ...current, busy: true, error: null });
    let ok = false;
    try {
      ok = await privateAccess.verifyOtp(mobile, otp.trim());
    } catch {
      setUnlock((current) => current && { ...current, busy: false, error: 'Verification failed. Try again in a moment.' });
      return;
    }
    if (!ok) {
      setUnlock((current) => current && { ...current, busy: false, otp: '', error: 'Incorrect or expired OTP. Check the SMS and try again.' });
      return;
    }
    setUnlock(null);
    openHistory(category);
  }

  async function copyPassNumber() {
    if (!passNumber) return;
    try {
      await copyToClipboard(passNumber);
      setToast('Safety Pass Number copied');
    } catch {
      setToast('Could not copy the pass number');
    }
  }

  async function downloadPassport() {
    if (!sheetRef.current || downloading) return;
    setDownloadError(''); setDownloading(true);
    try {
      const { toPng } = await import('html-to-image');
      const data = await toPng(sheetRef.current, {
        backgroundColor: '#eef3f9', pixelRatio: 2, cacheBust: true,
        // Match the sheet's actual on-screen width and height; don't export the overlay/toolbar.
        width: sheetRef.current.scrollWidth, height: sheetRef.current.scrollHeight
      });
      const name = employee.name.trim().replace(/[^a-z\d]+/gi, '_').replace(/^_|_$/g, '').slice(0, 72) || 'Employee';
      const code = employee.empNo.replace(/[^a-z\d]/gi, '') || 'Employee';
      const link = document.createElement('a');
      link.download = `${code}_${name}_Safety_Profile.png`;
      link.href = data;
      document.body.append(link); link.click(); link.remove();
    } catch {
      setDownloadError('Could not capture the passport image. Please try again in this browser.');
    } finally { setDownloading(false); }
  }

  return <div className="passport-overlay" role="dialog" aria-modal="true" aria-label="Employee Safety Passport">
    <div className="passport-scroll">
      <div className="passport-toolbar">
        <button type="button" onClick={onBack}><ArrowLeft size={16} /> {T('Search another employee')}</button>
        <span>EMPLOYEE DIRECTORY <span aria-hidden="true">/</span> SAFETY PASSPORT</span>
        <button type="button" className="passport-close" onClick={onClose} aria-label={T('Close employee profile')}><X size={19} /></button>
      </div>

      {downloadError && <p className="passport-download-error" role="alert">{downloadError}</p>}
      {toast && <p className="passport-toast" role="status"><CheckCircle2 size={16} /> {toast}</p>}

      <div className="passport-frame">
        <div className="passport-sheet" ref={sheetRef} aria-hidden={Boolean(activeCategory)}>
          <header className="pp-hero">
            <div className="pp-hero-main">
              <span className="pp-hero-icon"><IdCard size={24} /></span>
              <div>
                <h1>Employee Safety Passport</h1>
                <p>Digital safety credential &amp; records portal</p>
              </div>
            </div>
            <div className={`pp-hero-status ${isActive ? '' : 'is-inactive'}`}>
              <span className="pp-dot" aria-hidden="true" />
              {isActive ? 'Active employee record' : 'Inactive employee record'}
            </div>
          </header>

          <div className="pp-ribbon">
            <ShieldCheck size={14} /> Directory-only preview <span>·</span> Not a verified ID or safety clearance
          </div>

          <div className="pp-body">
            <div className="pp-columns">
              <div className="pp-col-main">

                <section className="pp-card pp-profile" aria-label="Employee profile">
                  <div className={`pp-avatar ${isActive ? '' : 'is-inactive'}`} aria-label="Employee photograph not on record">
                    <span>{initials(employee.name)}</span>
                  </div>
                  <div className="pp-profile-copy">
                    <span className={`pp-chip ${isActive ? 'active' : 'inactive'}`}>
                      {isActive ? <CheckCircle2 size={12} /> : <ShieldAlert size={12} />}
                      {isActive ? 'Active' : 'Inactive'}
                    </span>
                    <h2>{employee.name}</h2>
                    <p className="pp-empno">EMP ID : <strong>{employee.empNo}</strong></p>
                    {passNumber
                      ? <div className="pp-pass">
                          <span>Safety Pass No:</span>
                          <strong>{passNumber}</strong>
                          <button type="button" onClick={() => void copyPassNumber()} title="Copy pass number" aria-label="Copy Safety Pass Number"><Copy size={13} /></button>
                        </div>
                      : <div className="pp-pass is-locked">
                          <Lock size={12} />
                          <span>{passRevealed ? 'Safety pass number not on record' : 'Safety pass number · verified staff access'}</span>
                        </div>}
                    <p className="pp-photo-note">Photograph not on record · initials shown instead</p>
                  </div>
                </section>

                <section className="pp-card" aria-labelledby="pp-details-title">
                  <div className="pp-card-head">
                    <span className="pp-head-icon blue"><UserRound size={17} /></span>
                    <div className="pp-head-copy">
                      <h3 id="pp-details-title">Personal Details</h3>
                      <p>Directory-approved employee information</p>
                    </div>
                    <span className="pp-head-note"><Lock size={12} /> Privacy protected</span>
                  </div>
                  <dl className="pp-details">
                    {detailRows.map(({ label, value, icon: Icon, state }) => <div key={label} className={state === 'accent' ? 'is-accent' : ''}>
                      <dt><Icon size={14} aria-hidden="true" />{label}</dt>
                      <dd className={`${state ? `is-${state}` : ''}`}>{state === 'restricted' && <Lock size={11} aria-hidden="true" />}{value}</dd>
                    </div>)}
                  </dl>
                  <p className="pp-note"><ShieldCheck size={14} /> Mobile number, blood group, address and date of birth are withheld from public search. Ask a verified safety officer for an authorised record.</p>
                </section>

                <section className="pp-card" aria-labelledby="pp-summary-title">
                  <div className="pp-card-head">
                    <span className="pp-head-icon blue"><ClipboardCheck size={17} /></span>
                    <div className="pp-head-copy">
                      <h3 id="pp-summary-title">Safety Record Summary</h3>
                      <p>Overview of logged safety metrics &amp; activities</p>
                    </div>
                    <span className="pp-head-note">Not connected</span>
                  </div>
                  <div className="pp-kpi-grid">
                    {SUMMARY_CARDS.map((category) => {
                      const config = CATEGORY[category];
                      const Icon = config.icon;
                      // A locked category is privacy-protected: records may exist, but the
                      // passport shows no count; the card opens an OTP gate, not the table.
                      const rows = config.locked ? undefined : history[category];
                      return config.locked
                        ? <button key={category} type="button" className={`pp-kpi ${config.tone} is-locked`} onClick={() => requestPrivateSection(category)} aria-haspopup="dialog" aria-label={`${config.label} · private — verify your registered mobile by OTP to view`}>
                          <span className="pp-kpi-top">
                            <span className="pp-kpi-icon"><Icon size={15} /></span>
                            <span className="pp-kpi-badge"><Lock size={10} aria-hidden="true" /></span>
                          </span>
                          <span className="pp-kpi-value">🔒</span>
                          <span className="pp-kpi-label">{config.label}</span>
                          <span className="pp-kpi-caption">Tap to verify & view</span>
                        </button>
                        : <button key={category} type="button" className={`pp-kpi ${config.tone}`} onClick={() => openHistory(category)} aria-label={`Open ${config.label} records`}>
                          <span className="pp-kpi-top">
                            <span className="pp-kpi-icon"><Icon size={15} /></span>
                            <span className="pp-kpi-badge">{rows ? config.badge : null}</span>
                          </span>
                          <span className="pp-kpi-value">{rows ? String(rows.length).padStart(2, '0') : '—'}</span>
                          <span className="pp-kpi-label">{config.label}</span>
                          <span className="pp-kpi-caption">{rows ? config.caption : 'Requires staff access'}</span>
                        </button>;
                    })}
                  </div>
                  <p className="pp-note"><Lock size={14} /> Feedback &amp; Suggestion, Grievance &amp; Speak Up and the Consequence Record are private: they open only after OTP verification on your registered mobile number. Other record counts are personal performance data — public search shows none.</p>
                </section>
              </div>

              <div className="pp-col-side">
                <section className="pp-card" aria-labelledby="pp-training-title">
                  <div className="pp-card-head">
                    <span className="pp-head-icon blue"><GraduationCap size={17} /></span>
                    <div className="pp-head-copy">
                      <h3 id="pp-training-title">Latest Training Records</h3>
                      <p>Completed safety sessions</p>
                    </div>
                    <button type="button" className="pp-link" onClick={() => openHistory('training')}>View all <ChevronRight size={12} /></button>
                  </div>
                  <div className="pp-training-list">
                    {trainingRows.length ? trainingRows.map((row, index) => <div className="pp-training-row" key={row.id ?? `${row.date}-${row.title}-${index}`}>
                      <span className="pp-training-icon"><GraduationCap size={16} /></span>
                      <div><b>{row.title}</b><small>{row.date}</small></div>
                      <span className="pp-status">{row.status}</span>
                    </div>) : <div className="pp-empty"><GraduationCap size={22} /><b>No training records connected</b><span>Training history is not linked to public lookup yet. Nothing is inferred from an Employee ID.</span></div>}
                  </div>
                </section>

                <div className="pp-actions">
                  <button type="button" className="pp-action primary" onClick={() => void downloadPassport()} disabled={downloading}>
                    <Download size={17} /> {downloading ? 'Generating…' : 'Download Profile'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <footer className="pp-footer">
            <div className="pp-qr">{qrUrl ? <QRCodeSVG value={qrUrl} size={60} marginSize={0} title="Scan to open this profile" aria-label="QR code — scanning opens this employee's profile" /> : <ShieldCheck size={42} />}</div>
            <div className="pp-footer-person">
              <b>{employee.empNo}</b>
              <strong>{employee.name}</strong>
              <span>{employee.designation || 'Designation not on record'} · {site?.name ?? 'Site not selected'}</span>
              <small>{employer}</small>
            </div>
            <div className="pp-footer-meta">
              <span><CalendarDays size={13} /> Generated on</span>
              <time dateTime={generatedAt.toISOString()}>{formatPassportDate(generatedAt)}</time>
              <b>Powered by <em>Safex</em></b>
            </div>
          </footer>
          <p className="pp-footline">{employer} · Employee Safety Management System · Generated from the Safex employee directory</p>
        </div>
      </div>
    </div>

    {unlock && <div className="pp-private-overlay" role="dialog" aria-modal="true" aria-labelledby="pp-private-title">
      <div className="pp-private-dialog">
        <header className="pp-private-head">
          <span className="pp-private-icon"><KeyRound size={18} aria-hidden="true" /></span>
          <div className="pp-private-head-copy">
            <span className="pp-private-eyebrow">PRIVATE SECTION · {CATEGORY[unlock.category].label}</span>
            <h2 id="pp-private-title">{unlock.stage === 'mobileEntry' ? 'Verify your mobile number' : 'Enter the OTP'}</h2>
          </div>
          <button type="button" className="pp-private-close" onClick={() => setUnlock(null)} aria-label="Close verification"><X size={18} /></button>
        </header>
        <p className="pp-private-lead">
          {unlock.stage === 'mobileEntry'
            ? `${CATEGORY[unlock.category].label} records are private. Enter the mobile number registered with ${employer} to receive an OTP on SMS.`
            : `An OTP was sent to +91 ••••••${unlock.mobile.slice(-4)}. Enter it to view your ${CATEGORY[unlock.category].label} records, if any.`}
        </p>
        {unlock.stage === 'mobileEntry' ? (
          <>
            <label className="pp-private-label">
              <span>Registered mobile number</span>
              <span className="pp-private-input-row">
                <Smartphone size={17} aria-hidden="true" />
                <input
                  className="pp-private-input"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  maxLength={14}
                  value={unlock.mobile}
                  onChange={(event) => setUnlock({ ...unlock, mobile: event.target.value.replace(/[^\d+\s]/g, ''), error: null })}
                  placeholder="e.g. 98765 43210"
                  aria-label="Registered mobile number"
                />
              </span>
            </label>
            {!privateAccess && <p className="pp-private-unavailable" role="status"><Lock size={13} aria-hidden="true" /> OTP verification needs the server SMS service, which is not connected to this portal yet.</p>}
          </>
        ) : (
          <>
            <label className="pp-private-label">
              <span>6-digit OTP</span>
              <input
                className="pp-private-input pp-private-otp"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={unlock.otp}
                onChange={(event) => setUnlock({ ...unlock, otp: event.target.value.replace(/\D/g, ''), error: null })}
                placeholder="••••••"
                aria-label="One-time password"
                autoFocus
              />
            </label>
            <button type="button" className="pp-private-link" onClick={() => setUnlock({ ...unlock, stage: 'mobileEntry', otp: '', error: null })}>Wrong number? Change it</button>
          </>
        )}
        {unlock.error && <p className="pp-private-error" role="alert">{unlock.error}</p>}
        <div className="pp-private-actions">
          {unlock.stage === 'mobileEntry'
            ? <button type="button" className="pp-private-primary" disabled={unlock.busy || !privateAccess} onClick={() => void sendOtp()}><Smartphone size={16} aria-hidden="true" /> {unlock.busy ? 'Sending OTP…' : 'Send OTP'}</button>
            : <>
                <button type="button" className="pp-private-primary" disabled={unlock.busy || unlock.otp.length !== 6} onClick={() => void verifyOtp()}><KeyRound size={16} aria-hidden="true" /> {unlock.busy ? 'Verifying…' : `Verify & open ${CATEGORY[unlock.category].label}`}</button>
                <button type="button" className="pp-private-link" disabled={unlock.busy} onClick={() => void sendOtp()}>Resend OTP</button>
              </>}
        </div>
      </div>
    </div>}

    {activeCategory && active && <div className="passport-record-overlay" role="dialog" aria-modal="true" aria-labelledby="passport-record-title">
      <div className="passport-record-dialog">
        <header>
          <span className={`passport-record-icon ${active.tone}`}><active.icon size={21} /></span>
          <div><span>EMPLOYEE PASSPORT / RECORDS</span><h2 id="passport-record-title">{active.label}</h2></div>
          <button type="button" aria-label="Close records" onClick={() => setActiveCategory(null)}><X size={20} /></button>
        </header>
        <div className="passport-record-tools">
          <label><Search size={16} /><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(0); }} placeholder="Search records…" aria-label="Search records" /></label>
          <label><SlidersHorizontal size={15} /><select aria-label="Filter by status" value={filter} onChange={(event) => { setFilter(event.target.value); setPage(0); }}><option>All statuses</option>{statuses.map((status) => <option key={status}>{status}</option>)}</select></label>
          <label><ArrowDown size={15} /><select aria-label="Sort records" value={sort} onChange={(event) => setSort(event.target.value)}><option>Newest first</option><option>Oldest first</option></select></label>
        </div>
        <div className="passport-table-scroll">
          <table>
            <thead><tr>{active.columns.map((column) => <th key={column}>{column}</th>)}</tr></thead>
            <tbody>{visible.length ? visible.map((row, index) => <tr key={row.id ?? `${row.date}-${row.title}-${index}`}>
              <td>{row.date}</td><td>{row.title}</td><td>{row.detail}</td>
              {active.tagHeader && <td>{row.tag ? <span className="passport-tag">{row.tag}</span> : '—'}</td>}
              {active.severity && <td>{row.severity || '—'}</td>}
              <td><span className="passport-status">{row.status}</span></td>
            </tr>) : <tr><td colSpan={active.columns.length} className="passport-table-empty"><Lock size={20} /> {allRows.length
                ? 'No matching records.'
                : active.locked
                  ? `No ${active.label.toLowerCase()} records are linked to your Employee ID.`
                  : 'Records for this category are not connected yet. No sample history is shown.'}</td></tr>}</tbody>
          </table>
        </div>
        <footer>
          <span>{filtered.length ? `${filtered.length} records · Page ${page + 1} of ${pageCount}` : 'No records available'}</span>
          <div className="passport-record-pages">
            <button type="button" disabled={!page} onClick={() => setPage((value) => value - 1)} aria-label="Previous page"><ArrowLeft size={16} /></button>
            <button type="button" disabled={page + 1 >= pageCount} onClick={() => setPage((value) => value + 1)} aria-label="Next page"><ArrowRight size={16} /></button>
          </div>
          <button type="button" disabled={!filtered.length} title={!filtered.length ? 'No records to export' : 'Export Excel-compatible CSV'} onClick={() => exportCsv(filtered, activeCategory, employee.empNo)}><FileSpreadsheet size={16} /> Export Excel (CSV)</button>
          <button type="button" disabled={!filtered.length} title={!filtered.length ? 'No records to print' : 'Print records'} onClick={() => window.print()}><Printer size={16} /> Print</button>
        </footer>
      </div>
    </div>}
  </div>;
}
