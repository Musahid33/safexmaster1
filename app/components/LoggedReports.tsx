'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ClipboardList, Filter, ImagePlus, Loader2, RefreshCw, Search, X } from 'lucide-react';
import { safeResourceUrl } from '@/lib/safe-url';
import type { ReportStatus, ReportType, Site } from '@/lib/types';
import { useI18n } from './I18nProvider';
import './logged-reports.css';

/**
 * "Logged reports" — every report the selected site has stored in the database.
 *
 * No Employee ID and no mobile number: the list loads by itself, newest first, and a refresh
 * button re-reads it. Tapping a report opens it in a modal with the full stored record and,
 * when one was attached, the photo (served as a short-lived signed URL).
 *
 * What the payload deliberately does not contain: employee number, mobile number, address —
 * anything that would turn a public feed into a contact list. The reporter's name is shown,
 * because a site feed with no name on it is not actionable.
 */

export type LoggedReport = {
  reference: string;
  type: ReportType;
  category: string | null;
  area: string | null;
  department: string | null;
  severity: string | null;
  occurredAt: string | null;
  filedAt: string;
  status: ReportStatus;
  summary: string;
  description: string;
  immediateAction: string | null;
  reporterName: string | null;
  hasPhoto: boolean;
  photoUrl: string | null;
  /** Which site logged it — the server fills these; used by the location dropdown. */
  siteId?: string;
  siteName?: string;
};

type Feed = { reports: LoggedReport[]; total: number };

const PAGE_SIZE = 100;
const TYPE_FILTERS: Array<'All' | ReportType> = [
  'All', 'Near Miss', 'Hazard', 'Unsafe Condition', 'Unsafe Act', 'Safety Observation'
];

const STATUS_CLASS: Record<ReportStatus, string> = {
  Open: 'is-open',
  'In Progress': 'is-progress',
  Closed: 'is-closed'
};

/** The reference is an Incident ID for incident-type reports, an Observation ID otherwise. */
function referenceLabel(type: ReportType): string {
  return type === 'Safety Observation' || type === 'Unsafe Condition' || type === 'Unsafe Act'
    ? 'Observation ID' : 'Incident ID';
}

