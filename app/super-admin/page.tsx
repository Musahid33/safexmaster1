'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Building2, Check, ChevronRight, CircleHelp, ClipboardList, Globe2, LayoutDashboard, LockKeyhole, MapPin, Plus, ShieldCheck, Trash2, Users, X } from 'lucide-react';
import { portalName } from '@/lib/portal-branding';
import './super-admin.css';

type View = 'overview' | 'companies' | 'onboarding';
type SiteDraft = { id: string; name: string; region: string; sosNumber: string };
type OnboardingDraft = { companyName: string; contactName: string; email: string; phone: string; sites: SiteDraft[] };
const emptySite = (): SiteDraft => ({ id: crypto.randomUUID(), name: '', region: '', sosNumber: '' });
const emptyDraft = (): OnboardingDraft => ({ companyName: '', contactName: '', email: '', phone: '', sites: [] });

export default function SuperAdminPage() {
  const [view, setView] = useState<View>('overview');
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<OnboardingDraft>(emptyDraft);
  const [siteError, setSiteError] = useState('');
  const [mobileMenu, setMobileMenu] = useState(false);
  const steps = ['Company details', 'Site setup', 'Review'];
  function startOnboarding() {
    setDraft({ ...emptyDraft(), sites: [emptySite()] });
    setSiteError(''); setStep(0); setView('onboarding'); setMobileMenu(false);
  }
  function navigate(next: View) { setView(next); setMobileMenu(false); }
  function updateSite(id: string, patch: Partial<SiteDraft>) {
    setDraft((current) => ({ ...current, sites: current.sites.map((site) => site.id === id ? { ...site, ...patch } : site) }));
    setSiteError('');
  }
  function nextStep(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step === 0 && (!draft.companyName.trim() || !draft.contactName.trim())) {
      setSiteError('Enter a company name and contact name.');
      return;
    }
    if (step === 1 && (!draft.sites.length || draft.sites.some((site) => !site.name.trim()))) {
      setSiteError('Add at least one site and provide a name for each site.');
      return;
    }
    setSiteError(''); setStep((current) => Math.min(current + 1, 2));
  }
  const nav = <>
    <button type="button" className={view === 'overview' ? 'active' : ''} onClick={() => navigate('overview')}><LayoutDashboard size={18} />Overview</button>
    <button type="button" className={view === 'companies' ? 'active' : ''} onClick={() => navigate('companies')}><Building2 size={18} />Companies</button>
    <button type="button" className={view === 'onboarding' ? 'active' : ''} onClick={() => view === 'onboarding' ? navigate('onboarding') : startOnboarding()}><ClipboardList size={18} />Onboarding</button>
  </>;

  return <div className="sa-app">
    <aside className="sa-sidebar">
      <div className="sa-brand"><img src="/icon-192.png" alt="Safex" /><div><strong>SafexSafety</strong><span>SUPER ADMIN</span></div></div>
      <div className="sa-side-label">WORKSPACE</div><nav className="sa-nav" aria-label="Super admin navigation">{nav}</nav>
      <div className="sa-side-bottom"><div className="sa-side-note"><ShieldCheck size={18} /><div><b>Preview workspace</b><span>No live data connected</span></div></div><Link href="/"><ArrowLeft size={16} /> Worker portal</Link></div>
    </aside>
    <div className="sa-main">
      <header className="sa-topbar"><div className="sa-mobile-brand"><img src="/icon-192.png" alt="Safex" /><b>SafexSafety</b></div><div className="sa-top-label">PLATFORM MANAGEMENT <span>/</span> {view === 'overview' ? 'Overview' : view === 'companies' ? 'Companies' : 'Onboarding'}</div><span className="sa-preview-pill"><span /> UI PREVIEW</span><button type="button" className="sa-menu-toggle" aria-expanded={mobileMenu} aria-label={mobileMenu ? 'Close menu' : 'Open menu'} onClick={() => setMobileMenu(!mobileMenu)}>{mobileMenu ? <X size={20} /> : <span>Menu</span>}</button></header>
      {mobileMenu && <nav className="sa-mobile-nav" aria-label="Super admin navigation">{nav}<Link href="/">Worker portal <ArrowRight size={16} /></Link></nav>}
      <main className="sa-content">
        <div className="sa-warning" role="note"><LockKeyhole size={17} /><span><b>UI preview only.</b> This page is not authenticated. Do not enter real company or personal information. No data is saved or sent.</span></div>
        {view === 'overview' && <>
          <div className="sa-page-head"><div><span className="sa-eyebrow">YOUR WORKSPACE</span><h1>Platform overview</h1><p>Manage company onboarding from one place.</p></div><button type="button" className="sa-primary" onClick={startOnboarding}><Plus size={18} /> Onboard company</button></div>
          <div className="sa-welcome"><div><span className="sa-welcome-tag"><span /> SUPER ADMIN WORKSPACE</span><h2>Bring every company<br />on board, with confidence.</h2><p>Set up a company and its sites, then review the details in one simple flow.</p><button type="button" onClick={startOnboarding}>Start onboarding <ArrowRight size={17} /></button></div><div className="sa-welcome-art" aria-hidden="true"><div><Building2 size={40} /></div><span className="sa-art-small one"><MapPin size={18} /></span><span className="sa-art-small two"><ShieldCheck size={18} /></span></div></div>
          <div className="sa-stats"><div><span className="sa-stat-icon blue"><Building2 size={19} /></span><div><small>Companies</small><strong>—</strong><p>Not connected</p></div></div><div><span className="sa-stat-icon gold"><MapPin size={19} /></span><div><small>Sites</small><strong>—</strong><p>Not connected</p></div></div><div><span className="sa-stat-icon green"><Users size={19} /></span><div><small>Company admins</small><strong>—</strong><p>Not connected</p></div></div></div>
          <div className="sa-section-title"><div><h2>Companies</h2><p>Your company workspace, at a glance.</p></div><button type="button" className="sa-text-button" onClick={() => navigate('companies')}>View companies <ArrowRight size={15} /></button></div>
          <EmptyCompanies onStart={startOnboarding} />
        </>}
        {view === 'companies' && <><div className="sa-page-head"><div><span className="sa-eyebrow">COMPANY MANAGEMENT</span><h1>Companies</h1><p>View and manage the companies on your platform.</p></div><button type="button" className="sa-primary" onClick={startOnboarding}><Plus size={18} /> Onboard company</button></div><EmptyCompanies onStart={startOnboarding} /></>}
        {view === 'onboarding' && <>
          <button type="button" className="sa-back" onClick={() => step ? setStep(step - 1) : navigate('overview')}><ArrowLeft size={16} /> {step ? 'Back' : 'Back to overview'}</button>
          <div className="sa-page-head sa-onboard-heading"><div><span className="sa-eyebrow">COMPANY ONBOARDING</span><h1>Set up a company</h1><p>Enter the details below to preview the onboarding flow.</p></div><span className="sa-step-count">STEP {step + 1} OF 3</span></div>
          <div className="sa-stepper" aria-label="Onboarding progress">{steps.map((label, index) => <div className={`sa-step ${step === index ? 'current' : ''} ${step > index ? 'done' : ''}`} key={label} aria-current={step === index ? 'step' : undefined}><span>{step > index ? <Check size={16} /> : index + 1}</span><b>{label}</b>{index < 2 && <i />}</div>)}</div>
          <div className="sa-form-layout"><div className="sa-form-card">
            {step < 2 ? <form onSubmit={nextStep}>
              {step === 0 ? <><div className="sa-card-heading"><span className="sa-card-icon"><Building2 size={21} /></span><div><h2>Company details</h2><p>Start with the organisation and its primary contact.</p></div></div><div className="sa-fields"><label>Company name <span>*</span><input value={draft.companyName} onChange={(e) => setDraft({ ...draft, companyName: e.target.value })} placeholder="Enter company name" maxLength={120} required /></label><div className="sa-field-pair"><label>Contact name <span>*</span><input value={draft.contactName} onChange={(e) => setDraft({ ...draft, contactName: e.target.value })} placeholder="Enter contact name" maxLength={120} required /></label><label>Contact email <span>*</span><input type="email" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} placeholder="Enter email address" maxLength={254} required /></label></div><label>Contact mobile <small>OPTIONAL</small><input type="tel" value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} placeholder="Enter mobile number" maxLength={30} /></label></div></> : <><div className="sa-card-heading"><span className="sa-card-icon gold"><MapPin size={21} /></span><div><h2>Site setup</h2><p>Add the locations where this company operates.</p></div></div><div className="sa-site-list">{draft.sites.map((site, index) => <div className="sa-site-card" key={site.id}><div className="sa-site-heading"><b>Site {index + 1}</b>{draft.sites.length > 1 && <button type="button" aria-label={`Remove site ${index + 1}`} onClick={() => setDraft({ ...draft, sites: draft.sites.filter((item) => item.id !== site.id) })}><Trash2 size={17} /></button>}</div><div className="sa-field-pair"><label>Site name <span>*</span><input value={site.name} onChange={(e) => updateSite(site.id, { name: e.target.value })} placeholder="Enter site name" maxLength={120} required /></label><label>Region <small>OPTIONAL</small><input value={site.region} onChange={(e) => updateSite(site.id, { region: e.target.value })} placeholder="Enter region" maxLength={120} /></label></div><label>Site emergency number <small>OPTIONAL</small><input type="tel" value={site.sosNumber} onChange={(e) => updateSite(site.id, { sosNumber: e.target.value })} placeholder="Enter site emergency number" maxLength={30} /></label></div>)}</div><button type="button" className="sa-add-site" onClick={() => setDraft({ ...draft, sites: [...draft.sites, emptySite()] })}><Plus size={16} /> Add another site</button></>}
              {siteError && <p className="sa-form-error" role="alert">{siteError}</p>}
              <div className="sa-form-footer"><span>Fields marked * are required</span><button type="submit" className="sa-primary">Continue <ArrowRight size={17} /></button></div>
            </form> : <><div className="sa-card-heading"><span className="sa-card-icon green"><Check size={21} /></span><div><h2>Review details</h2><p>Check your preview before completing onboarding.</p></div></div><div className="sa-review-section"><div className="sa-review-title"><h3>Company</h3><button type="button" onClick={() => setStep(0)}>Edit</button></div><dl><div><dt>Company name</dt><dd>{draft.companyName.trim()}</dd></div><div><dt>Portal name</dt><dd>{portalName(draft.companyName)}</dd></div><div><dt>Primary contact</dt><dd>{draft.contactName.trim()}</dd></div><div><dt>Contact email</dt><dd>{draft.email.trim()}</dd></div>{draft.phone.trim() && <div><dt>Mobile</dt><dd>{draft.phone.trim()}</dd></div>}</dl></div><div className="sa-review-section"><div className="sa-review-title"><h3>Sites</h3><button type="button" onClick={() => setStep(1)}>Edit</button></div>{draft.sites.map((site) => <div className="sa-review-site" key={site.id}><MapPin size={17} /><div><b>{site.name.trim()}</b><span>{site.region.trim() || 'No region provided'}{site.sosNumber.trim() && ` · SOS: ${site.sosNumber.trim()}`}</span></div></div>)}</div><div className="sa-preview-notice"><CircleHelp size={18} /><span>This is a preview only. Company creation, invitations and site setup are not connected.</span></div><div className="sa-form-footer"><button type="button" className="sa-secondary" onClick={() => setStep(1)}><ArrowLeft size={16} /> Back</button><button type="button" className="sa-primary" disabled title="Company creation is not connected">Create company <ArrowRight size={17} /></button></div></>}
          </div><aside className="sa-guide"><span className="sa-guide-icon"><Globe2 size={20} /></span><h3>One company, many sites</h3><p>Each company can have its own portal name and locations. Site-specific information can be configured later.</p><div className="sa-guide-rule" /><div className="sa-guide-tip"><LockKeyhole size={16} /><span>Draft details stay in this page only and are cleared on refresh. Use test information only.</span></div></aside></div>
        </>}
      </main>
    </div>
  </div>;
}

function EmptyCompanies({ onStart }: { onStart: () => void }) {
  return <div className="sa-empty"><span className="sa-empty-icon"><Building2 size={25} /></span><h3>Company data is not connected</h3><p>Companies will appear here once the platform is connected. You can preview the onboarding flow in the meantime.</p><button type="button" className="sa-secondary" onClick={onStart}><Plus size={17} /> Preview onboarding <ChevronRight size={15} /></button></div>;
}
