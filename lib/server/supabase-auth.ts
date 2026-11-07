import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

function settings() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error('Authentication is not configured');
  return { url, key };
}
export async function sessionClient() {
  const { url, key } = settings();
  const store = await cookies();
  return createServerClient(url, key, { cookies: {
    getAll: () => store.getAll(),
    setAll: (items) => { for (const { name, value, options } of items) store.set(name, value, { ...options, httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' }); }
  }});
}
export function privilegedClient() {
  const { url } = settings();
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error('Authentication is not configured');
  return createClient(url, secret, { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } });
}
