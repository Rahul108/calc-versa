import { useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Alert } from '../components/Feedback';
import { Icon } from '../components/Icon';
import { DynamicField } from '../components/DynamicField';
import { defaultValues, getSections, type FieldValue } from '../lib/fields';
import type { FieldConfig, ToolDraft } from '../types';

type BuilderType = 'number' | 'slider' | 'dropdown' | 'checkbox' | 'text' | 'date';

interface BuilderField {
  key: number;
  id: string;
  label: string;
  type: BuilderType;
  defaultValue: string;
  options: string;
  min: string;
  max: string;
}

interface BuilderRule {
  key: number;
  outputId: string;
  label: string;
  expression: string;
  format: 'number' | 'currency' | 'percent';
}

const IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;
let nextKey = 1;
const newKey = () => nextKey++;

const STARTER_FIELDS: BuilderField[] = [
  { key: newKey(), id: 'principal', label: 'Loan amount', type: 'number', defaultValue: '250000', options: '', min: '', max: '' },
  { key: newKey(), id: 'annual_rate', label: 'Interest rate (%)', type: 'slider', defaultValue: '6.5', options: '', min: '1', max: '20' },
];
const STARTER_RULES: BuilderRule[] = [
  {
    key: newKey(),
    outputId: 'monthly_payment',
    label: 'Monthly payment',
    expression: '(principal * (annual_rate / 1200)) / (1 - (1 + (annual_rate / 1200)) ** -360)',
    format: 'currency',
  },
];

function toFieldConfig(f: BuilderField): FieldConfig {
  const num = (s: string) => (s.trim() === '' ? undefined : Number(s));
  const numeric = f.type === 'number' || f.type === 'slider';
  return {
    id: f.id.trim(),
    label: f.label.trim() || f.id.trim(),
    type: f.type,
    defaultValue: numeric ? num(f.defaultValue) : f.type === 'checkbox' ? f.defaultValue === 'true' : f.defaultValue,
    ...(f.type === 'dropdown' ? { options: f.options.split(',').map((o) => o.trim()).filter(Boolean) } : {}),
    ...(f.type === 'slider' ? { min: num(f.min), max: num(f.max) } : {}),
  };
}

function validate(name: string, fields: BuilderField[], rules: BuilderRule[]): string[] {
  const problems: string[] = [];
  if (!name.trim()) problems.push('Tool name is required.');
  const ids = new Set<string>();
  fields.forEach((f, i) => {
    const id = f.id.trim();
    if (!IDENTIFIER.test(id)) problems.push(`Field ${i + 1}: ID "${id}" must start with a letter or _ and use only letters, digits and _.`);
    else if (ids.has(id)) problems.push(`Field ID "${id}" is used more than once.`);
    ids.add(id);
    if (f.type === 'dropdown' && !f.options.trim()) problems.push(`Field "${id}": add at least one dropdown option.`);
  });
  rules.forEach((r, i) => {
    const out = r.outputId.trim();
    if (!IDENTIFIER.test(out)) problems.push(`Formula ${i + 1}: output name "${out}" must be a valid identifier.`);
    else if (ids.has(out)) problems.push(`Output "${out}" clashes with a field or another output.`);
    ids.add(out);
    if (!r.expression.trim()) problems.push(`Formula ${i + 1}: expression is required.`);
  });
  return problems;
}

