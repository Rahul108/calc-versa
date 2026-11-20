import type { ReactNode } from 'react';
import { Icon, type IconName } from './Icon';

export function Loading({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="state-block" role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      <span className="small">{label}</span>
    </div>
  );
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="alert alert-error" role="alert">
      <strong className="row">
        <Icon name="alert" size={16} /> {title}
      </strong>
      <p>{message}</p>
      {onRetry && (
        <button type="button" className="btn-secondary btn-sm" onClick={onRetry}>
          <Icon name="refresh" size={15} /> Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({
  message,
  icon = 'inbox',
  children,
}: {
  message: string;
  icon?: IconName;
  children?: ReactNode;
}) {
  return (
    <div className="state-block">
      <span className="state-icon">
        <Icon name={icon} size={22} />
      </span>
      <p>{message}</p>
      {children}
    </div>
  );
}

export function Alert({ kind, children }: { kind: 'success' | 'error' | 'info'; children: ReactNode }) {
  return (
    <div className={`alert alert-${kind}`} role={kind === 'error' ? 'alert' : 'status'}>
      {children}
    </div>
  );
}
