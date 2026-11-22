import type { Metadata } from 'next';
import { HardHat, GraduationCap, FileText, BarChart3 } from 'lucide-react';
import { LoginForm } from '@/app/admin-auth/LoginForm';
import './admin-login.css';

export const metadata = { title: 'Company Admin Sign In' };

export default function CompanyLogin() {
  // This portal serves exactly one company, configured by the deployment.
  const connected = Boolean(process.env.COMPANY_PORTAL_SLUG?.trim());
  const demoEnabled = Boolean(process.env.ADMIN_DEMO_PASSWORD);
  return <main className="admin-login">
    <div className="login-page-shell">
      <div className="login-layout">
        <div className="login-visual">
          <div className="login-visual-content">
            <h1>Safety First,<br />Always.</h1>
            <span className="login-accent-line" aria-hidden="true" />
            <ul className="login-feature-list">
              <li><HardHat size={23} aria-hidden="true" />Report Hazards</li>
              <li><GraduationCap size={23} aria-hidden="true" />Complete Training</li>
              <li><FileText size={23} aria-hidden="true" />Access Safety Documents</li>
              <li><BarChart3 size={23} aria-hidden="true" />Track Safety Performance</li>
            </ul>
          </div>
        </div>
        <div className="login-form-area">
          <div className="account-form-card">
            <div className="account-card-body">
              <LoginForm connected={connected} demoEnabled={demoEnabled} />
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>;
}
