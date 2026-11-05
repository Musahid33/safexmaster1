'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, ArrowLeft, CalendarDays, ChevronRight, Download, FileImage, FileText, MapPin, Pin, Search, X } from 'lucide-react';
import { useI18n } from './I18nProvider';
import { SAFETY_ALERT_CATEGORIES, filterSafetyAlerts, safeAlertFileUrl, type AlertFile, type PublishedSafetyAlert } from '@/lib/safety-alert-view';

function dateLabel(date: string, locale: string) {
  const parsed = new Date(/^\d{4}-\d{2}-\d{2}$/.test(date) ? `${date}T00:00:00Z` : date);
  return Number.isNaN(parsed.getTime()) ? date : new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(parsed);
}
function FileBadge({ kind }: { kind: AlertFile['kind'] }) {
  return <span className={`sa-file-badge ${kind}`} >{kind === 'pdf' ? <FileText size={13} /> : <FileImage size={13} />}{kind === 'pdf' ? 'PDF' : 'Image'}</span>;
}
function AlertCard({ alert, locale, onSelect }: { alert: PublishedSafetyAlert; locale: string; onSelect: () => void }) {
  const { T } = useI18n();
  return <button type="button" className={`sa-card ${alert.pinned ? 'sa-card-pinned' : ''}`} data-alert-id={alert.id} onClick={onSelect}>
    <span className={`sa-alert-icon ${alert.category === 'Fatal' ? 'critical' : ''}`}><AlertTriangle size={23} aria-hidden="true" /></span>
    <span className="sa-row-copy">
      {alert.pinned && <span className="sa-pinned-label"><Pin size={13} aria-hidden="true" /> {T('Pinned critical alert')}</span>}
      <span className="sa-row-meta"><span className={`sa-category ${alert.category === 'Fatal' ? 'critical' : ''}`}>{T(alert.category)}</span><time dateTime={alert.date}>{dateLabel(alert.date, locale)}</time><span className="sa-files">{alert.files.map((file) => <FileBadge key={file.id} kind={file.kind} />)}</span></span>
      <span className="sa-card-title">{alert.title}</span>
      <span className="sa-card-description">{alert.shortDescription}</span>
      <span className="sa-card-meta"><span><MapPin size={15} aria-hidden="true" />{alert.location}</span><span>{T('Alert / Strip No.')} · {alert.stripNumber}</span></span>
      <span className="sa-card-link">{T('View Alert')} <ChevronRight size={16} aria-hidden="true" /></span>
    </span>
    <ChevronRight className="sa-row-arrow" size={20} aria-hidden="true" />
  </button>;
}

