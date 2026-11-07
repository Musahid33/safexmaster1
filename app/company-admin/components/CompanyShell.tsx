'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, ChevronDown, LockKeyhole, LogOut, Menu, Search, ShieldCheck, X } from 'lucide-react';
import { signOut } from '@/app/admin-auth/actions';
import { companyGroups, companyPages, getCompanyPage } from '../config';

export function CompanyShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState('');
  if (path === '/company-admin/login') return <div className="owner-root company-admin-root">{children}</div>;
  const current = getCompanyPage(path.split('/')[2] || 'dashboard');
  const filtered = companyPages.filter((page) => page.title.toLowerCase().includes(search.toLowerCase()));
  return <div className="owner-root owner-shell company-admin-root">
    {menu && <button className="owner-backdrop" onClick={() => setMenu(false)} aria-label="Close navigation" />}
    <aside className={`owner-sidebar ${menu ? 'is-open' : ''}`}>
      <Link className="owner-brand" href="/company-admin/dashboard" onClick={() => setMenu(false)}><img src="/icon-192.png" alt="" /><span><strong>SafetyOS<span className="owner-brand-dot">.</span></strong><small>COMPANY CONSOLE</small></span></Link>
      <button className="owner-mobile-close" aria-label="Close navigation" onClick={() => setMenu(false)}><X size={20} /></button>
      <div className="owner-workspace"><span className="owner-workspace-icon"><ShieldCheck size={18} /></span><span><b>Company workspace</b><small>Data not connected</small></span><ChevronDown size={15} /></div>
      <div className="owner-side-search"><Search size={15} /><input aria-label="Search navigation" placeholder="Find a page..." value={search} onChange={(event) => setSearch(event.target.value)} /></div>
      <nav className="owner-nav" aria-label="Company admin navigation">{companyGroups.map((group) => { const items = filtered.filter((item) => item.group === group); return items.length ? <div className="owner-nav-group" key={group}><div className="owner-nav-heading">{group}</div>{items.map(({ slug, title, icon: Icon }) => <Link key={slug} href={`/company-admin/${slug}`} onClick={() => setMenu(false)} className={current?.slug === slug ? 'is-active' : ''} aria-current={current?.slug === slug ? 'page' : undefined}><Icon size={17} /><span>{title}</span>{current?.slug === slug && <i />}</Link>)}</div> : null; })}{filtered.length === 0 && <p className="owner-no-nav">No pages found.</p>}</nav>
      <form action={signOut}><input type="hidden" name="portal" value="company" /><button type="submit" className="company-logout"><LogOut size={17} /> Logout</button></form>
      <div className="owner-side-footer"><span className="owner-side-avatar">CA</span><span><b>Company admin</b><small>Workspace preview</small></span><ShieldCheck size={16} /></div>
    </aside>
    <div className="owner-main"><header className="owner-header"><div className="owner-header-left"><button className="owner-menu-button" aria-label="Open navigation" onClick={() => setMenu(true)}><Menu size={20} /></button><span>Company workspace</span><span className="owner-crumb-sep">/</span><b>{current?.title || 'Company Admin'}</b></div><div className="owner-header-actions"><span className="owner-preview-badge"><i /> Preview mode</span><Link href="/company-admin/notifications" className="owner-icon-button" aria-label="Notifications"><Bell size={19} /></Link><span className="owner-header-divider" /><Link href="/company-admin/profile" className="owner-header-profile"><span className="owner-side-avatar">CA</span><span><b>Company admin</b><small>Workspace preview</small></span><ChevronDown size={14} /></Link></div></header>
      <div className="owner-content"><div className="owner-preview-note"><LockKeyhole size={16} /><span><b>UI preview only.</b> Company data and management actions are not connected yet. Do not enter sensitive information.</span><Link href="/company-admin/login">View login</Link></div>{children}</div><footer className="owner-footer"><span>© SafetyOS · Company console</span><span>Designed for safer workplaces</span></footer>
    </div>
  </div>;
}
