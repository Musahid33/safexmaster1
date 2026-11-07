import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { parsePublicPortal, validPortalSlug, type PublicPortal } from '@/lib/public-portal';

export async function loadPublicPortal(slug: string): Promise<PublicPortal | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key || !validPortalSlug(slug)) return null;
  try {
    const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }) } });
    const { data, error } = await client.rpc('get_public_portal', { p_slug: slug });
    return error ? null : parsePublicPortal(data, slug);
  } catch { return null; }
}
