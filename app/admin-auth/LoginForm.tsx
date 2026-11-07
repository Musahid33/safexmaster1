'use client';
import { useActionState } from 'react';
import { ArrowRight } from 'lucide-react';
import { companyLogin, ownerLogin } from './actions';
export function LoginForm({ kind }: { kind: 'owner' | 'company' }) {
  const [state, action, pending] = useActionState(kind === 'owner' ? ownerLogin : companyLogin, { error: '' });
  return <form className="owner-login-fields" action={action}>
    {kind === 'company' && <label>Company code<input name="company" autoComplete="organization" placeholder="Enter company code" required maxLength={100} /></label>}
    <label>{kind === 'owner' ? 'Email address' : 'User name'}<input name="username" type={kind === 'owner' ? 'email' : 'text'} autoComplete="username" placeholder={kind === 'owner' ? 'Enter your email address' : 'Enter your user name'} required maxLength={254} /></label>
    <label>Password<input name="password" type="password" autoComplete="current-password" placeholder="Enter your password" required maxLength={1024} /></label>
    {state.error && <div className="owner-login-warning" role="alert">{state.error}</div>}
    <div className="owner-login-meta"><span>{kind === 'owner' ? 'Platform owner access' : 'Company admin access'}</span><span>Password recovery not yet connected</span></div>
    <button className="owner-button owner-button-primary" type="submit" disabled={pending}>{pending ? 'Signing in…' : 'Sign in'} <ArrowRight size={17} /></button>
  </form>;
}
