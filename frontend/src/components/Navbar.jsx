import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Hotel, User, LogOut, ShieldCheck, Sparkles } from 'lucide-react';

const Navbar = ({ onOpenAI }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header style={{
      background: '#ffffff',
      borderBottom: '1px solid var(--border)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      padding: '0.85rem 2rem'
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', textDecoration: 'none' }}>
            <div style={{
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              padding: '0.5rem',
              borderRadius: '10px',
              display: 'flex',
              color: 'white'
            }}>
              <Hotel size={22} />
            </div>
            <div>
              <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
                LUXE<span style={{ color: '#2563eb' }}>STAY</span>
              </span>
              <span style={{ fontSize: '0.7rem', display: 'block', color: '#64748b', fontWeight: 600, marginTop: '-3px' }}>
                HOTEL MANAGEMENT SYSTEM
              </span>
            </div>
          </Link>

          <nav style={{ display: 'flex', gap: '1.25rem' }}>
            <Link to="/" style={{ fontSize: '0.92rem', fontWeight: 600, color: '#475569' }}>
              Explore Hotels
            </Link>

            {user && (
              <>
                {user.role === 'CUSTOMER' && (
                  <Link to="/my-bookings" style={{ fontSize: '0.92rem', fontWeight: 600, color: '#475569' }}>
                    My Bookings
                  </Link>
                )}
                {(user.role === 'ORGANIZATION_ADMIN' || user.role === 'RECEPTIONIST') && (
                  <Link to="/staff-dashboard" style={{ fontSize: '0.92rem', fontWeight: 600, color: '#2563eb', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <ShieldCheck size={16} /> Staff Console
                  </Link>
                )}
                {user.role === 'PRODUCT_ADMIN' && (
                  <Link to="/platform-admin" style={{ fontSize: '0.92rem', fontWeight: 600, color: '#7c3aed', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <ShieldCheck size={16} /> Platform Admin
                  </Link>
                )}
              </>
            )}
          </nav>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* AI Assistant Trigger Button */}
          <button
            onClick={onOpenAI}
            style={{
              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              color: 'white',
              borderRadius: '9999px',
              padding: '0.45rem 1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              fontSize: '0.85rem',
              fontWeight: 600,
              boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)'
            }}
          >
            <Sparkles size={16} />
            AI Booking Assistant
          </button>

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>{user.name}</div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>{user.role}</div>
              </div>
              <button
                onClick={handleLogout}
                style={{
                  color: '#64748b',
                  padding: '0.45rem',
                  borderRadius: '8px',
                  background: '#f1f5f9',
                  display: 'flex',
                  alignItems: 'center'
                }}
                title="Logout"
              >
                <LogOut size={17} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Link to="/login" className="btn-secondary" style={{ padding: '0.45rem 0.95rem', fontSize: '0.85rem' }}>
                Sign In
              </Link>
              <Link to="/register" className="btn-primary" style={{ padding: '0.45rem 0.95rem', fontSize: '0.85rem' }}>
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
