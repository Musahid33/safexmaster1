'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, BellRing, CalendarDays, Check, ChevronRight, Clock3, ExternalLink, FileText, MapPin, Share2, X, type LucideIcon } from 'lucide-react';
import { buildHomeFeedShareData, formatHomeFeedDate, formatHomeFeedTime, type HomeFeedItem, type HomeFeedKind } from '@/lib/home-content';
import { LANGUAGE_LOCALE } from '@/lib/i18n';
import { safeResourceUrl } from '@/lib/safe-url';
import { useI18n } from './I18nProvider';

type ArchiveConfig = { eyebrow: string; title: string; description: string };
const ARCHIVE_CONFIG: Record<HomeFeedKind, ArchiveConfig> = {
  events: { eyebrow: 'EVENTS', title: 'All Events', description: 'Upcoming and archived events published for the selected site.' },
  circulars: { eyebrow: 'DOCUMENTS & UPDATES', title: 'All Circulars', description: 'Circulars published for the selected site.' },
  notices: { eyebrow: 'SITE UPDATES', title: 'All Notices', description: 'Recent safety notices published for the selected site.' },
  updates: { eyebrow: 'SITE UPDATES', title: 'Circulars & Notices', description: 'Browse circulars and notices published for the selected site.' }
};

const FEED_ICON: Record<HomeFeedKind, LucideIcon> = {
  events: CalendarDays,
  circulars: FileText,
  notices: BellRing,
  updates: FileText
};

/**
 * Which published entries belong on an archive screen. `updates` merges circulars and notices;
 * everything else is a single type, so the same rows can serve the home cards and the archive.
 */
export function filterFeedItems(items: HomeFeedItem[], kind: HomeFeedKind): HomeFeedItem[] {
  if (kind === 'events') return items.filter((item) => item.type === 'Event');
  if (kind === 'circulars') return items.filter((item) => item.type === 'Circular');
  if (kind === 'notices') return items.filter((item) => item.type === 'Notice');
  return items.filter((item) => item.type === 'Circular' || item.type === 'Notice');
}

export function FeedArchivePage({ kind, siteName, items: published, onOpenItem, onBack }: {
  kind: HomeFeedKind;
  siteName: string;
  /** Published entries from the database. Nothing is invented when this is empty. */
  items: HomeFeedItem[];
  onOpenItem: (item: HomeFeedItem) => void;
  onBack: () => void;
}) {
  const { language, T } = useI18n();
  const locale = LANGUAGE_LOCALE[language];
  const config = ARCHIVE_CONFIG[kind];
  const items = filterFeedItems(published, kind);
  const ArchiveIcon = FEED_ICON[kind];

  return <section className="page-panel feed-archive-page">
    <div className="page-heading feed-page-heading">
      <div><span className="eyebrow">{T(config.eyebrow)} · {siteName}</span><h1>{T(config.title)}</h1><p>{T(config.description)}</p></div>
      <button className="secondary-button feed-back-button" type="button" onClick={onBack}><ArrowLeft size={16} /> {T('Home')}</button>
    </div>
    <div className="feed-archive-list">
      {items.map((item) => {
        const isUpcoming = item.type === 'Event' && new Date(item.date).getTime() >= Date.now();
        return <button className="feed-archive-card" type="button" key={item.id} onClick={() => onOpenItem(item)}>
          <span className={`feed-archive-icon ${item.type.toLowerCase()}`}><ArchiveIcon size={20} /></span>
          <span className="feed-archive-copy">
            <span className="feed-archive-meta"><span className="feed-type-pill">{T(item.type)}{item.type === 'Event' ? ` · ${T(isUpcoming ? 'Upcoming' : 'Past')}` : ''}</span><time dateTime={item.date}>{formatHomeFeedDate(item.date, locale)}{item.type === 'Event' ? ` · ${formatHomeFeedTime(item.date, locale)}` : ''}</time></span>
            <b>{item.title}</b>
            <small>{item.summary}</small>
            {item.location && <span className="feed-archive-location"><MapPin size={13} />{item.location}</span>}
            {item.attachmentUrl && <span className="feed-archive-location"><ExternalLink size={13} />{T('Attachment')}</span>}
          </span>
          <ChevronRight className="feed-archive-arrow" size={19} />
        </button>;
      })}
    </div>
    {items.length === 0 && <div className="empty-state"><ArchiveIcon size={28} /><b>{T('No entries available')}</b><span>{T('Nothing has been published in this section yet.')}</span></div>}
    <p className="home-demo-caption">{T('Only published items are listed. Nothing here is a sample entry.')}</p>
  </section>;
}

