import type { Metadata } from 'next';
import { AdminShell } from './components/AdminShell';
import './super-admin.css';

export const metadata: Metadata = { title: 'Super Admin | SafetyOS', description: 'SafetyOS platform owner workspace' };
export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
