import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAsync } from '../hooks/useAsync';
import { useAuth } from '../auth/AuthContext';
import { EmptyState, ErrorState } from '../components/Feedback';
import { Icon } from '../components/Icon';
import { ToolIcon } from '../components/ToolIcon';
import type { CalcApp } from '../types';

type Filter = 'all' | 'tracker' | 'calculator';

const kindOf = (app: CalcApp): Exclude<Filter, 'all'> => (app.uiConfig?.toolType === 'tracker' ? 'tracker' : 'calculator');

function greeting(now = new Date()) {
  const h = now.getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

function updatedLabel(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : `Updated ${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: apps, error, loading, reload } = useAsync(() => api.listApps(), []);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const counts = useMemo(() => {
    const list = apps ?? [];
    return {
      all: list.length,
      tracker: list.filter((a) => kindOf(a) === 'tracker').length,
      calculator: list.filter((a) => kindOf(a) === 'calculator').length,
    };
  }, [apps]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (apps ?? [])
      .filter((a) => filter === 'all' || kindOf(a) === filter)
      .filter((a) => !q || a.name.toLowerCase().includes(q) || a.description?.toLowerCase().includes(q));
  }, [apps, search, filter]);

  return (
    <div className="page">
      <div className="hero">
        <div className="page-header">
          <span className="eyebrow">{greeting()}{user ? `, ${user.username}` : ''}</span>
          <h1 className="page-title">Your tools</h1>
          <p className="muted">Calculators and trackers you own or that were shared with you.</p>
        </div>
        {user?.is_admin && (
          <div className="row wrap">
            <Link to="/create" className="btn-secondary">
              <Icon name="plus" size={16} /> New tool
            </Link>
            <Link to="/ai-copilot" className="btn-accent">
              <Icon name="sparkles" size={16} /> Build with AI
            </Link>
          </div>
        )}
      </div>

      {loading ? (
        <>
          <div className="stat-strip">
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton" style={{ height: 92 }} />
            ))}
          </div>
          <div className="tool-grid">
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton" style={{ height: 170 }} />
            ))}
          </div>
          <span className="visually-hidden" role="status">Loading your tools…</span>
        </>
      ) : error ? (
        <ErrorState title="Could not load your tools" message={error.message} onRetry={reload} />
      ) : !apps || apps.length === 0 ? (
        <div className="card">
          <EmptyState icon="layers" message="You don't have any tools yet.">
            {user?.is_admin ? (
              <div className="row wrap">
                <Link to="/create" className="btn-primary">
                  <Icon name="plus" size={16} /> Create a tool
                </Link>
                <Link to="/ai-copilot" className="btn-secondary">
                  <Icon name="sparkles" size={16} /> Describe it to AI
                </Link>
              </div>
            ) : (
              <p className="small">Ask a tool owner to share one with you.</p>
            )}
          </EmptyState>
        </div>
      ) : (
        <>
          <div className="stat-strip">
            <div className="card stat-card stat-accent">
              <span className="stat-label">
                <Icon name="layers" size={15} /> Tools
              </span>
              <span className="stat-value">{counts.all}</span>
            </div>
            <div className="card stat-card">
              <span className="stat-label">
                <Icon name="list" size={15} /> Trackers
              </span>
              <span className="stat-value">{counts.tracker}</span>
            </div>
            <div className="card stat-card">
              <span className="stat-label">
                <Icon name="calculator" size={15} /> Calculators
              </span>
              <span className="stat-value">{counts.calculator}</span>
            </div>
          </div>

          <div className="toolbar">
            <div className="chips" role="group" aria-label="Filter tools">
              {(['all', 'tracker', 'calculator'] as Filter[]).map((f) => (
                <button key={f} type="button" className="chip" aria-pressed={filter === f} onClick={() => setFilter(f)}>
                  {f === 'all' ? 'All' : f === 'tracker' ? 'Trackers' : 'Calculators'}
                  <span className="count">{counts[f]}</span>
                </button>
              ))}
            </div>
            <div className="input-icon">
              <Icon name="search" size={17} />
              <label htmlFor="tool-search" className="visually-hidden">
                Search tools
              </label>
              <input
                id="tool-search"
                type="search"
                className="form-control"
                placeholder="Search by name or description"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="card">
              <EmptyState icon="search" message={search ? `No tools match "${search}".` : 'No tools of this kind yet.'}>
                <button type="button" className="btn-secondary btn-sm" onClick={() => { setSearch(''); setFilter('all'); }}>
                  Clear filters
                </button>
              </EmptyState>
            </div>
          ) : (
            <ul className="tool-grid">
              {filtered.map((app) => (
                <li key={app.id} className="card tool-card">
                  <div className="tool-card-head">
                    <ToolIcon name={app.name} seed={app.id} />
                    <div className="row wrap" style={{ justifyContent: 'flex-end', gap: '0.35rem' }}>
                      {app.uiConfig?.source === 'ai' && (
                        <span className="badge-status badge-ai">
                          <Icon name="sparkles" size={12} /> AI
                        </span>
                      )}
                      <span className={kindOf(app) === 'tracker' ? 'badge-status badge-accent' : 'badge-status badge-muted'}>
                        {kindOf(app) === 'tracker' ? 'Tracker' : 'Calculator'}
                      </span>
                    </div>
                  </div>
                  <div className="stack-sm">
                    <h2 className="tool-card-title">
                      <Link to={`/product?id=${app.id}`}>{app.name}</Link>
                    </h2>
                    <p className="tool-card-desc">{app.description || 'No description.'}</p>
                  </div>
                  <div className="tool-card-footer">
                    <span>{updatedLabel(app.updated_at)}</span>
                    <span className="tool-card-open" aria-hidden="true">
                      Open <Icon name="arrowRight" size={15} />
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
