import { notFound } from 'next/navigation';
import { requireAdminAccess } from '@/lib/server/admin-guard';
import { getCompanyPage } from '../config';
import { CompanyPage } from '../components/CompanyPage';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CompanySection({ params }: { params: Promise<{ section: string }> }) {
  await requireAdminAccess();
  const { section } = await params;
  const page = getCompanyPage(section);
  if (!page) notFound();
  return <CompanyPage page={page} />;
}
