import { notFound } from 'next/navigation';
import { getPage, pages } from '../config';
import { AdminPage } from '../components/AdminPage';

export function generateStaticParams() { return pages.map(({ slug }) => ({ section: slug })); }
export default async function SectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const page = getPage(section);
  if (!page) notFound();
  return <AdminPage page={page} />;
}