export default function SafetyAlerts({ alerts, locale, onClose, siteName, categories = SAFETY_ALERT_CATEGORIES }: { alerts: PublishedSafetyAlert[] | null; locale: string; onClose: () => void; siteName?: string | null; categories?: readonly string[] }) {
  const { T } = useI18n();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All');
  const filters = useMemo(() => ['All', ...new Set(categories.filter((category) => category.trim() && category !== 'All'))], [categories]);
  const [selected, setSelected] = useState<PublishedSafetyAlert | null>(null);
  const [file, setFile] = useState<AlertFile | null>(null);
  const backRef = useRef<HTMLButtonElement>(null);
  const closeFileRef = useRef<HTMLButtonElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLElement>(null);
  const fileOpenedFrom = useRef<HTMLElement | null>(null);
  const activeFilter = filters.includes(filter) ? filter : 'All';
  const results = useMemo(() => filterSafetyAlerts(alerts ?? [], activeFilter, query), [alerts, activeFilter, query]);
  const pinned = results.filter((alert) => alert.pinned);
  const latest = results.filter((alert) => !alert.pinned);
  const goBack = () => {
    if (file) { setFile(null); requestAnimationFrame(() => { if (fileOpenedFrom.current?.isConnected) fileOpenedFrom.current.focus(); else backRef.current?.focus(); }); }
    else if (selected) { const id = selected.id; setSelected(null); requestAnimationFrame(() => { const cards = shellRef.current?.querySelectorAll<HTMLButtonElement>('[data-alert-id]'); Array.from(cards ?? []).find((card) => card.dataset.alertId === id)?.focus(); }); }
    else onClose();
  };
  const openAlert = (alert: PublishedSafetyAlert) => {
    setSelected(alert);
    fileOpenedFrom.current = null;
    if (alert.files.length === 1 && safeAlertFileUrl(alert.files[0].url)) setFile(alert.files[0]);
  };
  useEffect(() => {
    const previous = document.body.style.overflow;
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = 'hidden';
    backRef.current?.focus();
    return () => { document.body.style.overflow = previous; trigger?.focus(); };
  }, []);
  useEffect(() => {
    if (selected) { backRef.current?.focus(); scrollRef.current?.scrollTo(0, 0); }
  }, [selected]);
  useEffect(() => {
    if (file) closeFileRef.current?.focus();
  }, [file]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); goBack(); return; }
      if (event.key !== 'Tab') return;
      const container = file ? viewerRef.current : shellRef.current;
      const controls = container?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), a[href], iframe');
      if (!controls?.length) return;
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && (document.activeElement === first || !container?.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || !container?.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });
  return <div ref={shellRef} className="sa-shell" role="dialog" aria-modal="true" aria-labelledby="sa-title">
    <header className="sa-header"><div className="sa-header-inner"><button ref={backRef} type="button" className="sa-icon-button sa-back-button" onClick={goBack} aria-label={T(selected ? 'Back to safety alerts' : 'Back')}><ArrowLeft size={20} /><span>{T('Back')}</span></button><div className="sa-heading"><h2 id="sa-title">{T(selected ? 'Safety Alert Details' : 'Safety Alerts')}</h2>{siteName && <span>{siteName}</span>}</div><button type="button" className="sa-icon-button sa-close-button" onClick={onClose} aria-label={T('Close safety alerts')}><X size={21} /></button></div></header>
    <main ref={scrollRef} className="sa-scroll"><div className="sa-content">
      {!selected ? <>
        <div className="sa-controls"><label className="sa-search"><Search size={20} aria-hidden="true" /><span className="sr-only">{T('Search Safety Alert')}</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={T('Search Safety Alert...')} /></label>
        <div className="sa-filters" role="group" aria-label={T('Filter safety alerts')}>{filters.map((option) => <button key={option} type="button" className={`sa-filter ${activeFilter === option ? 'active' : ''}`} aria-pressed={activeFilter === option} onClick={() => setFilter(option)}>{T(option)}</button>)}</div></div>
        {pinned.length > 0 && <section className="sa-section"><h3>{T('Pinned critical alert')}</h3><div className="sa-list">{pinned.map((alert) => <AlertCard key={alert.id} alert={alert} locale={locale} onSelect={() => openAlert(alert)} />)}</div></section>}
        <section className="sa-section"><div className="sa-section-heading"><h3>{T(activeFilter === 'All' ? 'All safety alerts' : activeFilter)}</h3>{alerts !== null && <span>{latest.length}</span>}</div><div className="sa-list">{latest.map((alert) => <AlertCard key={alert.id} alert={alert} locale={locale} onSelect={() => openAlert(alert)} />)}</div>{!latest.length && <div className="sa-empty" role="status"><span className="sa-empty-icon"><AlertTriangle size={22} aria-hidden="true" /></span><b>{T(alerts === null ? 'Safety alerts are not connected yet.' : pinned.length ? 'No other alerts match your search.' : 'No safety alerts match your search.')}</b>{alerts === null && <span>{T('Published alerts will appear here when a data source is connected.')}</span>}</div>}</section>
      </> : <article className="sa-detail">
        <span className={`sa-category ${selected.category === 'Fatal' ? 'critical' : ''}`}>{T(selected.category)}</span>
        <div className="sa-detail-strip">{T('Alert / Strip No.')} · {selected.stripNumber}</div><h1>{selected.title}</h1><div className="sa-card-meta"><span><MapPin size={16} />{selected.location}</span><span><CalendarDays size={16} /><time dateTime={selected.date}>{dateLabel(selected.date, locale)}</time></span></div>
        <section className="sa-detail-section"><h3>{T('Incident details')}</h3><p>{selected.shortDescription}</p></section>
        <section className="sa-detail-section"><h3>{T('Attachments')}</h3>{selected.files.length ? <div className="sa-attachments">{selected.files.map((item) => <button key={item.id} type="button" className="sa-attachment" disabled={!safeAlertFileUrl(item.url)} onClick={() => { fileOpenedFrom.current = document.activeElement as HTMLElement; setFile(item); }}><span className="sa-attachment-icon">{item.kind === 'pdf' ? <FileText size={20} /> : <FileImage size={20} />}</span><span><b>{item.name}</b><small>{item.kind === 'pdf' ? T('Open PDF') : T('View image')}</small></span><ChevronRight size={19} /></button>)}</div> : <p>{T('No attachments available.')}</p>}</section>
      </article>}
    </div></main>
    {file && safeAlertFileUrl(file.url) && <div ref={viewerRef} className="sa-viewer" role="dialog" aria-modal="true" aria-label={file.name}><header className="sa-viewer-header"><button type="button" ref={closeFileRef} onClick={goBack} className="sa-icon-button" aria-label={T('Close viewer and return to alert')}><X size={22} /></button><span>{file.name}</span><a className="sa-download" href={safeAlertFileUrl(file.url) ?? undefined} download={file.name}><Download size={18} aria-hidden="true" /> <span>{T('Download')}</span></a></header><div className="sa-viewer-content">{file.kind === 'image' ? <img src={file.url} alt={file.name} /> : <><iframe src={file.url} title={file.name} /><a className="sa-pdf-fallback" href={file.url} target="_blank" rel="noopener noreferrer">{T('Open PDF if preview is unavailable')}</a></>}</div></div>}
  </div>;
}
