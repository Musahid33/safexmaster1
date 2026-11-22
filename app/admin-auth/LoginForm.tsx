'use client';
import { useActionState } from 'react';
import { ArrowRight } from 'lucide-react';
import { companyLogin } from './actions';
export function LoginForm() {
  const [state, action, pending] = useActionState(companyLogin, { error: '' });
  return <form className="owner-login-fields" action={action}>
    <label>Company code<input name="company" autoComplete="organization" placeholder="Enter company code" required maxLength={100} /></label>
    <label>User name<input name="username" type="text" autoComplete="username" placeholder="Enter your user name" required maxLength={254} /></label>
    <label>Password<input name="password" type="password" autoComplete="current-password" placeholder="Enter your password" required maxLength={1024} /></label>
    {state.error && <div className="owner-login-warning" role="alert">{state.error}</div>}
    <div className="owner-login-meta"><span>Company admin access</span><span>Password recovery not yet connected</span></div>
    <button className="owner-button owner-button-primary" type="submit" disabled={pending}>{pending ? 'Signing in…' : 'Sign in'} <ArrowRight size={17} /></button>
  </form>;
}
