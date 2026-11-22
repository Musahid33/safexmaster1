import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { mayAccessAdmin } from '@/lib/admin-access';
import { ADMIN_DEMO_COOKIE, isAdminDemoEnabled } from '@/lib/admin-demo';

const LOGIN_PATH = '/company-admin/login';

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (path === LOGIN_PATH) return NextResponse.next();
  // Preview-only demo sign-in: bypasses the database check outside production.
  if (isAdminDemoEnabled() && request.cookies.get(ADMIN_DEMO_COOKIE)?.value === '1') {
    const demoResponse = NextResponse.next({ request });
    demoResponse.headers.set('Cache-Control', 'private, no-store');
    return demoResponse;
  }
  const deny = () => { const url = request.nextUrl.clone(); url.pathname = LOGIN_PATH; url.search = ''; const response = NextResponse.redirect(url); response.headers.set('Cache-Control', 'private, no-store'); return response; };
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return deny();
  let response = NextResponse.next({ request });
  response.headers.set('Cache-Control', 'private, no-store');
  try {
    const client = createServerClient(url, key, { cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (items) => { for (const { name, value } of items) request.cookies.set(name, value); response = NextResponse.next({ request }); response.headers.set('Cache-Control', 'private, no-store'); for (const { name, value, options } of items) response.cookies.set(name, value, { ...options, httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' }); }
    }});
    const { data: identity, error: userError } = await client.auth.getUser();
    if (userError || !identity.user) return deny();
    const { data, error } = await client.rpc('current_admin_access');
    const access = Array.isArray(data) ? data[0] : null;
    const rawCompany = request.cookies.get('safetyos-company-id')?.value?.trim() ?? '';
    const activeCompanyId = rawCompany || undefined;
    if (error || !access || !mayAccessAdmin(access, activeCompanyId)) return deny();
    return response;
  } catch { return deny(); }
}
export const config = { matcher: ['/company-admin/:path*'] };
