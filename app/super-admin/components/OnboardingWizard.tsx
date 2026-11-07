'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Building2, Check, CheckCircle2, ClipboardList, CreditCard, FolderOpen, Layers3, LockKeyhole, MapPin, Settings2, ShieldCheck, UserRound, WandSparkles } from 'lucide-react';

const steps = [
  { title: 'Company Information', description: 'Company profile', icon: Building2 },
  { title: 'Create Company Admin', description: 'Primary administrator', icon: UserRound },
  { title: 'Select Subscription Plan', description: 'Plan selection', icon: CreditCard },
  { title: 'Enable Modules', description: 'Workspace features', icon: Layers3 },
  { title: 'Create Default Location', description: 'First location', icon: MapPin },
  { title: 'Generate Company Workspace', description: 'Review & generate', icon: WandSparkles },
];
const tasks = ['Create tenant', 'Create database records', 'Create default folders', 'Create company admin', 'Enable selected modules', 'Apply default theme', 'Initialize company settings'];
const modules = ['Safety Reports', 'Training', 'Safety Resources', 'Compliance & Documents', 'Reward & Recognition'];
type Draft = { company: string; email: string; contact: string; adminName: string; adminEmail: string; plan: string; location: string; region: string; modules: string[] };
const emptyDraft = (): Draft => ({ company: '', email: '', contact: '', adminName: '', adminEmail: '', plan: '', location: '', region: '', modules: [] });

