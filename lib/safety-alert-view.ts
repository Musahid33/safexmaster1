/** Public-facing shape of a published alert; data loading is intentionally separate from the UI. */
export const SAFETY_ALERT_CATEGORIES = ['Fatal', 'LTI', 'Red Risk', 'Property Damage', 'Dangerous Occurrence', 'Medical Case', 'Fire', 'Dashing', 'Topping', 'Other'] as const;
export type AlertCategory = (typeof SAFETY_ALERT_CATEGORIES)[number];
export type AlertFile = { id: string; name: string; kind: 'pdf' | 'image'; url: string };
export type PublishedSafetyAlert = { id: string; stripNumber: string; category: string; title: string; shortDescription: string; location: string; date: string; pinned?: boolean; files: AlertFile[] };
export function filterSafetyAlerts(alerts: PublishedSafetyAlert[], filter: string, query: string): PublishedSafetyAlert[] {
  const term = query.trim().toLocaleLowerCase();
  return alerts.filter((alert) => (filter === 'All' || alert.category === filter) && (!term || [alert.stripNumber, alert.title, alert.shortDescription, alert.location, alert.category].some((value) => value.toLocaleLowerCase().includes(term))))
    .slice().sort((a, b) => b.date.localeCompare(a.date));
}
/** Only same-origin paths may be embedded or downloaded. */
export function safeAlertFileUrl(url: string): string | null {
  return /^\/(?!\/)[^\\\u0000-\u001f]*$/.test(url) ? url : null;
}
