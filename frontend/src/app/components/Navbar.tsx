import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { adminPanelUrl } from '../services/api';
import { Icon } from './Icon';

export function Navbar() {
  const { status, user, logout } = useAuth();
  const navigate = useNavigate();
  const navClass = ({ isActive }: { isActive: boolean }) => (isActive ? 'nav-link nav-link-active' : 'nav-link');

  const onLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar" aria-label="Main">
      <div className="navbar-inner">
        <Link to="/" className="brand">
          <span className="brand-mark" aria-hidden="true">C</span>
          <span className="brand-name">CalcVersa</span>
        </Link>

        {status === 'authenticated' && (
          <div className="nav-links">
            <NavLink to="/" end className={navClass}>
              <Icon name="grid" size={16} /> Tools
            </NavLink>
            {user?.is_admin && (
              <>
                <NavLink to="/create" className={navClass}>
                  <Icon name="plus" size={16} /> Builder
                </NavLink>
                <NavLink to="/ai-copilot" className={navClass}>
                  <Icon name="sparkles" size={16} /> AI copilot
                </NavLink>
                <a href={adminPanelUrl()} className="nav-link" target="_blank" rel="noreferrer">
                  <Icon name="shield" size={16} /> Admin
                  <span className="visually-hidden">(opens in a new tab)</span>
                </a>
              </>
            )}
          </div>
        )}

        <div className="nav-user">
          {status === 'authenticated' && user ? (
            <>
              <span className="avatar" aria-hidden="true">
                {user.username.charAt(0).toUpperCase()}
              </span>
              <span className="user-meta">
                <span className="name">{user.username}</span>
                <span className="role">{user.is_admin ? 'Admin' : 'Member'}</span>
              </span>
              <button type="button" onClick={onLogout} className="btn-ghost btn-sm" aria-label="Log out">
                <Icon name="logout" size={16} />
              </button>
            </>
          ) : status === 'anonymous' ? (
            <Link to="/login" className="btn-primary btn-sm">
              Log in
            </Link>
          ) : null}
        </div>
      </div>
    </nav>
  );
}
