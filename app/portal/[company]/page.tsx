import { notFound } from 'next/navigation';
import SafexHome from '@/app/page';
import PortalProvider from '@/app/components/PortalProvider';
import { loadPublicPortal } from '@/lib/server/public-portal';

// Never statically cache tenant metadata between companies or across publication changes.
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export default async function CompanyPortal({ params }: { params: Promise<{ company: string }> }) {
  const { company } = await params;
  const portal = await loadPublicPortal(company);
  if (!portal) notFound();
  return <PortalProvider portal={portal}><SafexHome /></PortalProvider>;
}