export function OnboardingWizard() {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [previewComplete, setPreviewComplete] = useState(false);
  const update = (field: keyof Omit<Draft, 'modules'>, value: string) => setDraft((current) => ({ ...current, [field]: value }));
  const toggleModule = (name: string) => setDraft((current) => ({ ...current, modules: current.modules.includes(name) ? current.modules.filter((item) => item !== name) : [...current.modules, name] }));
  const current = steps[step];
  const Icon = current.icon;
  function reset() { setDraft(emptyDraft()); setStep(0); setPreviewComplete(false); }
  return <div className="owner-onboarding">
    <div className="owner-wizard-intro"><span><ShieldCheck size={16} /> INTERACTIVE UI PREVIEW</span><p>Explore the onboarding journey using test information only. Nothing is saved or sent.</p></div>
    <div className="owner-wizard-layout">
      <aside className="owner-card owner-wizard-sidebar" aria-label="Onboarding steps"><div className="owner-wizard-side-head"><span>ONBOARDING JOURNEY</span><b>Company setup</b><small>Step {step + 1} of {steps.length}</small></div><ol>{steps.map((item, index) => <li key={item.title} className={`${index === step ? 'is-current' : ''} ${index < step ? 'is-visited' : ''}`}><span className="owner-wizard-step-num">{index < step ? <Check size={14} /> : index + 1}</span><span><b>{item.title}</b><small>{item.description}</small></span></li>)}</ol><div className="owner-wizard-side-note"><LockKeyhole size={16} /><span>Preview only. No real company or workspace will be created.</span></div></aside>
      <div className="owner-wizard-content">
        {previewComplete ? <section className="owner-card owner-wizard-success" role="status"><span className="owner-wizard-success-icon"><CheckCircle2 size={32} /></span><span className="owner-success-label">PREVIEW COMPLETE</span><h2>Company Workspace Created Successfully</h2><p>This is a simulated success screen only. No tenant, company admin, records, folders or workspace were created. Database and authentication are not connected.</p><div className="owner-success-status"><span /> Portal ready <b>UI preview only</b></div><div className="owner-wizard-success-actions"><button type="button" className="owner-button owner-button-secondary" onClick={reset}>Start a new preview</button><Link className="owner-button owner-button-primary" href="/super-admin/companies">Back to companies <ArrowRight size={16} /></Link></div></section> : <section className="owner-card owner-wizard-card">
          <div className="owner-wizard-card-head"><span className="owner-wizard-icon"><Icon size={21} /></span><div><span>STEP {step + 1} OF {steps.length}</span><h2>{current.title}</h2><p>{['Start with the basic company details.', 'Add the person who will manage the company workspace.', 'Preview the plan that will be assigned to this company.', 'Choose the features to include in the preview workspace.', 'Add the company’s first operating location.', 'Review the setup and preview workspace generation.'][step]}</p></div></div>
          <div className="owner-wizard-body">
            {step === 0 && <div className="owner-wizard-fields"><label>Company name<input value={draft.company} onChange={(e) => update('company', e.target.value)} placeholder="Enter company name" maxLength={120} /></label><label>Company email<input type="email" value={draft.email} onChange={(e) => update('email', e.target.value)} placeholder="Enter company email" maxLength={254} /></label><label>Contact name<input value={draft.contact} onChange={(e) => update('contact', e.target.value)} placeholder="Enter contact name" maxLength={120} /></label></div>}
            {step === 1 && <><div className="owner-wizard-fields"><label>Admin name<input value={draft.adminName} onChange={(e) => update('adminName', e.target.value)} placeholder="Enter admin name" maxLength={120} /></label><label>Admin email<input type="email" value={draft.adminEmail} onChange={(e) => update('adminEmail', e.target.value)} placeholder="Enter admin email" maxLength={254} /></label></div><div className="owner-wizard-note"><UserRound size={17} /><span>No administrator account or invitation will be created in this preview.</span></div></>}
            {step === 2 && <><div className="owner-wizard-fields"><label>Subscription plan <input value={draft.plan} onChange={(e) => update('plan', e.target.value)} placeholder="Enter a plan name for preview" maxLength={120} /></label></div><div className="owner-wizard-note"><CreditCard size={17} /><span>Plans are not connected yet. This field is for preview purposes only.</span></div></>}
            {step === 3 && <><p className="owner-wizard-subtext">Select example modules to preview this step. Availability will be configured after integration.</p><div className="owner-wizard-modules">{modules.map((module) => <label key={module}><input type="checkbox" checked={draft.modules.includes(module)} onChange={() => toggleModule(module)} /><span className="owner-module-icon"><Layers3 size={17} /></span><span><b>{module}</b><small>Preview selection</small></span></label>)}</div></>}
            {step === 4 && <><div className="owner-wizard-fields"><label>Location name<input value={draft.location} onChange={(e) => update('location', e.target.value)} placeholder="Enter location name" maxLength={120} /></label><label>Region <span>OPTIONAL</span><input value={draft.region} onChange={(e) => update('region', e.target.value)} placeholder="Enter region" maxLength={120} /></label></div><div className="owner-wizard-note"><MapPin size={17} /><span>The default location is only part of this preview and will not be saved.</span></div></>}
            {step === 5 && <><div className="owner-wizard-summary"><div><span>Company</span><b>{draft.company.trim() || 'Not provided'}</b></div><div><span>Company admin</span><b>{draft.adminName.trim() || 'Not provided'}</b></div><div><span>Subscription plan</span><b>{draft.plan.trim() || 'Not provided'}</b></div><div><span>Enabled modules</span><b>{draft.modules.length ? draft.modules.join(', ') : 'None selected'}</b></div><div><span>Default location</span><b>{draft.location.trim() || 'Not provided'}</b></div></div><div className="owner-wizard-task-head"><span className="owner-wizard-icon small"><Settings2 size={18} /></span><div><h3>Workspace generation</h3><p>These actions are planned for a future integration. They will not run in this preview.</p></div></div><div className="owner-wizard-tasks">{tasks.map((task, index) => { const TaskIcon = index === 2 ? FolderOpen : index === 3 ? UserRound : index === 4 ? Layers3 : index === 6 ? Settings2 : ClipboardList; return <div key={task}><TaskIcon size={16} /><span>{task}</span><small>Not connected</small></div>; })}</div></>}
          </div>
          <div className="owner-wizard-footer"><button type="button" className="owner-button owner-button-secondary" onClick={() => setStep((value) => value - 1)} disabled={step === 0}><ArrowLeft size={16} /> Back</button><span>Preview only · No data saved</span>{step < steps.length - 1 ? <button type="button" className="owner-button owner-button-primary" onClick={() => setStep((value) => value + 1)}>Continue <ArrowRight size={16} /></button> : <button type="button" className="owner-button owner-button-primary" onClick={() => setPreviewComplete(true)}><WandSparkles size={16} /> Preview generation</button>}</div>
        </section>}
      </div>
    </div>
  </div>;
}
