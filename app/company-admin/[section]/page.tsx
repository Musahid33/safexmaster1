import { notFound } from 'next/navigation';
import { companyPages, getCompanyPage } from '../config';
import { CompanyPage } from '../components/CompanyPage';

export function generateStaticParams() { return companyPages.map(({ slug }) => ({ section: slug })); }
export default async function CompanySection({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const page = getCompanyPage(section);
  if (!page) notFound();
  return <CompanyPage page={page} />;
}
