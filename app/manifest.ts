import type { MetadataRoute } from 'next';

/**
 * UI-only fallback manifest. Tenant-specific installation names require a server-provided
 * manifest once tenant resolution is implemented. The Safex app icons remain shared.
 */
export default function manifest(): MetadataRoute.Manifest {
  const appName = 'Safety Portal';
  return {
    name: appName,
    short_name: appName,
    description: `${appName} · Site-aware safety reporting and alerts`,
    start_url: '/',
    display: 'standalone',
    background_color: '#f4f6f9',
    theme_color: '#0f2540',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }
    ]
  };
}