export default function CreateToolPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [toolType, setToolType] = useState<'calculator' | 'tracker'>('calculator');
  const [currency, setCurrency] = useState('$');
  const [fields, setFields] = useState<BuilderField[]>(STARTER_FIELDS);
  const [rules, setRules] = useState<BuilderRule[]>(STARTER_RULES);
  const [problems, setProblems] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const updateField = (key: number, patch: Partial<BuilderField>) =>
    setFields((prev) => prev.map((f) => (f.key === key ? { ...f, ...patch } : f)));
  const updateRule = (key: number, patch: Partial<BuilderRule>) =>
    setRules((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  const previewSections = useMemo(
    () => getSections({ sections: [{ title: 'Inputs', fields: fields.map(toFieldConfig) }] }),
    [fields],
  );
  const previewValues = useMemo<Record<string, FieldValue>>(
    () => defaultValues(previewSections.flatMap((s) => s.fields)),
    [previewSections],
  );

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const found = validate(name, fields, rules);
    setProblems(found);
    if (found.length) return;

    const draft: ToolDraft = {
      name: name.trim(),
      description: description.trim() || name.trim(),
      inputsConfig: { sections: [{ title: 'Inputs', fields: fields.map(toFieldConfig) }] },
      formulaConfig: {
        rules: rules.map((r) => ({ targetOutputId: r.outputId.trim(), expression: r.expression.trim() })),
        outputs: rules.map((r) => ({ id: r.outputId.trim(), label: r.label.trim() || r.outputId.trim(), format: r.format })),
      },
      uiConfig: { toolType, currency },
    };

    setSubmitting(true);
    setError('');
    try {
      const created = await api.createApp(draft);
      navigate(`/product?id=${created.id}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page">
      <Link to="/" className="back-link">
        <Icon name="arrowLeft" size={15} /> All tools
      </Link>
      <div className="page-header">
        <span className="eyebrow">Builder</span>
        <h1 className="page-title">Create a tool</h1>
        <p className="muted">Define inputs and formulas. Formulas can use any field ID and earlier outputs.</p>
      </div>

      {error && <Alert kind="error">{error}</Alert>}
      {problems.length > 0 && (
        <Alert kind="error">
          <strong>Please fix the following:</strong>
          <ul className="problem-list">
            {problems.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </Alert>
      )}

      <form onSubmit={onSubmit} className="grid-2" noValidate>
        <div className="stack">
          <fieldset className="card stack">
            <legend className="section-title">Tool details</legend>
            <div className="field">
              <label htmlFor="tool-name" className="form-label">Name</label>
              <input id="tool-name" className="form-control" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Compound interest" required />
            </div>
            <div className="field">
              <label htmlFor="tool-desc" className="form-label">Description</label>
              <textarea id="tool-desc" className="form-control" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="row wrap">
              <div className="field">
                <label htmlFor="tool-type" className="form-label">Kind</label>
                <select id="tool-type" className="form-control" value={toolType} onChange={(e) => setToolType(e.target.value as 'calculator' | 'tracker')}>
                  <option value="calculator">Calculator (calculate on demand)</option>
                  <option value="tracker">Tracker (save every entry)</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="tool-currency" className="form-label">Currency</label>
                <input id="tool-currency" className="form-control form-control-sm" value={currency} onChange={(e) => setCurrency(e.target.value)} />
              </div>
            </div>
          </fieldset>

          <fieldset className="card stack">
            <legend className="section-title">Inputs</legend>
            {fields.map((f, i) => (
              <div key={f.key} className="builder-item stack">
                <div className="grid-2-tight">
                  <div className="field">
                    <label htmlFor={`f-id-${f.key}`} className="form-label">Field ID</label>
                    <input id={`f-id-${f.key}`} className="form-control mono" value={f.id} onChange={(e) => updateField(f.key, { id: e.target.value })} />
                  </div>
                  <div className="field">
                    <label htmlFor={`f-label-${f.key}`} className="form-label">Label</label>
                    <input id={`f-label-${f.key}`} className="form-control" value={f.label} onChange={(e) => updateField(f.key, { label: e.target.value })} />
                  </div>
                  <div className="field">
                    <label htmlFor={`f-type-${f.key}`} className="form-label">Control</label>
                    <select id={`f-type-${f.key}`} className="form-control" value={f.type} onChange={(e) => updateField(f.key, { type: e.target.value as BuilderType, defaultValue: '' })}>
                      <option value="number">Number</option>
                      <option value="slider">Slider</option>
                      <option value="dropdown">Dropdown</option>
                      <option value="checkbox">Checkbox</option>
                      <option value="text">Text</option>
                      <option value="date">Date</option>
                    </select>
                  </div>
                  <div className="field">
                    <label htmlFor={`f-def-${f.key}`} className="form-label">Default value</label>
                    {f.type === 'checkbox' ? (
                      <select id={`f-def-${f.key}`} className="form-control" value={f.defaultValue || 'false'} onChange={(e) => updateField(f.key, { defaultValue: e.target.value })}>
                        <option value="false">Unchecked</option>
                        <option value="true">Checked</option>
                      </select>
                    ) : (
                      <input
                        id={`f-def-${f.key}`}
                        className="form-control"
                        type={f.type === 'number' || f.type === 'slider' ? 'number' : 'text'}
                        placeholder={f.type === 'date' ? 'today or YYYY-MM-DD' : ''}
                        value={f.defaultValue}
                        onChange={(e) => updateField(f.key, { defaultValue: e.target.value })}
                      />
                    )}
                  </div>
                  {f.type === 'slider' && (
                    <>
                      <div className="field">
                        <label htmlFor={`f-min-${f.key}`} className="form-label">Min</label>
                        <input id={`f-min-${f.key}`} type="number" className="form-control" value={f.min} onChange={(e) => updateField(f.key, { min: e.target.value })} />
                      </div>
                      <div className="field">
                        <label htmlFor={`f-max-${f.key}`} className="form-label">Max</label>
                        <input id={`f-max-${f.key}`} type="number" className="form-control" value={f.max} onChange={(e) => updateField(f.key, { max: e.target.value })} />
                      </div>
                    </>
                  )}
                </div>
                {f.type === 'dropdown' && (
                  <div className="field">
                    <label htmlFor={`f-opt-${f.key}`} className="form-label">Options (comma-separated)</label>
                    <input id={`f-opt-${f.key}`} className="form-control" placeholder="Food, Rent, Utilities" value={f.options} onChange={(e) => updateField(f.key, { options: e.target.value })} />
                  </div>
                )}
                {fields.length > 1 && (
                  <button type="button" className="btn-secondary btn-sm align-start" onClick={() => setFields((prev) => prev.filter((x) => x.key !== f.key))}>
                    Remove field {i + 1}
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              className="btn-secondary btn-sm align-start"
              onClick={() =>
                setFields((prev) => [
                  ...prev,
                  { key: newKey(), id: `field_${prev.length + 1}`, label: `Field ${prev.length + 1}`, type: 'number', defaultValue: '0', options: '', min: '', max: '' },
                ])
              }
            >
              <Icon name="plus" size={15} /> Add input
            </button>
          </fieldset>

          <fieldset className="card stack">
            <legend className="section-title">Formulas</legend>
            <p className="muted small">
              Operators: <code>+ - * / ^ **</code> and parentheses. Rules run in order, so later formulas can use earlier outputs.
            </p>
            {rules.map((r, i) => (
              <div key={r.key} className="builder-item stack">
                <div className="grid-2-tight">
                  <div className="field">
                    <label htmlFor={`r-out-${r.key}`} className="form-label">Output name</label>
                    <input id={`r-out-${r.key}`} className="form-control mono" value={r.outputId} onChange={(e) => updateRule(r.key, { outputId: e.target.value })} />
                  </div>
                  <div className="field">
                    <label htmlFor={`r-label-${r.key}`} className="form-label">Display label</label>
                    <input id={`r-label-${r.key}`} className="form-control" value={r.label} onChange={(e) => updateRule(r.key, { label: e.target.value })} />
                  </div>
                </div>
                <div className="field">
                  <label htmlFor={`r-expr-${r.key}`} className="form-label">Expression</label>
                  <input id={`r-expr-${r.key}`} className="form-control mono" value={r.expression} onChange={(e) => updateRule(r.key, { expression: e.target.value })} />
                </div>
                <div className="row wrap">
                  <div className="field">
                    <label htmlFor={`r-fmt-${r.key}`} className="form-label">Format</label>
                    <select id={`r-fmt-${r.key}`} className="form-control form-control-sm" value={r.format} onChange={(e) => updateRule(r.key, { format: e.target.value as BuilderRule['format'] })}>
                      <option value="number">Number</option>
                      <option value="currency">Currency</option>
                      <option value="percent">Percent</option>
                    </select>
                  </div>
                  {rules.length > 1 && (
                    <button type="button" className="btn-secondary btn-sm align-end" onClick={() => setRules((prev) => prev.filter((x) => x.key !== r.key))}>
                      Remove formula {i + 1}
                    </button>
                  )}
                </div>
              </div>
            ))}
            <button
              type="button"
              className="btn-secondary btn-sm align-start"
              onClick={() => setRules((prev) => [...prev, { key: newKey(), outputId: `result_${prev.length + 1}`, label: '', expression: '', format: 'number' }])}
            >
              <Icon name="plus" size={15} /> Add formula
            </button>
          </fieldset>

          <button type="submit" className="btn-accent btn-block" disabled={submitting}>
            <Icon name="check" size={16} />
            {submitting ? 'Creating tool…' : 'Create tool'}
          </button>
        </div>

        <aside className="card stack sticky" aria-label="Preview">
          <span className="badge-status badge-accent align-start">Live preview</span>
          <h2 className="section-title">{name || 'Untitled tool'}</h2>
          {description && <p className="muted">{description}</p>}
          {previewSections[0].fields.map((field) => (
            <DynamicField key={field.id} idPrefix="preview" field={field} value={previewValues[field.id]} onChange={() => undefined} disabled />
          ))}
          <div className="stack">
            {rules.map((r) => (
              <code key={r.key} className="formula-preview">
                {r.outputId || '?'} = {r.expression || '…'}
              </code>
            ))}
          </div>
        </aside>
      </form>
    </div>
  );
}
