/**
 * Preview-only demo login for the admin console. Enabled only outside production
 * AND only when ADMIN_DEMO_PASSWORD is set — production deployments never set it,
 * so this path cannot be reached on a live site.
 */
export const ADMIN_DEMO_COOKIE = 'safetyos-admin-demo';

export function isAdminDemoEnabled(): boolean {
  return process.env.NODE_ENV !== 'production' && Boolean(process.env.ADMIN_DEMO_PASSWORD);
}

export function validAdminDemoLogin(username: string, password: unknown): boolean {
  return isAdminDemoEnabled()
    && username === 'admin'
    && typeof password === 'string'
    && password === process.env.ADMIN_DEMO_PASSWORD;
}
