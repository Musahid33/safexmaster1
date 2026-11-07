'use client';
import { PortalContext } from './useSafexBootstrap';
import type { PublicPortal } from '@/lib/public-portal';

export default function PortalProvider({ portal, children }: { portal: PublicPortal; children: React.ReactNode }) {
  return <PortalContext.Provider value={portal}>{children}</PortalContext.Provider>;
}
