'use client';
import { useEffect } from 'react';
import { PortalContext } from './useSafexBootstrap';
import type { PublicPortal } from '@/lib/public-portal';

export default function PortalProvider({ portal, children }: { portal: PublicPortal; children: React.ReactNode }) {
  // Mark the document when a real tenant resolved. Demo mode checks this marker so sample
  // data can never appear over a company's own portal URL.
  useEffect(() => {
    document.documentElement.dataset.tenant = portal.companySlug;
    return () => { delete document.documentElement.dataset.tenant; };
  }, [portal.companySlug]);

  return <PortalContext.Provider value={portal}>{children}</PortalContext.Provider>;
}
