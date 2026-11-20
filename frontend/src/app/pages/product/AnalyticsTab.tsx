import { useState } from 'react';
import { api } from '../../services/api';
import { useAsync } from '../../hooks/useAsync';
import { EmptyState, ErrorState, Loading } from '../../components/Feedback';
import { Icon } from '../../components/Icon';
import { formatMoney, formatNumber, localToday } from '../../lib/format';
import type { AggregationResponse, Breakdown, CalcApp } from '../../types';

interface Props {
  app: CalcApp;
  currency: string;
  version: number;
}

type Preset = 'all' | '7d' | '30d' | 'month' | 'custom';

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return localToday(d);
}

function presetRange(p: Preset): [string, string] {
  if (p === '7d') return [daysAgo(6), localToday()];
  if (p === '30d') return [daysAgo(29), localToday()];
  if (p === 'month') {
    const d = new Date();
    return [localToday(new Date(d.getFullYear(), d.getMonth(), 1)), localToday()];
  }
  return ['', ''];
}

const PRESETS: Array<{ id: Preset; label: string }> = [
  { id: 'all', label: 'All time' },
  { id: '7d', label: 'Last 7 days' },
  { id: '30d', label: 'Last 30 days' },
  { id: 'month', label: 'This month' },
  { id: 'custom', label: 'Custom' },
];

export function AnalyticsTab({ app, currency, version }: Props) {
  const [preset, setPreset] = useState<Preset>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const invalidRange = !!startDate && !!endDate && startDate > endDate;

  const choose = (p: Preset) => {
    setPreset(p);
    if (p !== 'custom') {
      const [s, e] = presetRange(p);
      setStartDate(s);
      setEndDate(e);
    }
  };

  const { data, error, loading, reload } = useAsync(
    () => api.aggregate(app.id, startDate, endDate),
    [app.id, startDate, endDate, version],
    !invalidRange,
  );

  const amountLabel = app.uiConfig?.summaryMetrics?.[0]?.label ?? 'Total amount';

  return (
    <div className="stack">
      <div className="toolbar">
        <div className="chips" role="group" aria-label="Date range">
          {PRESETS.map((p) => (
            <button key={p.id} type="button" className="chip" aria-pressed={preset === p.id} onClick={() => choose(p.id)}>
              {p.label}
            </button>
          ))}
        </div>
        {preset === 'custom' && (
          <div className="row wrap">
            <label htmlFor="range-start" className="visually-hidden">
              From
            </label>
            <input id="range-start" type="date" className="form-control form-control-sm" value={startDate} max={endDate || undefined} onChange={(e) => setStartDate(e.target.value)} />
            <span className="muted small">to</span>
            <label htmlFor="range-end" className="visually-hidden">
              To
            </label>
            <input id="range-end" type="date" className="form-control form-control-sm" value={endDate} min={startDate || undefined} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        )}
      </div>

      {invalidRange ? (
        <ErrorState title="Invalid range" message="The start date must be on or before the end date." />
      ) : loading ? (
        <Loading label="Summarising entries…" />
      ) : error ? (
        <ErrorState message={error.message} onRetry={reload} />
      ) : !data || data.total_runs === 0 ? (
        <div className="card">
          <EmptyState icon="chart" message="No entries in this date range." />
        </div>
      ) : (
        <Summary data={data} currency={currency} amountLabel={amountLabel} />
      )}
    </div>
  );
}

