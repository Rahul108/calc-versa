import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { ErrorState, Loading } from '../components/Feedback';

/** Renders children for signed-in users; otherwise redirects to /login and comes back after. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const location = useLocation();
  if (status === 'loading') return <Loading label="Checking your session…" />;
  if (status === 'anonymous') return <Navigate to="/login" replace state={{ from: location }} />;
  return <>{children}</>;
}

/**
 * Creator tools (builder, AI copilot) are limited to admins in the UI.
 * The API itself lets any signed-in user create tools.
 */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  if (!user?.is_admin) {
    return (
      <div className="page">
        <ErrorState title="Creators only" message="Only admin/creator accounts can build tools. Ask an admin for access." />
      </div>
    );
  }
  return <>{children}</>;
}
