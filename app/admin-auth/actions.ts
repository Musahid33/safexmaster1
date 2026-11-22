'use server';
import { createHmac } from 'node:crypto';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { ACTIVE_COMPANY_COOKIE } from '@/lib/server/admin-guard';
import { privilegedClient, sessionClient } from '@/lib/server/supabase-auth';
import { mayAccessAdmin, validAdminLogin } from '@/lib/admin-access';
import { ADMIN_DEMO_COOKIE, validAdminDemoLogin } from '@/lib/admin-demo';

export type LoginState = { error: string };
const failure = { error: 'Unable to sign in. Check your details or try again later.' };
const unavailable = { error: 'Sign-in is not configured or temporarily unavailable. Please contact your administrator.' };
const normalize = (value: FormDataEntryValue | null) => typeof value === 'string' ? value.trim().toLowerCase() : '';
async function limit(identifier: string) {
  const secret = process.env.AUTH_RATE_LIMIT_SECRET;
  if (!secret || secret.length < 32) throw new Error('Rate limiter not configured');
  const admin = privilegedClient();
  const bucket = (key: string) => createHmac('sha256', secret).update(key).digest('hex');
  for (const [key, max, seconds] of [['admin-login-global', 400, 60], [identifier, 8, 900]] as const) {
    const { data, error } = await admin.rpc('check_admin_login_limit', { p_bucket: bucket(key), p_limit: max, p_window_seconds: seconds });
    if (error) throw new Error('Rate limiter unavailable');
    if (data !== true) return false;
  }
  return true;
}
async function login(form: FormData): Promise<LoginState> {
  const username = normalize(form.get('username'));
  // Company slug comes from the app context (worker portal passes its own) or the
  // deployment's COMPANY_PORTAL_SLUG — the standalone admin login never asks for it.
  const slug = normalize(form.get('company')) || (process.env.COMPANY_PORTAL_SLUG ?? '').trim().toLowerCase();
  const password = form.get('password');
  // Preview-only demo sign-in (disabled in production builds entirely).
  if (validAdminDemoLogin(username, password)) {
    const store = await cookies();
    store.set(ADMIN_DEMO_COOKIE, '1', { httpOnly: true, sameSite: 'lax', secure: false, path: '/' });
    redirect('/company-admin/dashboard');
  }
  if (!slug) return unavailable;
  if (!validAdminLogin(username, slug, password) || typeof password !== 'string') return failure;
  let success = false;
  try {
    if (!await limit(`company:${slug}:${username}`)) return failure;
    const { data, error } = await privilegedClient().rpc('resolve_company_admin_login', { p_slug: slug, p_username: username });
    if (error) return unavailable;
    const identity = Array.isArray(data) ? data[0] : null;
    // A nonexistent username follows the same authentication path without exposing lookup results.
    const email = identity?.email ?? 'not-an-account@invalid.example';
    const companyId = identity?.company_id ?? null;
    const supabase = await sessionClient();
    const { data: signedIn, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError || !signedIn.user || !companyId) {
      if (signedIn.user) await supabase.auth.signOut();
      return failure;
    }
    const { data: verified, error: verifyError } = await supabase.auth.getUser();
    const { data: access, error: accessError } = await supabase.rpc('current_admin_access');
    const row = Array.isArray(access) ? access[0] : null;
    if (verifyError || !verified.user || accessError || !row || !mayAccessAdmin(row, companyId)) {
      await supabase.auth.signOut();
      return failure;
    }
    const store = await cookies();
    store.set(ACTIVE_COMPANY_COOKIE, companyId, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/'
    });
    success = true;
  } catch { return unavailable; }
  if (success) redirect('/company-admin/dashboard');
  return failure;
}
export async function companyLogin(_previous: LoginState, form: FormData) { return login(form); }
export async function signOut() {
  try { const client = await sessionClient(); await client.auth.signOut(); } catch { /* Clear local cookies even if the provider is unavailable. */ }
  try {
    const store = await cookies();
    store.delete(ACTIVE_COMPANY_COOKIE);
    store.delete(ADMIN_DEMO_COOKIE);
    const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (projectUrl) {
      const projectRef = new URL(projectUrl).hostname.split('.')[0];
      if (/^[a-z0-9]+$/.test(projectRef)) {
        const prefix = `sb-${projectRef}-auth-token`;
        for (const cookie of store.getAll()) if (cookie.name === prefix || cookie.name.startsWith(`${prefix}.`)) store.delete(cookie.name);
      }
    }
  } catch { /* No valid configured project or cookie store. */ }
  redirect('/company-admin/login');
}
