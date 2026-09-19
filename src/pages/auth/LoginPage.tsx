import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Eye, EyeOff, ShieldAlert } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

  const handleFillCredentials = (fillEmail: string, fillPass: string) => {
    setEmail(fillEmail);
    setPassword(fillPass);
    setError('');
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <div className="brand-icon">⚡</div>
          <h1>SS<span>MTS</span></h1>
          <p>Smart Solar Microgrid Transaction System</p>
        </div>

        {error && (
          <div className="alert alert-danger py-2 mb-3 d-flex align-items-center gap-2" style={{ fontSize: '0.82rem' }}>
            <ShieldAlert size={16} className="flex-shrink-0" />
            <div>{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label" htmlFor="login-email">Email Address</label>
            <input
              id="login-email"
              type="email"
              className="form-control"
              placeholder="admin@solarmicrogrid.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>
          <div className="mb-4">
            <label className="form-label" htmlFor="login-password">Password</label>
            <div className="input-group">
              <input
                id="login-password"
                type={showPass ? 'text' : 'password'}
                className="form-control"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="input-group-text bg-white"
                onClick={() => setShowPass(s => !s)}
                style={{ border: '1px solid #d1d5db', cursor: 'pointer' }}
                aria-label={showPass ? 'Hide password' : 'Show password'}
              >
                {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
          <button type="submit" id="login-submit" className="btn btn-amber w-100 mb-4" disabled={loading}>
            {loading ? (
              <span className="d-flex align-items-center justify-content-center gap-2">
                <span className="spinner-border spinner-border-sm" /> Authenticating...
              </span>
            ) : (
              'Sign In with API'
            )}
          </button>
        </form>

        <div className="divider" />
        <div
          className="text-center mb-2"
          style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase' }}
        >
          Seeded System Accounts
        </div>
        <div className="d-grid gap-2">
          <button
            type="button"
            id="fill-backoffice-btn"
            className="btn btn-outline-secondary btn-sm"
            onClick={() => handleFillCredentials('admin@solarmicrogrid.com', 'Admin@1234')}
          >
            ⚡ Fill Backoffice Admin (admin@solarmicrogrid.com)
          </button>
        </div>

        <div className="text-center mt-4" style={{ fontSize: '0.7rem', color: '#9ca3af' }}>
          SSMTS © {new Date().getFullYear()} · Connected to SmartSolarMicrogrid.API
        </div>
      </div>
    </div>
  );
}
