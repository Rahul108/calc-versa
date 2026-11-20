import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import {
  ApiError,
  UNAUTHORIZED_EVENT,
  clearStoredToken,
  getStoredToken,
  getTokenExpiry,
  setStoredToken,
} from '../services/http';
import type { AuthUser } from '../types';

type AuthStatus = 'loading' | 'authenticated' | 'anonymous';

interface AuthContextValue {
  status: AuthStatus;
  user: AuthUser | null;
  login: (usernameOrEmail: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function hasUsableToken(): boolean {
  const token = getStoredToken();
  if (!token) return false;
  const exp = getTokenExpiry(token);
  return exp === null || exp * 1000 > Date.now();
}

/**
 * Owns the session: validates the stored token with GET /auth/me on load,
 * logs out when the token expires or any API call returns 401, and sends the
 * user to /login (remembering where they were).
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>(() => (hasUsableToken() ? 'loading' : 'anonymous'));

  const logout = useCallback(() => {
    clearStoredToken();
    setUser(null);
    setStatus('anonymous');
  }, []);

  // Validate a stored token once on start-up.
  useEffect(() => {
    if (status !== 'loading') return;
    let cancelled = false;
    api
      .me()
      .then((me) => {
        if (cancelled) return;
        setUser(me);
        setStatus('authenticated');
      })
      .catch(() => {
        if (!cancelled) logout();
      });
    return () => {
      cancelled = true;
    };
  }, [status, logout]);

  // Any 401 from the API: end the session and go to login, keeping the current page.
  useEffect(() => {
    const onUnauthorized = () => {
      logout();
      if (location.pathname !== '/login') {
        navigate('/login', { replace: true, state: { from: location, reason: 'expired' } });
      }
    };
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, [logout, navigate, location]);

  // Log out exactly when the token expires.
  useEffect(() => {
    if (status !== 'authenticated') return;
    const token = getStoredToken();
    const exp = token ? getTokenExpiry(token) : null;
    if (!exp) return;
    const ms = exp * 1000 - Date.now();
    const timer = window.setTimeout(
      () => window.dispatchEvent(new Event(UNAUTHORIZED_EVENT)),
      Math.max(0, Math.min(ms, 2_147_000_000)),
    );
    return () => window.clearTimeout(timer);
  }, [status]);

  const login = useCallback(async (usernameOrEmail: string, password: string) => {
    const res = await api.login(usernameOrEmail, password);
    setStoredToken(res.access_token);
    try {
      const me = await api.me();
      setUser(me);
      setStatus('authenticated');
    } catch (err) {
      clearStoredToken();
      throw err instanceof ApiError ? err : new Error('Could not load your profile');
    }
  }, []);

  const value = useMemo(() => ({ status, user, login, logout }), [status, user, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
