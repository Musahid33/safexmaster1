import type { Metadata } from 'next';
import { CompanyShell } from './components/CompanyShell';
import '../super-admin/super-admin.css';
import './company-admin.css';

export const metadata: Metadata = { title: 'Company Admin | SafetyOS', description: 'SafetyOS company administrator workspace preview' };
export default function CompanyAdminLayout({ children }: { children: React.ReactNode }) { return <CompanyShell>{children}</CompanyShell>; }
