export const APP_TIME_ZONE = 'Asia/Kolkata';

export type HomeFeedKind = 'events' | 'circulars' | 'notices' | 'updates';
export type HomeContentType = 'Event' | 'Circular' | 'Notice';

export type HomeFeedItem = {
  id: string;
  type: HomeContentType;
  title: string;
  date: string;
  summary: string;
  details: string;
  location?: string;
  /**
   * Site this content belongs to. Absent/null means company-wide: it shows on every
   * site. A tag limits the item to the selected site on the home page.
   */
  siteId?: string | null;
  /** Present when a published circular/notice carries a file or a link. */
  attachmentUrl?: string | null;
};

export type HomeFeedSharePayload = {
  title: string;
  text: string;
  url?: string;
};

export function formatHomeFeedDate(value: string, locale = 'en-IN', timeZone = APP_TIME_ZONE): string {
  return new Intl.DateTimeFormat(locale, { timeZone, weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value));
}

export function formatHomeFeedTime(value: string, locale = 'en-IN', timeZone = APP_TIME_ZONE): string {
  return new Intl.DateTimeFormat(locale, { timeZone, hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

function parseHttpUrl(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed || trimmed.startsWith('//')) return null;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.toString() : null;
  } catch {
    return null;
  }
}

function resolveShareUrl(attachmentUrl: string | null | undefined, pageUrl?: string): string | undefined {
  const safePage = parseHttpUrl(pageUrl);
  const trimmedAttachment = attachmentUrl?.trim();
  if (trimmedAttachment) {
    if (trimmedAttachment.startsWith('/') && !trimmedAttachment.startsWith('//') && !trimmedAttachment.startsWith('/\\')) {
      if (safePage) {
        try {
          return new URL(trimmedAttachment, safePage).toString();
        } catch {
          return safePage;
        }
      }
      return undefined;
    }
    const safeExternal = parseHttpUrl(trimmedAttachment);
    if (safeExternal) return safeExternal;
  }
  return safePage ?? undefined;
}

export function buildHomeFeedShareData(
  item: HomeFeedItem,
  siteName: string,
  locale = 'en-IN',
  pageUrl?: string
): HomeFeedSharePayload {
  const cleanSite = siteName.trim();
  const datePart = formatHomeFeedDate(item.date, locale);
  const whenPart = item.type === 'Event' ? `${datePart} · ${formatHomeFeedTime(item.date, locale)}` : datePart;
  const metaParts = [cleanSite, whenPart, item.location?.trim()].filter(Boolean);
  const summary = item.summary.trim();
  const details = item.details.trim();
  const lines = [
    `${item.type}: ${item.title.trim()}`,
    metaParts.length ? metaParts.join(' | ') : '',
    summary,
    details && details !== summary ? details : ''
  ].filter(Boolean);

  const payload: HomeFeedSharePayload = {
    title: cleanSite ? `${item.title.trim()} · ${cleanSite}` : item.title.trim(),
    text: lines.join('\n')
  };
  const url = resolveShareUrl(item.attachmentUrl, pageUrl);
  if (url) payload.url = url;
  return payload;
}
