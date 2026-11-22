import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { mayAccessAdmin, type AdminAccess } from '@/lib/admin-access';
import { sessionClient } from './supabase-auth';

export const ACTIVE_COMPANY_COOKIE = 'safetyos-company-id';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const LOGIN_PATH = '/company-admin/login';

export type VerifiedAdminContext = {
  userId: string;
  companyIds: string[];
  activeCompanyId: string | null;
};

/**
 * Server-side defense-in-depth authorization guard for the company admin console.
 * Verifies the live Supabase session and active company assignment on every request
 * rather than relying solely on proxy/middleware checks.
 */
export async function requireAdminAccess(): Promise<VerifiedAdminContext> {
  try {
    const client = await sessionClient();
    const { data: identity, error: userError } = await client.auth.getUser();
    if (userError || !identity.user) redirect(LOGIN_PATH);

    const { data, error } = await client.rpc('current_admin_access');
    const access = (Array.isArray(data) ? data[0] : null) as AdminAccess;
    if (error || !access) redirect(LOGIN_PATH);

    const store = await cookies();
    const rawCookie = store.get(ACTIVE_COMPANY_COOKIE)?.value?.trim() ?? '';
    const cookieCompanyId = UUID_RE.test(rawCookie) ? rawCookie : undefined;
    if (!mayAccessAdmin(access, cookieCompanyId)) redirect(LOGIN_PATH);
    const activeCompanyId = cookieCompanyId ?? (Array.isArray(access!.company_ids) ? access!.company_ids[0] ?? null : null);

    return {
      userId: identity.user.id,
      companyIds: Array.isArray(access!.company_ids) ? access!.company_ids : [],
      activeCompanyId
    };
  } catch (cause) {
    // Re-throw Next.js redirect control-flow errors; fail closed on everything else.
    if (cause && typeof cause === 'object' && 'digest' in cause && String((cause as { digest?: unknown }).digest).startsWith('NEXT_REDIRECT')) {
      throw cause;
    }
    redirect(LOGIN_PATH);
  }
}
