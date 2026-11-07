import type { Site } from './types';

export type PublicPortal = { companyId: string; companySlug: string; companyName: string; sites: Site[] };
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function validPortalSlug(value: string): boolean { return value.length <= 100 && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(value); }
export function parsePublicPortal(value: unknown, expectedSlug: string): PublicPortal | null {
  if (!value || typeof value !== 'object' || !validPortalSlug(expectedSlug)) return null;
  const item = value as Record<string, unknown>;
  if (typeof item.companyId !== 'string' || !uuid.test(item.companyId) || item.companySlug !== expectedSlug || typeof item.companyName !== 'string' || !item.companyName.trim() || !Array.isArray(item.sites)) return null;
  const sites: Site[] = [];
  for (const entry of item.sites) {
    if (!entry || typeof entry !== 'object') return null;
    const site = entry as Record<string, unknown>;
    if (typeof site.id !== 'string' || !uuid.test(site.id) || typeof site.name !== 'string' || !site.name.trim() || typeof site.region !== 'string' || (site.sosNumber !== null && typeof site.sosNumber !== 'string')) return null;
    if (sites.some((s) => s.id === site.id)) return null;
    sites.push({ id: site.id, name: site.name, region: site.region, sosNumber: site.sosNumber });
  }
  return { companyId: item.companyId, companySlug: expectedSlug, companyName: item.companyName, sites };
}
