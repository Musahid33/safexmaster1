/** A tenant-scoped key prevents a saved site from being reused by another tenant. */
export function siteStorageKey(tenantId: string): string {
  return `safex-active-site:${encodeURIComponent(tenantId)}`;
}

export function validSavedSiteId(savedId: string | null, sites: readonly { id: string }[]): string | null {
  return savedId && sites.some((site) => site.id === savedId) ? savedId : null;
}

/** Client-side display filter only. Future services must also enforce tenant/site authorization. */
export function forSelectedSite<T extends { siteId: string }>(items: readonly T[], siteId: string | null | undefined): T[] {
  return siteId ? items.filter((item) => item.siteId === siteId) : [];
}
