import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { KeyRound, Mail, UserCheck } from 'lucide-react';

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
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
          Welcome Back
        </h2>
        <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          Sign in to access your hotel reservation management portal
        </p>

        {error && (
          <div style={{
            background: '#fef2f2',
            color: '#b91c1c',
            padding: '0.75rem',
            borderRadius: '8px',
            marginBottom: '1rem',
            fontSize: '0.85rem'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
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
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
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

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.85rem', color: '#64748b' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: '#2563eb', fontWeight: 600 }}>Create an account</Link>
        </div>

        {/* Demo Fast Login Selector */}
        <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px dashed var(--border)' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', marginBottom: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Quick Demo Role Switcher
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            <button
              onClick={() => quickSwitch('customer@example.com', 'customer123')}
              className="btn-secondary"
              style={{ fontSize: '0.8rem', textAlign: 'left', padding: '0.4rem 0.75rem', display: 'flex', justifyContent: 'space-between' }}
            >
              <span>👤 Customer (John Doe)</span>
              <span style={{ color: '#64748b' }}>customer123</span>
            </button>
            <button
              onClick={() => quickSwitch('orgadmin@grandhotels.com', 'admin123')}
              className="btn-secondary"
              style={{ fontSize: '0.8rem', textAlign: 'left', padding: '0.4rem 0.75rem', display: 'flex', justifyContent: 'space-between' }}
            >
              <span>🏢 Org Admin (Alexander)</span>
              <span style={{ color: '#64748b' }}>admin123</span>
            </button>
            <button
              onClick={() => quickSwitch('reception@grandhotels.com', 'staff123')}
              className="btn-secondary"
              style={{ fontSize: '0.8rem', textAlign: 'left', padding: '0.4rem 0.75rem', display: 'flex', justifyContent: 'space-between' }}
            >
              <span>🛎️ Receptionist (Sarah)</span>
              <span style={{ color: '#64748b' }}>staff123</span>
            </button>
            <button
              onClick={() => quickSwitch('admin@platform.com', 'admin123')}
              className="btn-secondary"
              style={{ fontSize: '0.8rem', textAlign: 'left', padding: '0.4rem 0.75rem', display: 'flex', justifyContent: 'space-between' }}
            >
              <span>👑 Product Admin</span>
              <span style={{ color: '#64748b' }}>admin123</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