export function HomeFeedDetailDialog({ item, siteName, onClose }: { item: HomeFeedItem; siteName: string; onClose: () => void }) {
  const { language, T } = useI18n();
  const locale = LANGUAGE_LOCALE[language];
  const Icon = item.type === 'Event' ? CalendarDays : item.type === 'Notice' ? BellRing : FileText;
  const attachmentUrl = safeResourceUrl(item.attachmentUrl);
  const [shareState, setShareState] = useState<'idle' | 'shared' | 'copied' | 'unsupported'>('idle');
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);

  useEffect(() => {
    if (shareState === 'idle') return;
    const timer = window.setTimeout(() => setShareState('idle'), 2800);
    return () => window.clearTimeout(timer);
  }, [shareState]);

  async function handleShare() {
    if (sharing) return;
    setSharing(true);
    const payload = buildHomeFeedShareData(item, siteName, locale, window.location.href);
    const fallbackText = payload.url ? `${payload.text}\n${payload.url}` : payload.text;

    try {
      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        await navigator.share(payload);
        setShareState('shared');
        return;
      }
      if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(fallbackText);
        setShareState('copied');
        return;
      }
      setShareState('unsupported');
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      if (error && typeof error === 'object' && 'name' in error && (error as { name?: string }).name === 'AbortError') return;
      if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        try {
          await navigator.clipboard.writeText(fallbackText);
          setShareState('copied');
          return;
        } catch {
          // Clipboard write blocked; fall through to unsupported state.
        }
      }
      setShareState('unsupported');
    } finally {
      setSharing(false);
    }
  }

  return <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="feed-detail-title" onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <article className="modal feed-detail-dialog">
      <div className="modal-header">
        <div><span className="eyebrow">{T(item.type).toLocaleUpperCase(locale)} · {siteName}</span><h2 id="feed-detail-title">{item.title}</h2></div>
        <button className="close-button" type="button" onClick={onClose} aria-label={T('Close details')}><X /></button>
      </div>
      <div className="feed-detail-meta"><span><Icon size={16} />{formatHomeFeedDate(item.date, locale)}</span>{item.type === 'Event' && <span><Clock3 size={16} />{formatHomeFeedTime(item.date, locale)}</span>}{item.location && <span><MapPin size={16} />{item.location}</span>}</div>
      <p className="feed-detail-summary">{item.summary}</p>
      <div className="feed-detail-body">{item.details}</div>
      <div className="feed-detail-actions">
        <button className="feed-detail-share" type="button" onClick={() => void handleShare()} disabled={sharing}>
          {shareState === 'shared' || shareState === 'copied' ? <Check size={15} aria-hidden="true" /> : <Share2 size={15} aria-hidden="true" />}
          <span>{T('Share')}</span>
        </button>
        {attachmentUrl && <a className="feed-detail-attachment" href={attachmentUrl} target="_blank" rel="noopener noreferrer"><ExternalLink size={15} /> {T('Open attachment')}</a>}
        {shareState !== 'idle' && <span className={`feed-detail-share-status${shareState === 'unsupported' ? ' is-muted' : ''}`} role="status" aria-live="polite">
          {shareState === 'shared'
            ? T('Shared')
            : shareState === 'copied'
              ? T('Summary copied to clipboard')
              : T('Sharing is not supported on this device.')}
        </span>}
      </div>
      <div className="modal-footnote">{T('Confirm event dates and site instructions through official channels.')}</div>
    </article>
  </div>;
}
