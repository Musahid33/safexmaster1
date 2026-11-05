'use client';

import {
  ArrowLeft, ArrowRight, BarChart3, Building2, Check, ChevronRight, ExternalLink, Eye, EyeOff, FileText, Globe2, GraduationCap, HardHat, Info,
  LockKeyhole, LogIn, Mail, MapPin, Palette, Phone, ShieldCheck, Smartphone, UserRound, X
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import type { TenantBranding } from '@/lib/types';
import { APP_VERSION, SAFEX_WEBSITE_URL } from '@/lib/app-info';
import { useI18n } from './I18nProvider';

export type MoreInfoKind = 'privacy' | 'terms' | 'support' | 'change-password' | 'account-settings';

type MoreMenuPageProps = {
  title: string;
  companyName: string;
  onInstall: () => void;
  onCompanyAbout: () => void;
  onSearchEmployee: () => void;
  onAccount: () => void;
  onAppearance: () => void;
  onPrivacy: () => void;
};

type MoreOptionCardProps = {
  icon: LucideIcon;
  tone: string;
  title: string;
  description: string;
  onClick: () => void;
};

function safeExternalUrl(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(/^[a-z][a-z\d+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
}

function emailHref(value: string | null | undefined): string | null {
  const email = value?.trim();
  return email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? `mailto:${email}` : null;
}

function phoneHref(value: string | null | undefined): string | null {
  const phone = value?.trim();
  if (!phone) return null;
  const normalized = phone.replace(/[^\d+]/g, '');
  return normalized.length >= 7 ? `tel:${normalized}` : null;
}

function MoreOptionCard({ icon: Icon, tone, title, description, onClick }: MoreOptionCardProps) {
  const { T } = useI18n();
  return <button type="button" className="more-option-card" onClick={onClick}>
    <span className={`more-option-icon ${tone}`}><Icon size={20} aria-hidden="true" /></span>
    <span className="more-option-copy"><b>{T(title)}</b><small>{T(description)}</small></span>
    <ChevronRight size={19} className="more-option-arrow" aria-hidden="true" />
  </button>;
}

export function MoreMenuPage({ title, companyName, onInstall, onCompanyAbout, onSearchEmployee, onAccount, onAppearance, onPrivacy }: MoreMenuPageProps) {
  const { T } = useI18n();
  return <section className="page-panel more-landing-page">
    <div className="more-page-heading">
      <div><span className="eyebrow">{T('SAFETYOS · MENU')}</span><h1>{T(title)}</h1><p>{T('App tools, company details and personal settings.')}</p></div>
      <span className="more-heading-icon"><ShieldCheck size={24} aria-hidden="true" /></span>
    </div>
    <div className="more-option-list" aria-label={T('More options')}>
      <MoreOptionCard icon={Smartphone} tone="install" title="Install App" description={T('Install {company} on this device', { company: companyName || T('the company app') })} onClick={onInstall} />
      <MoreOptionCard icon={Building2} tone="company" title="Company Profile" description="About us, services and contact details" onClick={onCompanyAbout} />
      <MoreOptionCard icon={UserRound} tone="employee" title="Search Employee Profile" description="Find an employee using their Employee ID" onClick={onSearchEmployee} />
      <MoreOptionCard icon={LockKeyhole} tone="account" title="Account Login" description="Login, logout, password and account settings" onClick={onAccount} />
      <MoreOptionCard icon={Palette} tone="appearance" title="Appearance" description="Light Mode, Dark Mode and System Default" onClick={onAppearance} />
      <MoreOptionCard icon={ShieldCheck} tone="about-app" title="Privacy Policy" description="Read our data privacy policy" onClick={onPrivacy} />
    </div>
  </section>;
}

function MoreSubpageHeading({ eyebrow, title, description, icon: Icon, onBack }: {
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
  onBack: () => void;
}) {
  const { T } = useI18n();
  return <>
    <button type="button" className="more-page-back" onClick={onBack}><ArrowLeft size={16} /> {T('Back to More')}</button>
    <div className="more-page-heading subpage">
      <div><span className="eyebrow">{T(eyebrow)}</span><h1>{T(title)}</h1><p>{T(description)}</p></div>
      <span className="more-heading-icon"><Icon size={24} aria-hidden="true" /></span>
    </div>
  </>;
}

function CompanyLogo({ company, className = '', fallback = 'monogram' }: { company: TenantBranding; className?: string; fallback?: 'monogram' | 'safex' }) {
  const { T } = useI18n();
  const logoPath = company.logoPath?.trim();
  return <span className={`company-logo-mark ${className}`}>
    {logoPath
      ? <img src={logoPath} alt={T('{company} logo', { company: company.companyName })} />
      : fallback === 'safex'
        ? <img src="/icon-192.png" alt={T('Safex app icon fallback')} />
        : <span aria-hidden="true">{company.companyName.trim().charAt(0) || 'C'}</span>}
  </span>;
}

function CompanyDetail({ icon: Icon, label, value, href }: { icon: LucideIcon; label: string; value: string | null | undefined; href?: string | null }) {
  const { T } = useI18n();
  return <div className="company-detail-row">
    <span className="company-detail-icon"><Icon size={17} aria-hidden="true" /></span>
    <span className="company-detail-copy"><small>{T(label)}</small>{href ? <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}>{value}</a> : <b>{value?.trim() || T('Not provided')}</b>}</span>
  </div>;
}

/** Display-only profile; a future tenant data source can provide these fields. */
export type CompanyProfile = {
  name?: string | null;
  about?: string | null;
  services?: string[] | null;
  address?: string | null;
  email?: string | null;
  mobile?: string | null;
};

export function CompanyAboutPage({ profile, onBack }: { profile: CompanyProfile | null; onBack: () => void }) {
  const { T } = useI18n();
  const services = (profile?.services ?? []).map((service) => service.trim()).filter(Boolean);
  return <section className="page-panel more-subpage-panel company-about-page">
    <MoreSubpageHeading eyebrow="COMPANY PROFILE" title="Company Profile" description="Company information and contact details." icon={Building2} onBack={onBack} />
    <div className="company-profile-banner">
      <span className="company-logo-mark" aria-hidden="true">{profile?.name?.trim().charAt(0) || 'C'}</span>
      <span className="company-profile-banner-copy"><small>{T('COMPANY PROFILE')}</small><b>{profile?.name?.trim() || T('Company name not provided')}</b></span>
    </div>
    <div className="company-about-card">
      <div className="company-about-card-heading"><span className="company-about-card-icon"><Info size={18} /></span><h2>{T('About Us')}</h2></div>
      <p>{profile?.about?.trim() || T('No company information available yet.')}</p>
    </div>
    <div className="company-about-card">
      <div className="company-about-card-heading"><span className="company-about-card-icon services"><ShieldCheck size={18} /></span><h2>{T('Services')}</h2></div>
      {services.length ? <ul className="company-services-list">{services.map((service, index) => <li key={`${service}-${index}`}>{service}</li>)}</ul> : <p>{T('No services available yet.')}</p>}
    </div>
    <div className="company-about-card">
      <div className="company-about-card-heading"><span className="company-about-card-icon contact"><Phone size={18} /></span><h2>{T('Contact Details')}</h2></div>
      <div className="company-detail-list">
        <CompanyDetail icon={MapPin} label="Address" value={profile?.address} />
        <CompanyDetail icon={Mail} label="Email ID" value={profile?.email} href={emailHref(profile?.email)} />
        <CompanyDetail icon={Phone} label="Mobile" value={profile?.mobile} href={phoneHref(profile?.mobile)} />
      </div>
    </div>
  </section>;
}

export function AccountManagementPage({ onBack }: { onBack: () => void }) {
  const { T } = useI18n();
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    event.currentTarget.reset();
    setShowPassword(false);
    setMessage('Login is not connected in this UI preview. No credentials were sent.');
  }
  return <section className="page-panel account-management-page">
    <div className="login-page-shell">
      <button type="button" className="account-back-link" onClick={onBack}><ArrowLeft size={17} aria-hidden="true" />{T('Back to More')}</button>
      <div className="login-layout">
        <div className="login-visual">
          <div className="login-visual-content">
            <h1>{T('Safety First,')}<br />{T('Always.')}</h1>
            <span className="login-accent-line" aria-hidden="true" />
            <ul className="login-feature-list">
              <li><HardHat size={23} aria-hidden="true" />{T('Report Hazards')}</li>
              <li><GraduationCap size={23} aria-hidden="true" />{T('Complete Training')}</li>
              <li><FileText size={23} aria-hidden="true" />{T('Access Safety Documents')}</li>
              <li><BarChart3 size={23} aria-hidden="true" />{T('Track Safety Performance')}</li>
            </ul>
          </div>
        </div>
        <div className="login-form-area">
          <div className="account-form-card">
            <div className="account-card-body">
              <div className="account-form-intro"><div><h2>{T('Welcome Back')}</h2><p>{T('Sign in to continue to your account.')}</p></div></div>
              <form className="account-master-form" onSubmit={handleLogin}>
                <div className="account-field"><label htmlFor="account-username">{T('Username')}</label><div className="account-field-control"><UserRound size={21} aria-hidden="true" /><input id="account-username" name="username" type="text" placeholder={T('Enter your username')} autoComplete="off" required /></div></div>
                <div className="account-field"><label htmlFor="account-password">{T('Password')}</label><div className="account-field-control"><LockKeyhole size={21} aria-hidden="true" /><input id="account-password" name="password" type={showPassword ? 'text' : 'password'} placeholder={T('Enter your password')} autoComplete="off" required /><button type="button" className="account-visibility" aria-label={T(showPassword ? 'Hide password' : 'Show password')} aria-pressed={showPassword} onClick={() => setShowPassword((visible) => !visible)}>{showPassword ? <EyeOff size={19} /> : <Eye size={19} />}</button></div></div>
                <button className="primary-button account-submit" type="submit"><span>{T('Sign In')}</span><ArrowRight size={20} aria-hidden="true" /></button>
                <button className="account-reset" type="button" onClick={() => setMessage('Password reset is not connected in this UI preview.')}>{T('Reset Password')}</button>
              </form>
              {message && <div className="inline-notice account-form-message" role="status">{T(message)}</div>}
              <div className="account-preview-note"><Info size={16} aria-hidden="true" /><span>{T('UI preview only. Login and password reset are not connected. Please do not enter real credentials.')}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>;
}

function AboutLink({ icon: Icon, title, description, url, onClick }: {
  icon: LucideIcon;
  title: string;
  description: string;
  url?: string | null;
  onClick: () => void;
}) {
  const { T } = useI18n();
  const href = safeExternalUrl(url);
  const content = <>
    <span className="more-option-icon about-app"><Icon size={19} aria-hidden="true" /></span>
    <span className="more-option-copy"><b>{T(title)}</b><small>{T(description)}</small></span>
    {href ? <ExternalLink size={16} className="more-option-arrow" aria-hidden="true" /> : <ChevronRight size={19} className="more-option-arrow" aria-hidden="true" />}
  </>;
  return href
    ? <a className="more-option-card" href={href} target="_blank" rel="noopener noreferrer">{content}</a>
    : <button type="button" className="more-option-card" onClick={onClick}>{content}</button>;
}

export function AboutAppPage({ company, onBack, onOpenInfo }: {
  company: TenantBranding;
  onBack: () => void;
  onOpenInfo: (kind: MoreInfoKind) => void;
}) {
  const { T } = useI18n();
  const appName = company.companyName.trim() || T('Company App');
  return <section className="page-panel more-subpage-panel about-app-page">
    <MoreSubpageHeading eyebrow="SAFETYOS · APP INFORMATION" title="About App" description="App identity, version and legal/support resources." icon={Info} onBack={onBack} />
    <div className="about-app-identity-card">
      <CompanyLogo company={company} className="about-app-logo" fallback="safex" />
      <div className="about-app-facts">
        <div><span>{T('App Name')}</span><b>{appName}</b></div>
        <div><span>{T('Version')}</span><b>{APP_VERSION}</b></div>
        <div><span>{T('Powered by')}</span><a href={SAFEX_WEBSITE_URL} target="_blank" rel="noopener noreferrer">Safex.com <ExternalLink size={13} /></a></div>
      </div>
    </div>
    <div className="about-app-section-heading"><span className="eyebrow">{T('INFORMATION & SUPPORT')}</span></div>
    <div className="more-option-list about-app-links">
      <AboutLink icon={FileText} title="Privacy Policy" description={company.privacyPolicyUrl ? 'Open the company privacy policy' : 'Not configured by Admin'} url={company.privacyPolicyUrl} onClick={() => onOpenInfo('privacy')} />
      <AboutLink icon={ShieldCheck} title="Terms & Conditions" description={company.termsAndConditionsUrl ? 'Open the company terms' : 'Not configured by Admin'} url={company.termsAndConditionsUrl} onClick={() => onOpenInfo('terms')} />
      <MoreOptionCard icon={Mail} tone="company" title="Contact Support" description="View company support contact information" onClick={() => onOpenInfo('support')} />
    </div>
  </section>;
}

export function InstallAppPage({ company, canInstall, installMessage, onInstall, onBack }: {
  company: TenantBranding;
  canInstall: boolean;
  installMessage: { key: string; params?: Record<string, string | number> } | null;
  onInstall: () => void;
  onBack: () => void;
}) {
  const { T } = useI18n();
  const appName = company.companyName.trim() || T('Company App');
  return <section className="page-panel more-subpage-panel narrow-panel install-app-page">
    <MoreSubpageHeading eyebrow="MORE · APP" title="Install App" description="Add your company’s safety app to this device." icon={Smartphone} onBack={onBack} />
    <div className="install-card install-company-card">
      <CompanyLogo company={company} className="install-company-logo" fallback="safex" />
      <span className="install-company-kicker">{T('COMPANY-BRANDED APP')}</span>
      <h2>{appName}</h2>
      <p>{T('The installed app name follows the Admin-configured Company Name.')}</p>
      <button className="primary-button install-button" onClick={onInstall}><Smartphone size={17} /> {T('Install {app}', { app: appName })}</button>
      {installMessage && <div className="inline-notice" role="status">{T(installMessage.key, installMessage.params)}</div>}
      {!installMessage && <div className="install-availability"><span className={`install-availability-dot ${canInstall ? 'available' : ''}`} />{canInstall ? T('One-tap installation is available in this browser.') : T('If no prompt appears, use your browser menu to install or add to the Home Screen.')}</div>}
    </div>
    <div className="company-logo-install-note"><Info size={16} /><span>{company.logoPath ? T('The Admin-configured company logo is shown inside the app.') : T('No Company Logo is configured yet; the bundled Safex icon is used until Admin uploads one.')}</span></div>
    <div className="settings-card install-branding-note"><h2>{T('Install branding')}</h2><p>{T('The PWA manifest, browser title and install name use the configured Company Name. The manifest icon uses the configured Company Logo, with a Safex fallback when none is set. Production admin changes must be published to the tenant manifest before installation.')}</p></div>
  </section>;
}

export function MoreInfoDialog({ kind, company, onClose, onLogin }: {
  kind: MoreInfoKind;
  company: TenantBranding;
  onClose: () => void;
  onLogin: () => void;
}) {
  const { T } = useI18n();
  const title = kind === 'privacy' ? T('Privacy Policy')
    : kind === 'terms' ? T('Terms & Conditions')
      : kind === 'support' ? T('Contact Support')
        : kind === 'change-password' ? T('Change Password')
          : T('Account Settings');
  const hasSupport = Boolean(company.supportEmail?.trim() || company.supportMobile?.trim());
  return <div className="overlay more-info-overlay" role="dialog" aria-modal="true" aria-labelledby="more-info-title">
    <div className="modal more-info-modal">
      <div className="modal-header"><div><span className="eyebrow">{T('MORE · INFORMATION')}</span><h2 id="more-info-title">{title}</h2></div><button type="button" className="close-button" onClick={onClose} aria-label={T('Close {title}', { title })}><X size={18} /></button></div>
      {kind === 'privacy' && <div className="more-info-copy privacy-policy-copy">
        <p className="privacy-preview-note">{T('UI preview only: data protection measures must be verified before production use.')}</p>
        <h3>{T('Data Privacy Policy')}</h3>
        <p>{T('We value your privacy and are committed to protecting your personal information. SafetyOS collects only the data necessary to provide our services, including account details, safety reports, training records, and system usage information.')}</p>
        <p>{T('Your data is securely stored, encrypted, and accessible only to authorized users based on their roles. We do')} <strong>{T('not')}</strong> {T('sell your personal information. Data may be shared only with your organization, trusted service providers, or government authorities when required by law.')}</p>
        <p>{T('By using SafetyOS, you agree to the collection and processing of your information in accordance with this Privacy Policy.')}</p>
        <p><strong>{T('Last Updated:')}</strong> {T('November 2026')}</p>
      </div>}
      {kind === 'terms' && <div className="more-info-copy"><p>{T('Terms & Conditions have not been published for this company yet.')}</p><p>{T('Ask the company Admin to configure the approved terms before production use.')}</p></div>}
      {kind === 'support' && <div className="more-info-copy"><p>{T('Support contacts for {company}:', { company: company.companyName || T('this company') })}</p>{hasSupport ? <div className="company-detail-list support-dialog-details">
        <CompanyDetail icon={Mail} label="Support email" value={company.supportEmail} href={emailHref(company.supportEmail)} />
        <CompanyDetail icon={Phone} label="Support phone" value={company.supportMobile} href={phoneHref(company.supportMobile)} />
      </div> : <div className="more-info-unconfigured">{T('Support email and phone have not been configured by Admin.')}</div>}</div>}
      {kind === 'change-password' && <div className="more-info-copy"><p>{T('Password changes are unavailable because account authentication is not connected. No password was changed.')}</p><p>{T('Once account authentication is configured, use the verified account flow to change or recover a password.')}</p><button type="button" className="primary-button full-button more-info-primary" onClick={onLogin}><LogIn size={16} /> {T('Open Account Login')}</button></div>}
      {kind === 'account-settings' && <div className="more-info-copy"><p>{T('There is no signed-in account, so account-specific settings are unavailable.')}</p><p>{T('Appearance and notification preferences remain available locally. Secure account preferences require an authenticated server session.')}</p></div>}
    </div>
  </div>;
}
