import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate, type Location } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Alert } from '../components/Feedback';
import { Icon } from '../components/Icon';

interface LoginState {
  from?: Location;
  reason?: 'expired';
}

export default function LoginPage() {
  const { status, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state ?? {}) as LoginState;
  const destination = state.from ? `${state.from.pathname}${state.from.search}` : '/';

  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (status === 'authenticated') return <Navigate to={destination} replace />;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await login(usernameOrEmail.trim(), password);
      navigate(destination, { replace: true });
    } catch (err) {
      setError((err as Error).message || 'Login failed. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-shell">
      <section className="auth-panel" aria-hidden="true">
        <div className="row">
          <span className="brand-mark">C</span>
          <strong>CalcVersa</strong>
        </div>
        <div className="stack">
          <h2>
            Your calculators,
            <br />
            trackers and reports.
            <br />
            <span className="gradient-text">One place.</span>
          </h2>
          <p>Build a tool once, share it with your team, and see every entry add up in real time.</p>
        </div>
        <ul className="auth-points">
          <li>
            <Icon name="zap" /> Instant results from the formula engine
          </li>
          <li>
            <Icon name="chart" /> Daily, monthly and per-member summaries
          </li>
          <li>
            <Icon name="lock" /> Per-tool sharing with read or write access
          </li>
        </ul>
      </section>

      <div className="auth-form">
        <div className="stack-sm">
          <h1 className="page-title">Welcome back</h1>
          <p className="muted">Log in to open your tools.</p>
        </div>

        {state.reason === 'expired' && <Alert kind="info">Your session ended. Please log in again.</Alert>}
        {error && <Alert kind="error">{error}</Alert>}

        <form onSubmit={onSubmit} className="stack">
          <div className="field">
            <label htmlFor="login-user" className="form-label">
              Username or email
            </label>
            <input
              id="login-user"
              type="text"
              className="form-control"
              autoComplete="username"
              placeholder="you@example.com"
              value={usernameOrEmail}
              onChange={(e) => setUsernameOrEmail(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="field">
            <label htmlFor="login-pass" className="form-label">
              Password
            </label>
            <input
              id="login-pass"
              type="password"
              className="form-control"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn-primary btn-block" disabled={submitting}>
            {submitting ? 'Logging in…' : 'Log in'}
            {!submitting && <Icon name="arrowRight" size={16} />}
          </button>
        </form>
      </div>
    </div>
  );
}
