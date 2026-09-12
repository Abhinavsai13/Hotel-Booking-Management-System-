import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      if (user.role === 'PRODUCT_ADMIN') navigate('/platform-admin');
      else if (user.role === 'ORGANIZATION_ADMIN' || user.role === 'RECEPTIONIST') navigate('/staff-dashboard');
      else navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const quickSwitch = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div style={{ maxWidth: '440px', margin: '4rem auto', padding: '0 1rem' }}>
      <div className="card" style={{ padding: '2.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
          Sign In
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1.5rem' }}>
          Access your reservation portal, front desk, or management console
        </p>

        {error && (
          <div style={{
            background: 'var(--danger-light)',
            color: 'var(--danger)',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '1rem',
            fontSize: '0.85rem',
            border: '1px solid rgba(239, 68, 68, 0.2)'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '0.35rem' }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. customer@example.com"
              required
            />
          </div>

          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '0.35rem' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '0.5rem' }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600 }}>Create account</Link>
        </div>

        {/* Demo Fast Login Selector */}
        <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px dashed var(--border)' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Quick Demo Credentials
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            <button
              onClick={() => quickSwitch('customer@example.com', 'customer123')}
              className="btn-secondary"
              style={{ fontSize: '0.82rem', textAlign: 'left', padding: '0.45rem 0.85rem', display: 'flex', justifyContent: 'space-between' }}
            >
              <span>👤 <strong>Customer:</strong> John Doe</span>
              <span style={{ color: 'var(--text-muted)' }}>customer123</span>
            </button>
            <button
              onClick={() => quickSwitch('orgadmin@grandhotels.com', 'admin123')}
              className="btn-secondary"
              style={{ fontSize: '0.82rem', textAlign: 'left', padding: '0.45rem 0.85rem', display: 'flex', justifyContent: 'space-between' }}
            >
              <span>🏢 <strong>Hotel Admin:</strong> Alexander Vance</span>
              <span style={{ color: 'var(--text-muted)' }}>admin123</span>
            </button>
            <button
              onClick={() => quickSwitch('reception@grandhotels.com', 'staff123')}
              className="btn-secondary"
              style={{ fontSize: '0.82rem', textAlign: 'left', padding: '0.45rem 0.85rem', display: 'flex', justifyContent: 'space-between' }}
            >
              <span>🛎️ <strong>Receptionist:</strong> Sarah Jenkins</span>
              <span style={{ color: 'var(--text-muted)' }}>staff123</span>
            </button>
            <button
              onClick={() => quickSwitch('admin@platform.com', 'admin123')}
              className="btn-secondary"
              style={{ fontSize: '0.82rem', textAlign: 'left', padding: '0.45rem 0.85rem', display: 'flex', justifyContent: 'space-between' }}
            >
              <span>👑 <strong>Platform Admin</strong></span>
              <span style={{ color: 'var(--text-muted)' }}>admin123</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
