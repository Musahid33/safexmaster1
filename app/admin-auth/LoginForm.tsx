'use client';
import { useActionState, useState, type FormEvent } from 'react';
import { ArrowRight, Eye, EyeOff, Info, LockKeyhole, UserRound } from 'lucide-react';
import { companyLogin, demoLogin } from './actions';

export function LoginForm({ connected, demoEnabled }: { connected: boolean; demoEnabled: boolean }) {
  const [state, action, pending] = useActionState(companyLogin, { error: '' });
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    setMessage('');
    if (!connected && !demoEnabled) {
      event.preventDefault();
      event.currentTarget.reset();
      setShowPassword(false);
      setMessage('Company Admin login is unavailable until this company portal is connected. No credentials were sent.');
    }
  }

  return <>
    <div className="account-form-intro"><div><h2>Welcome Back</h2><p>Sign in to continue to your account.</p></div></div>
    <form className="account-master-form" action={action} onSubmit={handleSubmit}>
      <div className="account-field">
        <label htmlFor="account-username">Username</label>
        <div className="account-field-control">
          <UserRound size={21} aria-hidden="true" />
          <input id="account-username" name="username" type="text" placeholder="Enter your username" autoComplete="username" required maxLength={254} />
        </div>
      </div>
      <div className="account-field">
        <label htmlFor="account-password">Password</label>
        <div className="account-field-control">
          <LockKeyhole size={21} aria-hidden="true" />
          <input id="account-password" name="password" type={showPassword ? 'text' : 'password'} placeholder="Enter your password" autoComplete="current-password" required maxLength={1024} />
          <button type="button" className="account-visibility" aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword} onClick={() => setShowPassword((visible) => !visible)}>
            {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
          </button>
        </div>
      </div>
      <button className="account-submit" type="submit" disabled={pending}>
        <span>{pending ? 'Signing in…' : 'Sign In'}</span><ArrowRight size={20} aria-hidden="true" />
      </button>
      <button className="account-reset" type="button" onClick={() => setMessage('Password reset is not connected in this UI preview.')}>Reset Password</button>
    </form>
    {demoEnabled && <form action={demoLogin} className="account-demo-form">
      <button className="account-demo" type="submit">Login as Demo</button>
    </form>}
    {(message || state.error) && <div className="inline-notice account-form-message" role="status">{message || state.error}</div>}
    <div className="account-preview-note">
      <Info size={16} aria-hidden="true" />
      <span>{connected
        ? 'Company Admin sign-in. Password reset is not connected yet.'
        : demoEnabled
          ? 'Demo preview: sign in with username admin and the demo password set for this preview.'
          : 'Company Admin login is not connected to a company yet. Please do not enter real credentials.'}</span>
    </div>
  </>;
}
