/** Pure authorization and input-validation rules shared by server entry points. */
export type AdminAccess = { is_platform_owner?: unknown; company_ids?: unknown } | null | undefined;

/**
 * Company-admin only: this app has no platform-owner portal. Access requires at least
 * one assigned company; when a specific company is required it must be in the list.
 */
export function mayAccessAdmin(access: AdminAccess, requiredCompanyId?: string | null): boolean {
  if (!access) return false;
  if (!Array.isArray(access.company_ids) || !access.company_ids.every((id: unknown) => typeof id === 'string' && id.length > 0)) return false;
  if (requiredCompanyId !== undefined) return typeof requiredCompanyId === 'string' && access.company_ids.includes(requiredCompanyId);
  return access.company_ids.length > 0;
}

export function validAdminLogin(username: string, slug: string, password: unknown): boolean {
  if (!username || username.length > 254 || typeof password !== 'string' || !password || password.length > 1024) return false;
  return slug.length <= 100 && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)
    && /^[a-z0-9][a-z0-9._-]{2,63}$/.test(username);
}
