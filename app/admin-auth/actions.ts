'use server';
import { createHmac } from 'node:crypto';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { privilegedClient, sessionClient } from '@/lib/server/supabase-auth';
import { mayAccessAdmin, validAdminLogin } from '@/lib/admin-access';

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
async function login(kind: 'owner' | 'company', form: FormData): Promise<LoginState> {
  const username = normalize(form.get('username'));
  const slug = normalize(form.get('company'));
  const password = form.get('password');
  if (!validAdminLogin(kind, username, slug, password) || typeof password !== 'string') return failure;
  let success = false;
  try {
    if (!await limit(`${kind}:${slug}:${username}`)) return failure;
    let email = username;
    let companyId: string | null = null;
    if (kind === 'company') {
      const { data, error } = await privilegedClient().rpc('resolve_company_admin_login', { p_slug: slug, p_username: username });
      if (error) return unavailable;
      const identity = Array.isArray(data) ? data[0] : null;
      // A nonexistent username follows the same authentication path without exposing lookup results.
      email = identity?.email ?? 'not-an-account@invalid.example';
      companyId = identity?.company_id ?? null;
    }
    const supabase = await sessionClient();
    const { data: signedIn, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError || !signedIn.user || (kind === 'company' && !companyId)) {
      if (signedIn.user) await supabase.auth.signOut();
      return failure;
    }
    const { data: verified, error: verifyError } = await supabase.auth.getUser();
    const { data: access, error: accessError } = await supabase.rpc('current_admin_access');
    const row = Array.isArray(access) ? access[0] : null;
    if (verifyError || !verified.user || accessError || !row || !mayAccessAdmin(kind, row, kind === 'company' ? companyId : undefined)) {
      await supabase.auth.signOut();
      return failure;
    }
    success = true;
  } catch { return unavailable; }
  if (success) redirect(kind === 'owner' ? '/super-admin/dashboard' : '/company-admin/dashboard');
  return failure;
}
export async function ownerLogin(_previous: LoginState, form: FormData) { return login('owner', form); }
export async function companyLogin(_previous: LoginState, form: FormData) { return login('company', form); }
export async function signOut(form: FormData) {
  const destination = form.get('portal') === 'owner' ? '/super-admin/login' : '/company-admin/login';
  try { const client = await sessionClient(); await client.auth.signOut(); } catch { /* Clear local cookies even if the provider is unavailable. */ }
  const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  try {
    if (projectUrl) {
      const projectRef = new URL(projectUrl).hostname.split('.')[0];
      if (/^[a-z0-9]+$/.test(projectRef)) {
        const store = await cookies();
        const prefix = `sb-${projectRef}-auth-token`;
        for (const cookie of store.getAll()) if (cookie.name === prefix || cookie.name.startsWith(`${prefix}.`)) store.delete(cookie.name);
      }
    }
  } catch { /* No valid configured project or cookie store. */ }
  redirect(destination);
}
