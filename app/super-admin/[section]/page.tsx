import { notFound } from 'next/navigation';
import { requireAdminAccess } from '@/lib/server/admin-guard';
import { getPage } from '../config';
import { AdminPage } from '../components/AdminPage';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function SectionPage({ params }: { params: Promise<{ section: string }> }) {
  await requireAdminAccess('owner');
  const { section } = await params;
  const page = getPage(section);
  if (!page) notFound();
  return <AdminPage page={page} />;
}
