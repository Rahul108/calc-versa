import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { clearStoredToken, getStoredToken } from '../services/api';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const username = localStorage.getItem('calcversa_username') || 'johndoe';
  const isLoggedIn = !!getStoredToken();

  const handleLogout = () => {
    clearStoredToken();
    navigate('/login');
  };

  return (
    <nav style={{ borderBottom: '1px solid #23304d', background: 'rgba(19, 27, 46, 0.9)', backdropFilter: 'blur(10px)', padding: '1rem 2rem', position: 'sticky', top: 0, zIndex: 100 }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', width: '36px', height: '36px', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', fontSize: '1.2rem' }}>
            C
          </div>
          <div>
            <h1 className="gradient-text" style={{ fontSize: '1.4rem', fontWeight: 800, lineHeight: 1.2 }}>CalcVersa</h1>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Multi-Tenant Calculation Platform</p>
          </div>
        </Link>

        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <Link to="/" style={{ textDecoration: 'none', color: location.pathname === '/' ? '#6366f1' : '#94a3b8', fontWeight: 600, fontSize: '0.95rem' }}>
            Tools Dashboard
          </Link>
          <Link to="/create" style={{ textDecoration: 'none', color: location.pathname === '/create' ? '#6366f1' : '#94a3b8', fontWeight: 600, fontSize: '0.95rem' }}>
            + Create Tool
          </Link>
          <Link to="/ai-copilot" style={{ textDecoration: 'none', color: location.pathname === '/ai-copilot' ? '#8b5cf6' : '#94a3b8', fontWeight: 600, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            ✨ AI Prompt Copilot
          </Link>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="badge-status badge-active">
            {isLoggedIn ? `User: ${username}` : 'Demo Mode'}
          </div>
          {isLoggedIn ? (
            <button onClick={handleLogout} className="btn-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}>
              Logout
            </button>
          ) : (
            <Link to="/login" className="btn-primary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}>
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};
