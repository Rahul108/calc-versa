import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../../services/api';
import { ApiError } from '../../services/http';
import { useAsync } from '../../hooks/useAsync';
import { ErrorState, Loading } from '../../components/Feedback';
import type { CalcApp } from '../../types';
import { FormEntryTab } from './FormEntryTab';
import { RecordsTab } from './RecordsTab';
import { AnalyticsTab } from './AnalyticsTab';
import { isTracker } from './toolMeta';
import { Icon, type IconName } from '../../components/Icon';
import { ToolIcon } from '../../components/ToolIcon';

const CURRENCIES = [
  { value: 'Tk', label: 'Tk (৳)' },
  { value: '₹', label: '₹ (Rupee)' },
  { value: '$', label: '$ (USD)' },
  { value: '€', label: '€ (EUR)' },
];

type Tab = 'form' | 'records' | 'analytics';

/** /product?id=<appId> — runs one account-specific tool. */
export default function ProductToolPage() {
  const [params] = useSearchParams();
  const appId = params.get('id') ?? '';
  const { data: app, error, loading, reload } = useAsync(() => api.getApp(appId), [appId], !!appId);

  if (!appId) {
    return (
      <div className="page">
        <ErrorState title="No tool selected" message="Open a tool from the dashboard (the URL needs ?id=<tool id>)." />
      </div>
    );
  }
  if (loading) return <Loading label="Loading tool…" />;
  if (error || !app) {
    const status = error instanceof ApiError ? error.status : 0;
    const title =
      status === 403 ? 'No access to this tool' : status === 404 || status === 400 ? 'Tool not found' : 'Could not load this tool';
    return (
      <div className="page">
        <BackLink />
        <ErrorState
          title={title}
          message={error?.message ?? 'Unknown error'}
          onRetry={status === 403 || status === 404 ? undefined : reload}
        />
      </div>
    );
  }
  return <ToolView key={app.id} app={app} />;
}

function BackLink() {
  return (
    <Link to="/" className="back-link">
      <Icon name="arrowLeft" size={15} /> All tools
    </Link>
  );
}

function ToolView({ app }: { app: CalcApp }) {
  const [tab, setTab] = useState<Tab>('form');
  const [currency, setCurrency] = useState(app.uiConfig?.currency ?? '$');
  const [dataVersion, setDataVersion] = useState(0);
  const access = app.access ?? { read: true, write: false, owner: false };
  const tracker = isTracker(app);
  const bump = () => setDataVersion((v) => v + 1);

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: 'form', label: tracker ? 'Add entry' : 'Calculate' },
    { id: 'records', label: tracker ? 'Entries' : 'Saved results' },
    { id: 'analytics', label: 'Summary' },
  ];
  const currencyOptions = CURRENCIES.some((c) => c.value === currency)
    ? CURRENCIES
    : [{ value: currency, label: currency }, ...CURRENCIES];

  const tabIcons: Record<Tab, IconName> = { form: tracker ? 'edit' : 'calculator', records: 'list', analytics: 'chart' };

  return (
    <div className="page">
      <BackLink />

      <header className="card tool-header">
        <ToolIcon name={app.name} seed={app.id} large />
        <div className="tool-header-main">
          <div className="row wrap" style={{ gap: '0.4rem' }}>
            <span className={tracker ? 'badge-status badge-accent' : 'badge-status badge-muted'}>{tracker ? 'Tracker' : 'Calculator'}</span>
            <span className="badge-status badge-muted">
              <Icon name={access.write ? 'edit' : 'lock'} size={12} />
              {access.owner ? 'Owner' : access.write ? 'Can edit' : 'Read only'}
            </span>
          </div>
          <h1 className="tool-title">{app.name}</h1>
          {app.description && app.description !== app.name && <p className="muted">{app.description}</p>}
        </div>
        <div className="tool-header-side">
          <label htmlFor="currency" className="form-label">
            Currency
          </label>
          <select id="currency" className="form-control form-control-sm" value={currency} onChange={(e) => setCurrency(e.target.value)}>
            {currencyOptions.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </header>

      <div className="tabs" role="tablist" aria-label="Tool sections">
        {tabs.map((t) => (
          <button
            key={t.id}
            id={`tab-${t.id}`}
            role="tab"
            type="button"
            aria-selected={tab === t.id}
            aria-controls={`panel-${t.id}`}
            className={tab === t.id ? 'tab tab-active' : 'tab'}
            onClick={() => setTab(t.id)}
          >
            <Icon name={tabIcons[t.id]} size={16} />
            {t.label}
          </button>
        ))}
      </div>

      <section id={`panel-${tab}`} role="tabpanel" aria-labelledby={`tab-${tab}`}>
        {tab === 'form' && <FormEntryTab app={app} access={access} currency={currency} onSaved={bump} />}
        {tab === 'records' && (
          <RecordsTab app={app} access={access} currency={currency} version={dataVersion} onChanged={bump} />
        )}
        {tab === 'analytics' && <AnalyticsTab app={app} currency={currency} version={dataVersion} />}
      </section>
    </div>
  );
}
