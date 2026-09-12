import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Hotel, LogOut, ShieldCheck, Sun, Moon, MessageSquare } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'PRODUCT_ADMIN':
        return 'Admin';
      case 'ORGANIZATION_ADMIN':
        return 'Organization Admin';
      case 'RECEPTIONIST':
        return 'Receptionist';
      case 'CUSTOMER':
        return 'Customer';
      default:
        return role;
    }
  };

  const isAdmin = user && (user.role === 'PRODUCT_ADMIN' || user.role === 'ORGANIZATION_ADMIN');

  return (
    <header style={{
      background: 'var(--nav-bg)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid var(--border)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      padding: '0.85rem 2rem',
      transition: 'background-color 0.25s ease, border-color 0.25s ease'
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2.5rem', flexWrap: 'wrap' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
            <div style={{
              background: 'linear-gradient(135deg, var(--primary) 0%, #1d4ed8 100%)',
              padding: '0.55rem',
              borderRadius: '10px',
              display: 'flex',
              color: 'white',
              boxShadow: '0 2px 6px var(--primary-glow)'
            }}>
              <Hotel size={22} />
            </div>
            <div>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
                LUXE<span style={{ color: 'var(--primary)' }}>STAY</span>
              </span>
              <span style={{ fontSize: '0.68rem', display: 'block', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.04em' }}>
                HOTELS & RESORTS
              </span>
            </div>
          </Link>

          <nav style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <Link
              to="/"
              style={{
                fontSize: '0.92rem',
                fontWeight: 600,
                color: 'var(--text-main)',
                padding: '0.35rem 0.6rem',
                borderRadius: '6px'
              }}
            >
              Browse Hotels
            </Link>

            {/* Chatbot Concierge Assistant Page */}
            <Link
              to="/concierge"
              style={{
                fontSize: '0.92rem',
                fontWeight: 600,
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              <MessageSquare size={16} /> Concierge Assistant
            </Link>

            {user && (
              <>
                {user.role === 'CUSTOMER' && (
                  <Link
                    to="/my-bookings"
                    style={{
                      fontSize: '0.92rem',
                      fontWeight: 600,
                      color: 'var(--text-muted)'
                    }}
                  >
                    My Bookings
                  </Link>
                )}

                {(user.role === 'ORGANIZATION_ADMIN' || user.role === 'RECEPTIONIST') && (
                  <Link
                    to="/staff-dashboard"
                    style={{
                      fontSize: '0.92rem',
                      fontWeight: 600,
                      color: 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem'
                    }}
                  >
                    <ShieldCheck size={16} /> Staff Operations
                  </Link>
                )}

                {/* Exclusive Admin Section */}
                {isAdmin && (
                  <Link
                    to="/admin-console"
                    style={{
                      fontSize: '0.92rem',
                      fontWeight: 700,
                      color: '#9333ea',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      background: 'rgba(147, 51, 234, 0.1)',
                      padding: '0.3rem 0.75rem',
                      borderRadius: '6px'
                    }}
                  >
                    <ShieldCheck size={16} /> Admin Console
                  </Link>
                )}
              </>
            )}
          </nav>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            style={{
              padding: '0.5rem',
              borderRadius: '8px',
              background: 'var(--bg-hover)',
              color: 'var(--text-main)',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '38px',
              height: '38px'
            }}
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {darkMode ? <Sun size={18} color="#f59e0b" /> : <Moon size={18} color="#64748b" />}
          </button>

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  {user.name}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--primary)', fontWeight: 600 }}>
                  {getRoleBadge(user.role)}
                </div>
              </div>
              <button
                onClick={handleLogout}
                style={{
                  color: 'var(--text-muted)',
                  padding: '0.5rem',
                  borderRadius: '8px',
                  background: 'var(--bg-hover)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center'
                }}
                title="Logout"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '0.65rem' }}>
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