function Summary({ data, currency, amountLabel }: { data: AggregationResponse; currency: string; amountLabel: string }) {
  const total = Object.values(data.category_breakdown).reduce((sum, c) => sum + (c.totalAmount || 0), 0);
  const average = data.total_runs > 0 ? total / data.total_runs : 0;
  const amountDetected = total !== 0 || !!data.field_mapping?.amountField;
  const members = Object.entries(data.per_member_breakdown).sort(([, a], [, b]) =>
    amountDetected ? (b.totalAmount ?? 0) - (a.totalAmount ?? 0) : b.count - a.count,
  );
  const days = Object.entries(data.daily_breakdown).sort(([a], [b]) => a.localeCompare(b)).slice(-21);
  const topCategory = Object.entries(data.category_breakdown).sort(([, a], [, b]) => b.totalAmount - a.totalAmount)[0];

  return (
    <>
      <div className="stat-strip">
        {amountDetected && <Stat accent icon="zap" label={amountLabel} value={formatMoney(total, currency)} />}
        <Stat icon="list" label="Entries" value={formatNumber(data.total_runs)} />
        {amountDetected && <Stat icon="calculator" label="Average per entry" value={formatMoney(average, currency)} />}
        {amountDetected && topCategory && <Stat icon="layers" label="Top category" value={topCategory[0]} text />}
      </div>

      {!amountDetected && (
        <p className="muted small">
          No amount field detected. Set <code>uiConfig.analytics.amountField</code> on this tool to choose which field is summed.
        </p>
      )}

      {days.length > 1 && (
        <div className="card stack">
          <div className="row row-between">
            <h3 className="section-title">Daily trend</h3>
            <span className="muted small">{amountDetected ? amountLabel : 'Entries'} per day</span>
          </div>
          <ColumnsChart days={days} currency={currency} useAmount={amountDetected} />
        </div>
      )}

      <div className="grid-2">
        <div className="card stack">
          <h3 className="section-title">By member</h3>
          <BarList
            rows={members.map(([k, m]) => ({ key: k, count: m.count, amount: m.totalAmount ?? 0 }))}
            currency={currency}
            useAmount={amountDetected}
          />
        </div>
        <div className="card stack">
          <h3 className="section-title">By category</h3>
          <BarList rows={toRows(data.category_breakdown, true)} currency={currency} useAmount={amountDetected} neutral />
        </div>
      </div>

      <div className="card stack">
        <h3 className="section-title">By month</h3>
        <BarList rows={toRows(data.monthly_breakdown, false)} currency={currency} useAmount={amountDetected} neutral />
      </div>
    </>
  );
}

function toRows(rows: Record<string, Breakdown>, byAmount: boolean) {
  return Object.entries(rows)
    .map(([key, b]) => ({ key, count: b.count, amount: b.totalAmount }))
    .sort((a, b) => (byAmount ? b.amount - a.amount : a.key.localeCompare(b.key, undefined, { numeric: true })));
}

function Stat({
  label,
  value,
  icon,
  accent = false,
  text = false,
}: {
  label: string;
  value: string;
  icon: 'zap' | 'list' | 'calculator' | 'layers';
  accent?: boolean;
  text?: boolean;
}) {
  return (
    <div className={accent ? 'card stat-card stat-accent' : 'card stat-card'}>
      <span className="stat-label">
        <Icon name={icon} size={15} /> {label}
      </span>
      <span className={text ? 'stat-value stat-text' : 'stat-value'} title={value}>
        {value}
      </span>
    </div>
  );
}

function BarList({
  rows,
  currency,
  useAmount,
  neutral = false,
}: {
  rows: Array<{ key: string; count: number; amount: number }>;
  currency: string;
  useAmount: boolean;
  neutral?: boolean;
}) {
  if (rows.length === 0) return <p className="muted">No data.</p>;
  const metric = (r: { count: number; amount: number }) => (useAmount ? r.amount : r.count);
  const max = Math.max(...rows.map(metric), 0) || 1;
  return (
    <ul className="breakdown-list">
      {rows.map((r) => (
        <li key={r.key}>
          <div className="breakdown-row">
            <span>
              <strong>{r.key}</strong>{' '}
              <span className="muted small">
                · {r.count} {r.count === 1 ? 'entry' : 'entries'}
              </span>
            </span>
            {useAmount && <span className="amount">{formatMoney(r.amount, currency)}</span>}
          </div>
          <div className={neutral ? 'bar bar-neutral' : 'bar'} aria-hidden="true">
            <span style={{ width: `${Math.max(2, (metric(r) / max) * 100)}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function ColumnsChart({ days, currency, useAmount }: { days: Array<[string, Breakdown]>; currency: string; useAmount: boolean }) {
  const value = (b: Breakdown) => (useAmount ? b.totalAmount : b.count);
  const max = Math.max(...days.map(([, b]) => value(b)), 0) || 1;
  return (
    <div className="columns-chart" role="img" aria-label="Daily totals chart">
      {days.map(([day, b]) => {
        const label = `${day}: ${useAmount ? formatMoney(b.totalAmount, currency) : `${b.count} entries`}`;
        return (
          <div key={day} className="col" title={label}>
            <div className="col-bar" style={{ height: `${Math.max(3, (value(b) / max) * 100)}%` }} />
            <span className="col-label">{day.slice(5)}</span>
          </div>
        );
      })}
    </div>
  );
}
