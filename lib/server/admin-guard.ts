import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { mayAccessAdmin, type AdminKind } from '@/lib/admin-access';
import { sessionClient } from './supabase-auth';

export const ACTIVE_COMPANY_COOKIE = 'safetyos-company-id';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type VerifiedAdminContext = {
  userId: string;
  isPlatformOwner: boolean;
  companyIds: string[];
  activeCompanyId: string | null;
};

/**
 * Server-side defense-in-depth authorization guard for admin Server Components.
 * Verifies the live Supabase session and active admin assignment on every request
 * rather than relying solely on proxy/middleware checks.
 */
export async function requireAdminAccess(kind: AdminKind): Promise<VerifiedAdminContext> {
  const loginPath = kind === 'owner' ? '/super-admin/login' : '/company-admin/login';
  try {
    const client = await sessionClient();
    const { data: identity, error: userError } = await client.auth.getUser();
    if (userError || !identity.user) redirect(loginPath);

    const { data, error } = await client.rpc('current_admin_access');
    const access = Array.isArray(data) ? data[0] : null;
    if (error || !access) redirect(loginPath);

    let activeCompanyId: string | null = null;
    if (kind === 'company') {
      const store = await cookies();
      const rawCookie = store.get(ACTIVE_COMPANY_COOKIE)?.value?.trim() ?? '';
      const cookieCompanyId = UUID_RE.test(rawCookie) ? rawCookie : undefined;
      if (!mayAccessAdmin('company', access, cookieCompanyId)) redirect(loginPath);
      activeCompanyId = cookieCompanyId ?? (Array.isArray(access.company_ids) ? access.company_ids[0] ?? null : null);
    } else if (!mayAccessAdmin('owner', access)) {
      redirect(loginPath);
    }

    return {
      userId: identity.user.id,
      isPlatformOwner: access.is_platform_owner === true,
      companyIds: Array.isArray(access.company_ids) ? access.company_ids : [],
      activeCompanyId
    };
  } catch (cause) {
    // Re-throw Next.js redirect control-flow errors; fail closed on everything else.
    if (cause && typeof cause === 'object' && 'digest' in cause && String((cause as { digest?: unknown }).digest).startsWith('NEXT_REDIRECT')) {
      throw cause;
    }
    redirect(loginPath);
  }
}
