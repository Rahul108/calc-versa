import { useMemo, useState, type FormEvent } from 'react';
import { api } from '../../services/api';
import { DynamicField } from '../../components/DynamicField';
import { Alert } from '../../components/Feedback';
import { Icon } from '../../components/Icon';
import { allFields, buildPayload, defaultValues, getSections, type FieldValue } from '../../lib/fields';
import { formatMoney, formatNumber } from '../../lib/format';
import type { AppAccess, CalcApp } from '../../types';
import { amountFieldOf, dateFieldOf, hasFormulaRules, isTracker, outputFormat, outputLabel } from './toolMeta';

interface Props {
  app: CalcApp;
  access: AppAccess;
  currency: string;
  onSaved: () => void;
}

interface Outcome {
  results: Record<string, unknown>;
  executionMs?: number;
}

export function FormEntryTab({ app, access, currency, onSaved }: Props) {
  const sections = useMemo(() => getSections(app.inputsConfig), [app.inputsConfig]);
  const fields = useMemo(() => allFields(sections), [sections]);
  const [values, setValues] = useState<Record<string, FieldValue>>(() => defaultValues(fields));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<'calculate' | 'save' | null>(null);
  const [message, setMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);

  const tracker = isTracker(app);
  const rules = hasFormulaRules(app);
  const canSave = access.write;
  const amountField = amountFieldOf(app);
  const dateField = dateFieldOf(app, fields.map((f) => f.id));

  const setValue = (id: string, v: FieldValue) => {
    setValues((prev) => ({ ...prev, [id]: v }));
    setErrors((prev) => {
      if (!prev[id]) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const submit = async (save: boolean) => {
    setMessage(null);
    const { payload, errors: validation } = buildPayload(fields, values);
    setErrors(validation);
    if (Object.keys(validation).length > 0) {
      setMessage({ kind: 'error', text: 'Please fix the highlighted fields.' });
      return;
    }

    setBusy(save ? 'save' : 'calculate');
    try {
      if (rules) {
        const res = await api.calculate(app.id, payload, save);
        setOutcome({ results: res.results, executionMs: res.execution_time_ms });
      } else if (save) {
        // No formulas configured: store the entry as-is.
        const recordDate = dateField ? String(payload[dateField] ?? '') || undefined : undefined;
        await api.createRecord(app.id, payload, recordDate);
        setOutcome(null);
      }
      if (save) {
        setMessage({ kind: 'success', text: tracker ? 'Entry saved.' : 'Result saved to history.' });
        onSaved();
      }
    } catch (err) {
      setMessage({ kind: 'error', text: (err as Error).message });
    } finally {
      setBusy(null);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void submit(tracker && canSave);
  };

  const formatOutput = (id: string, v: unknown) => {
    const fmt = outputFormat(app, id);
    if (fmt === 'currency') return formatMoney(v, currency);
    if (fmt === 'percent') return `${formatNumber(v)}%`;
    return typeof v === 'number' ? formatNumber(v) : String(v);
  };

  if (fields.length === 0) {
    return <Alert kind="info">This tool has no input fields configured yet.</Alert>;
  }

  const resultEntries = outcome ? Object.entries(outcome.results) : [];

  return (
    <div className="grid-form">
      <form onSubmit={onSubmit} noValidate className="stack">
        {sections.map((section) => (
          <fieldset key={section.title} className="card stack">
            <legend className="section-title">{section.title}</legend>
            <div className="grid-2-tight">
              {section.fields.map((field) => (
                <DynamicField
                  key={field.id}
                  field={field}
                  value={values[field.id]}
                  error={errors[field.id]}
                  disabled={busy !== null}
                  onChange={(v) => setValue(field.id, v)}
                />
              ))}
            </div>
          </fieldset>
        ))}

        {!canSave && (
          <Alert kind="info">
            <span className="row">
              <Icon name="lock" size={15} /> You have read-only access: you can calculate, but not save entries.
            </span>
          </Alert>
        )}

        <div className="form-actions">
          {tracker && canSave ? (
            <button type="submit" className="btn-accent" disabled={busy !== null}>
              <Icon name="check" size={16} />
              {busy === 'save' ? 'Saving…' : 'Save entry'}
            </button>
          ) : (
            <>
              <button type="submit" className="btn-accent" disabled={busy !== null || !rules}>
                <Icon name="zap" size={16} />
                {busy === 'calculate' ? 'Calculating…' : 'Calculate'}
              </button>
              {canSave && (
                <button type="button" className="btn-secondary" disabled={busy !== null} onClick={() => void submit(true)}>
                  {busy === 'save' ? 'Saving…' : 'Calculate & save'}
                </button>
              )}
            </>
          )}
        </div>

        {message && (
          <Alert kind={message.kind}>
            <span className="row">
              <Icon name={message.kind === 'success' ? 'check' : 'alert'} size={15} /> {message.text}
            </span>
          </Alert>
        )}
      </form>

      <aside className="card results-card stack sticky" aria-live="polite">
        <div className="row row-between">
          <h2 className="section-title">Results</h2>
          {outcome?.executionMs !== undefined && (
            <span className="badge-status badge-active">
              <Icon name="zap" size={12} /> {formatNumber(outcome.executionMs)} ms
            </span>
          )}
        </div>

        {resultEntries.length > 0 ? (
          resultEntries.map(([id, v], i) => (
            <div key={id} className={i === 0 ? 'result-tile result-primary' : 'result-tile'}>
              <p>{outputLabel(app, id)}</p>
              <p className="result-value">{formatOutput(id, v)}</p>
            </div>
          ))
        ) : (
          <div className="results-empty">
            <span className="state-icon">
              <Icon name={rules ? 'zap' : 'list'} size={22} />
            </span>
            <p className="small">
              {rules
                ? `Fill in the form and press ${tracker && canSave ? 'Save entry' : 'Calculate'} to see results here.`
                : 'This tool has no formulas; entries are stored as entered.'}
            </p>
          </div>
        )}

        {amountField && values[amountField] !== undefined && (
          <p className="muted small">
            Entry amount: <strong className="strong">{formatMoney(values[amountField] || 0, currency)}</strong>
          </p>
        )}
      </aside>
    </div>
  );
}
