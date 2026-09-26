import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Eye, EyeOff, ShieldAlert } from 'lucide-react';

export default function LoginPage() {
  const { login, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please enter both email and password.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const ok = await login(email.trim(), password);
      if (ok) {
        navigate('/dashboard');
      } else {
        setError('Invalid credentials or backend service unreachable. Please check email/password.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed. Please verify your connection.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="split-login-page">
      {/* ── Left Side: Pure White Minimalist Large Logo Showcase ── */}
      <div className="split-login-left">
        <div className="split-brand-header">
          <img src="/logo.png" alt="SmartSolar Logo" className="brand-mini-logo" />
          <span className="brand-title">Smart<span>Solar</span></span>
        </div>

        <div className="split-hero-center">
          <img src="/logo.png" alt="SmartSolar Large Logo" className="split-large-logo" />
        </div>
      </div>

      {/* ── Right Side: Modern Login Form ── */}
      <div className="split-login-right">
        <div className="login-box">
          <div className="welcome-header">
            <h1>Welcome to SmartSolar !!</h1>
            <p>Smart Solar Microgrid Transaction & Trading Platform</p>
          </div>

          {error && (
            <div className="alert alert-danger py-2 mb-3 d-flex align-items-center gap-2" style={{ fontSize: '0.82rem' }}>
              <ShieldAlert size={16} className="flex-shrink-0" />
              <div>{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
              <div className="form-group-field">
                <label htmlFor="login-email">Email address</label>
                <input
                  id="login-email"
                  type="email"
                  className="form-control-custom"
                  placeholder="admin@solarmicrogrid.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>

              <div className="form-group-field">
                <label htmlFor="login-password">Password</label>
                <div className="password-field-wrapper">
                  <input
                    id="login-password"
                    type={showPass ? 'text' : 'password'}
                    className="form-control-custom"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className="eye-toggle-btn"
                    onClick={() => setShowPass(s => !s)}
                    aria-label={showPass ? 'Hide password' : 'Show password'}
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="form-actions-row">
                <label className="remember-checkbox">
                  <input
                    type="checkbox"
                    checked={keepSignedIn}
                    onChange={e => setKeepSignedIn(e.target.checked)}
                  />
                  Keep me signed in
                </label>
                <a
                  href="#forgot"
                  className="forgot-link"
                  onClick={e => {
                    e.preventDefault();
                    setError('Password reset requests should be directed to the System Administrator.');
                  }}
                >
                  Forgot password?
                </a>
              </div>

              <button
                type="submit"
                id="login-submit"
                className="btn-submit-signin"
                disabled={loading}
              >
                {loading ? (
                  <span className="d-flex align-items-center justify-content-center gap-2">
                    <span className="spinner-border spinner-border-sm" /> Authenticating...
                  </span>
                ) : (
                  'Sign in'
                )}
              </button>
            </form>
          <div className="login-bottom-note">
            SSMTS © {new Date().getFullYear()} · Connected to SmartSolarMicrogrid.API
          </div>
        </div>
      </div>
    </div>
  );
}
