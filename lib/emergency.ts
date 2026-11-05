/** Convert a tenant/site-provided phone number into a safe dial link, or no link. */
export function telHref(number: string | null | undefined): string | null {
  const value = number?.trim();
  if (!value || !/^\+?[\d\s().-]+$/.test(value)) return null;
  const digits = value.replace(/\D/g, '');
  if (digits.length < 3 || digits.length > 15) return null;
  return `tel:${value.startsWith('+') ? '+' : ''}${digits}`;
}
