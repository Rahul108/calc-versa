import { useMemo, useState } from 'react';
import { api } from '../../services/api';
import { useAsync } from '../../hooks/useAsync';
import { Alert, EmptyState, ErrorState, Loading } from '../../components/Feedback';
import { Icon } from '../../components/Icon';
import { allFields, getSections } from '../../lib/fields';
import { formatMoney, formatNumber } from '../../lib/format';
import type { AppAccess, AppRecord, CalcApp } from '../../types';
import { amountFieldOf, dateFieldOf, outputFormat, outputLabel } from './toolMeta';

interface Props {
  app: CalcApp;
  access: AppAccess;
  currency: string;
  version: number;
  onChanged: () => void;
}

export function RecordsTab({ app, access, currency, version, onChanged }: Props) {
  const { data: records, error, loading, reload } = useAsync(() => api.listRecords(app.id), [app.id, version]);
  const fields = useMemo(() => allFields(getSections(app.inputsConfig)), [app.inputsConfig]);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const amountField = amountFieldOf(app);
  const dateField = dateFieldOf(app, fields.map((f) => f.id));
  const columns = fields.filter((f) => f.id !== dateField);
  const outputIds = useMemo(() => {
    const ids = new Set<string>((app.formulaConfig?.rules ?? []).map((r) => r.targetOutputId));
    (records ?? []).forEach((r) => Object.keys(r.results ?? {}).forEach((k) => ids.add(k)));
    return [...ids];
  }, [app.formulaConfig, records]);

  const remove = async (record: AppRecord) => {
    setDeletingId(record.id);
    setDeleteError(null);
    try {
      await api.deleteRecord(app.id, record.id);
      setConfirmingId(null);
      onChanged();
    } catch (err) {
      setDeleteError(`Could not delete the entry: ${(err as Error).message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const isNumeric = (fieldId: string) => {
    const f = fields.find((x) => x.id === fieldId);
    return fieldId === amountField || f?.type === 'number' || f?.type === 'slider';
  };

  const cell = (fieldId: string, value: unknown) => {
    if (value === undefined || value === null || value === '') return '–';
    if (fieldId === amountField) return formatMoney(value, currency);
    if (typeof value === 'number') return formatNumber(value);
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    return String(value);
  };

  const outCell = (outputId: string, value: unknown) => {
    if (value === undefined || value === null) return '–';
    const money = outputFormat(app, outputId) === 'currency' || outputId === amountField;
    if (money) return formatMoney(value, currency);
    return typeof value === 'number' ? formatNumber(value) : String(value);
  };

  return (
    <div className="card stack">
      <div className="row row-between wrap">
        <div className="stack-sm" style={{ gap: '0.15rem' }}>
          <h2 className="section-title">Entries</h2>
          {records && records.length > 0 && (
            <span className="muted small">
              {records.length} {records.length === 1 ? 'entry' : 'entries'}
            </span>
          )}
        </div>
        <button type="button" className="btn-secondary btn-sm" onClick={reload} disabled={loading}>
          <Icon name="refresh" size={15} /> Refresh
        </button>
      </div>

      {deleteError && <Alert kind="error">{deleteError}</Alert>}

      {loading ? (
        <Loading label="Loading entries…" />
      ) : error ? (
        <ErrorState message={error.message} onRetry={reload} />
      ) : !records || records.length === 0 ? (
        <EmptyState icon="inbox" message="No entries yet. Add one from the first tab." />
      ) : (
        <div className="table-scroll">
          <table className="data-table">
            <caption className="visually-hidden">Saved entries for {app.name}</caption>
            <thead>
              <tr>
                <th scope="col">Date</th>
                {columns.map((f) => (
                  <th scope="col" key={f.id} className={isNumeric(f.id) ? 'num' : undefined}>
                    {f.label}
                  </th>
                ))}
                {outputIds.map((id) => (
                  <th scope="col" key={`out-${id}`} className="num">
                    {outputLabel(app, id)}
                  </th>
                ))}
                {access.write && (
                  <th scope="col" className="text-right">
                    <span className="visually-hidden">Actions</span>
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id}>
                  <td className="nowrap">{String(r.record_date).slice(0, 10)}</td>
                  {columns.map((f) => (
                    <td key={f.id} className={isNumeric(f.id) ? 'num' : undefined}>
                      {f.type === 'select' && r.payload?.[f.id] ? (
                        <span className="cell-chip">{String(r.payload[f.id])}</span>
                      ) : (
                        cell(f.id, r.payload?.[f.id])
                      )}
                    </td>
                  ))}
                  {outputIds.map((id) => (
                    <td key={`out-${id}`} className="num strong">
                      {outCell(id, r.results?.[id])}
                    </td>
                  ))}
                  {access.write && (
                    <td className="text-right nowrap">
                      {confirmingId === r.id ? (
                        <span className="row row-end">
                          <button
                            type="button"
                            className="btn-danger btn-sm"
                            disabled={deletingId === r.id}
                            onClick={() => void remove(r)}
                          >
                            {deletingId === r.id ? 'Deleting…' : 'Yes, delete'}
                          </button>
                          <button type="button" className="btn-secondary btn-sm" onClick={() => setConfirmingId(null)}>
                            Cancel
                          </button>
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="btn-ghost btn-sm btn-icon"
                          aria-label={`Delete entry from ${String(r.record_date).slice(0, 10)}`}
                          title="Delete entry"
                          onClick={() => setConfirmingId(r.id)}
                        >
                          <Icon name="trash" size={16} />
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
