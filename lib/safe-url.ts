/**
 * Pure URL safety helpers for external links, embedded viewers, and signed file URLs.
 * Blocks unsafe schemes (javascript:, data:, vbscript:) and protocol-relative URLs.
 */

const SAFE_EXTERNAL_PROTOCOLS = new Set(['http:', 'https:']);

/** Validate an external URL (auto-prefixing https:// when no scheme is provided). */
export function safeExternalUrl(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed || trimmed.startsWith('//')) return null;
  try {
    const candidate = /^[a-z][a-z\d+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const url = new URL(candidate);
    return SAFE_EXTERNAL_PROTOCOLS.has(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

/**
 * Validate a resource URL (document, photo, PDF, or external attachment).
 * Permits same-origin root-relative paths (`/path`) or explicit `http:` / `https:` URLs.
 * Rejects protocol-relative URLs (`//host`), `javascript:`, `data:`, and malformed values.
 */
export function safeResourceUrl(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('/')) {
    if (trimmed.startsWith('//') || /[\r\n\0]/.test(trimmed)) return null;
    try {
      const parsed = new URL(trimmed, 'https://safex.invalid');
      if (parsed.origin !== 'https://safex.invalid') return null;
      return `${parsed.pathname}${parsed.search}${parsed.hash}`;
    } catch {
      return null;
    }
  }
  try {
    const url = new URL(trimmed);
    return SAFE_EXTERNAL_PROTOCOLS.has(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

/**
 * Safely append or overwrite a query parameter on a validated resource URL
 * without breaking signed URLs that already contain query parameters.
 */
export function appendResourceQuery(
  value: string | null | undefined,
  param: string,
  paramValue: string,
  hash?: string
): string | null {
  const safe = safeResourceUrl(value);
  if (!safe) return null;
  const isRelative = safe.startsWith('/');
  try {
    const url = new URL(safe, 'https://safex.invalid');
    url.searchParams.set(param, paramValue);
    if (hash !== undefined) url.hash = hash;
    return isRelative ? `${url.pathname}${url.search}${url.hash}` : url.href;
  } catch {
    return null;
  }
}