function formatDay(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(undefined, { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
}

export default function LoggedReports({ sites = [], selectedSiteId = '', demoReports }: { sites?: Site[]; selectedSiteId?: string; demoReports?: readonly LoggedReport[] }) {
  const { T } = useI18n();
  // '' means All locations; sync when the parent page changes the active site.
  const [siteChoice, setSiteChoice] = useState(selectedSiteId);
  const [feed, setFeed] = useState<Feed>({ reports: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'All' | ReportType>('All');
  const [selected, setSelected] = useState<LoggedReport | null>(null);
  const [photoBroken, setPhotoBroken] = useState(false);

  useEffect(() => {
    setSiteChoice(selectedSiteId);
  }, [selectedSiteId]);

  const load = useCallback(async (offset = 0, _options: { quiet?: boolean } = {}) => {
    if (demoReports) {
      const filteredList = demoReports.filter((report) => !siteChoice || report.siteId === siteChoice);
      const pageSlice = filteredList.slice(offset, offset + PAGE_SIZE);
      setFeed((current) => ({
        reports: offset > 0 ? [...current.reports, ...pageSlice] : pageSlice,
        total: filteredList.length
      }));
      setError('');
      return;
    }
    if (offset === 0) setFeed({ reports: [], total: 0 });
    setError('Reports are not connected in the UI preview.');
  }, [demoReports, siteChoice]);

  useEffect(() => {
    void load(0).finally(() => setLoading(false));
  }, [load]);

  // A cached photo link is signed for ten minutes; if it has expired, say so instead of
  // showing a broken image.
  useEffect(() => {
    setPhotoBroken(false);
  }, [selected]);

  // Escape closes the modal, the same way the rest of the app's dialogs behave.
  useEffect(() => {
    if (!selected) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setSelected(null);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected]);

  async function refresh() {
    if (loading || refreshing) return;
    setRefreshing(true);
    try {
      await load(0);
    } finally {
      setRefreshing(false);
    }
  }

  async function loadMore() {
    if (loadingMore) return;
    setLoadingMore(true);
    await load(feed.reports.length);
    setLoadingMore(false);
  }

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return feed.reports.filter((report) => {
      if (typeFilter !== 'All' && report.type !== typeFilter) return false;
      if (!needle) return true;
      return [report.reference, report.summary, report.description, report.area, report.department, report.reporterName ?? '']
        .join(' ')
        .toLowerCase()
        .includes(needle);
    });
  }, [feed.reports, typeFilter, query]);

  const counts = useMemo(() => ({
    open: visible.filter((report) => report.status === 'Open').length,
    progress: visible.filter((report) => report.status === 'In Progress').length,
    closed: visible.filter((report) => report.status === 'Closed').length
  }), [visible]);
  const selectedPhotoUrl = safeResourceUrl(selected?.photoUrl);

  return <section className="mlr-card">
    <div className="mlr-head">
      <h2>Logged reports</h2>
      <div className="mlr-head-tools">
        <select
          className="mlr-site-select"
          value={siteChoice}
          onChange={(event) => setSiteChoice(event.target.value)}
          aria-label="Filter reports by location"
        >
          <option value="">All locations</option>
          {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <button className="mlr-ghost" type="button" onClick={() => void refresh()} disabled={loading || refreshing}>
          {loading || refreshing ? <Loader2 size={14} className="mlr-spin" /> : <RefreshCw size={14} />} Refresh
        </button>
      </div>
    </div>

    <div className="mlr-toolbar">
      <div className="mlr-search">
        <Search size={16} aria-hidden="true" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search reference, area or text…"
          aria-label="Search logged reports"
          maxLength={80}
        />
      </div>
    </div>

    <div className="mlr-filters" role="group" aria-label="Filter by report type">
      <Filter size={14} aria-hidden="true" />
      {TYPE_FILTERS.map((type) => <button
        key={type}
        type="button"
        className={`mlr-filter${typeFilter === type ? ' is-active' : ''}`}
        aria-pressed={typeFilter === type}
        onClick={() => setTypeFilter(type)}
      >{type}</button>)}
    </div>

    {!loading && !error && <div className="mlr-counts">
      <span>{visible.length === feed.total ? `${feed.total} logged` : `${visible.length} of ${feed.total} logged`}</span>
      <span className="is-open">{counts.open} open</span>
      <span className="is-progress">{counts.progress} in progress</span>
      <span className="is-closed">{counts.closed} closed</span>
    </div>}

    {error && <div className="mlr-error" role="alert">
      <span>{T(error)}</span>
      <button className="mlr-ghost" type="button" onClick={() => void refresh()}>{T('Try again')}</button>
    </div>}

    {loading && <div className="mlr-loading"><Loader2 size={18} className="mlr-spin" /> {T('Loading reports…')}</div>}

    {!loading && !error && feed.reports.length === 0 && <div className="mlr-empty">
      <ClipboardList size={26} aria-hidden="true" />
      <b>{T('No reports logged yet')}</b>
      <span>{siteChoice
        ? T('No reports have been logged for {site} yet.', { site: sites.find((s) => s.id === siteChoice)?.name ?? T('this site') })
        : T('No reports have been logged across any location yet.')}</span>
    </div>}

    {!loading && !error && feed.reports.length > 0 && visible.length === 0 && <div className="mlr-empty">
      <Search size={24} aria-hidden="true" />
      <b>{T('No report matches this filter')}</b>
      <span>{T('Try another filter or report a safety concern.')}</span>
    </div>}

    {visible.length > 0 && <ul className="mlr-list">
      {visible.map((report) => <li key={report.reference} className="mlr-report">
        <button className="mlr-report-head" type="button" onClick={() => setSelected(report)}>
          <span className="mlr-report-line">
            <span className="mlr-report-ref">{report.reference}</span>
            <span className={`mlr-report-type ${STATUS_CLASS[report.status]}`}>
              <i aria-hidden="true" />{report.status}
            </span>
          </span>
          <span className="mlr-report-summary">
            {report.type}{report.category ? ` · ${report.category}` : ''} — {report.summary}
          </span>
          <span className="mlr-report-meta">
            {report.hasPhoto && <ImagePlus size={13} className="mlr-photo-flag" aria-label="Photo attached" />}
            {!siteChoice && report.siteName && <span className="mlr-report-site">{report.siteName}</span>}
            <span>{report.area || 'Area not stated'}</span>
            <span>{report.reporterName || 'Reporter not recorded'}</span>
            <span>{formatDay(report.filedAt)}</span>
          </span>
        </button>
      </li>)}
    </ul>}

    {!loading && !error && feed.reports.length < feed.total && <button
      className="mlr-load-more"
      type="button"
      onClick={() => void loadMore()}
      disabled={loadingMore}
    >
      {loadingMore ? <><Loader2 size={15} className="mlr-spin" /> Loading…</> : `Load ${Math.min(PAGE_SIZE, feed.total - feed.reports.length)} more`}
    </button>}

    {selected && <div
      className="overlay mlr-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="logged-report-title"
      onClick={(event) => { if (event.target === event.currentTarget) setSelected(null); }}
    >
      <div className="modal mlr-modal">
        <div className="mlr-modal-head">
          <div>
            <span className="mlr-report-ref mlr-modal-ref" id="logged-report-title">{selected.reference}</span>
            <span className={`mlr-report-type ${STATUS_CLASS[selected.status]}`}>
              <i aria-hidden="true" />{selected.status}
            </span>
          </div>
          <button className="mlr-modal-close" type="button" onClick={() => setSelected(null)} aria-label="Close report">
            <X size={18} />
          </button>
        </div>

        <p className="mlr-modal-summary">{selected.type}{selected.category ? ` · ${selected.category}` : ''} — {selected.summary}</p>

        <dl className="mlr-modal-grid">
          <div><dt>{referenceLabel(selected.type)}</dt><dd><b>{selected.reference}</b></dd></div>
          <div><dt>Type</dt><dd>{selected.type}</dd></div>
          {selected.siteName && <div><dt>Site</dt><dd>{selected.siteName}</dd></div>}
          <div><dt>Category</dt><dd>{selected.category || 'Not stated'}</dd></div>
          <div><dt>Area / location</dt><dd>{selected.area || 'Not stated'}</dd></div>
          <div><dt>Department</dt><dd>{selected.department || 'Not stated'}</dd></div>
          <div><dt>Severity</dt><dd>{selected.severity || 'Not stated'}</dd></div>
          <div><dt>Incident date</dt><dd>{formatDay(selected.occurredAt)}</dd></div>
          <div><dt>Filed on</dt><dd>{formatDay(selected.filedAt)}</dd></div>
          <div><dt>Reported by</dt><dd>{selected.reporterName || 'Not recorded'}</dd></div>
        </dl>

        <div className="mlr-modal-section">
          <b>Description</b>
          <p>{selected.description || selected.summary}</p>
        </div>

        {selected.immediateAction && <div className="mlr-modal-section">
          <b>Immediate action</b>
          <p>{selected.immediateAction}</p>
        </div>}

        <div className="mlr-modal-section">
          <b>Photo</b>
          {selectedPhotoUrl && !photoBroken
            ? <a href={selectedPhotoUrl} target="_blank" rel="noreferrer noopener" className="mlr-modal-photo-link">
              <img
                src={selectedPhotoUrl}
                alt={`Photo attached to ${selected.reference}`}
                className="mlr-modal-photo"
                loading="lazy"
                onError={() => setPhotoBroken(true)}
              />
            </a>
            : <p className="mlr-modal-nophoto">{selectedPhotoUrl ? 'Photo link expired. Tap Refresh to load it again.' : 'No photo attached to this report.'}</p>}
        </div>
      </div>
    </div>}
  </section>;
}
