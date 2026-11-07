import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { mayAccessAdmin } from '@/lib/admin-access';

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const owner = path.startsWith('/super-admin');
  const loginPath = owner ? '/super-admin/login' : '/company-admin/login';
  if (path === loginPath || path === '/super-admin/forgot-password') return NextResponse.next();
  const deny = () => { const url = request.nextUrl.clone(); url.pathname = loginPath; url.search = ''; const response = NextResponse.redirect(url); response.headers.set('Cache-Control', 'private, no-store'); return response; };
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
    if (error || !access || !mayAccessAdmin(owner ? 'owner' : 'company', access)) return deny();
    return response;
  } catch { return deny(); }
}
export const config = { matcher: ['/super-admin/:path*', '/company-admin/:path*'] };
