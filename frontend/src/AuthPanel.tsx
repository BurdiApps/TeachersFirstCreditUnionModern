import { FormEvent, useState } from 'react';
import { ArrowRight, HeartHandshake, X } from 'lucide-react';
import { apiRequest, AuthStatus } from './api';

type AuthMode = 'login' | 'register';

type AuthPanelProps = {
  initialError?: string;
  initialMode: AuthMode;
  onClose: () => void;
  onAuthenticated: (member: AuthStatus) => void;
};

export default function AuthPanel({
  initialError = '',
  initialMode,
  onClose,
  onAuthenticated,
}: AuthPanelProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(initialError);
  const [submitting, setSubmitting] = useState(false);

  const isRegistering = mode === 'register';

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      // ASP.NET Identity verifies the password and creates the secure cookie.
      // The browser stores that HttpOnly cookie; React never handles its value.
      const member = await apiRequest<AuthStatus>(
        `/api/auth/${isRegistering ? 'register' : 'login'}`,
        {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        },
      );
      onAuthenticated(member);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Sign-in could not be completed. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-backdrop" onMouseDown={onClose}>
      <section
        aria-labelledby="auth-title"
        aria-modal="true"
        className="auth-panel"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <button
          aria-label="Close sign-in"
          className="auth-close"
          onClick={onClose}
          type="button"
        >
          <X size={18} />
        </button>
        <div className="auth-brand-mark"><HeartHandshake size={20} /></div>
        <span className="eyebrow">{isRegistering ? 'A place to belong' : 'Welcome back'}</span>
        <h2 id="auth-title">{isRegistering ? 'Create your member login.' : 'Good to see you again.'}</h2>
        <p className="auth-intro">
          {isRegistering
            ? 'Create a learning-demo login to explore the member dashboard.'
            : 'Sign in to see the accounts connected to this demo login.'}
        </p>

        <form className="auth-form" onSubmit={submit}>
          <label htmlFor="member-email">Email address</label>
          <input
            autoComplete="email"
            autoFocus
            id="member-email"
            maxLength={254}
            onChange={(event) => setEmail(event.target.value)}
            required
            type="email"
            value={email}
          />

          <label htmlFor="member-password">Password</label>
          <input
            autoComplete={isRegistering ? 'new-password' : 'current-password'}
            id="member-password"
            maxLength={128}
            minLength={isRegistering ? 12 : undefined}
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
          {isRegistering && (
            <small className="password-hint">
              Use at least 12 characters with an uppercase letter, a lowercase letter, and a number.
            </small>
          )}

          {error && <p className="auth-error" role="alert">{error}</p>}

          <button className="button button-primary auth-submit" disabled={submitting} type="submit">
            {submitting ? 'Please wait…' : isRegistering ? 'Create demo login' : 'Sign in'}
            {!submitting && <ArrowRight size={15} />}
          </button>
        </form>

        <p className="auth-switch">
          {isRegistering ? 'Already have a login?' : 'New to the demo?'}{' '}
          <button
            onClick={() => {
              setError('');
              setMode(isRegistering ? 'login' : 'register');
            }}
            type="button"
          >
            {isRegistering ? 'Sign in' : 'Create a login'}
          </button>
        </p>

        <p className="auth-demo-note">
          Practice project only. This does not verify credit-union membership or provide real banking access.
        </p>
      </section>
    </div>
  );
}
