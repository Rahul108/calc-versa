import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Alert } from '../components/Feedback';
import { Icon } from '../components/Icon';
import { getSections } from '../lib/fields';
import type { FeasibilityResponse, ToolDraft } from '../types';

const EXAMPLE =
  'A building management tool for 81 flats: each flat pays base rent plus an equal share of utility bills; show the total due per flat and total collection.';

export default function AiCopilotPage() {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState<FeasibilityResponse | null>(null);
  const [draft, setDraft] = useState<ToolDraft | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const analyze = async (e: FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    setAnalyzing(true);
    setError('');
    setResult(null);
    setDraft(null);
    try {
      const res = await api.aiFeasibility(prompt.trim());
      setResult(res);
      setDraft(res.tool_draft);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setAnalyzing(false);
    }
  };

  const updateRule = (index: number, expression: string) => {
    if (!draft) return;
    const rules = (draft.formulaConfig.rules ?? []).map((r, i) => (i === index ? { ...r, expression } : r));
    setDraft({ ...draft, formulaConfig: { ...draft.formulaConfig, rules } });
  };

  const create = async () => {
    if (!draft) return;
    setCreating(true);
    setError('');
    try {
      const res = await api.aiCreateTool(draft);
      navigate(res?.app?.id ? `/product?id=${res.app.id}` : '/');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setCreating(false);
    }
  };

  const fields = draft ? getSections(draft.inputsConfig).flatMap((s) => s.fields) : [];
  const canCreate = !!result?.possible && !!result?.safety_validated;

  return (
    <div className="page">
      <Link to="/" className="back-link">
        <Icon name="arrowLeft" size={15} /> All tools
      </Link>
      <div className="page-header">
        <span className="eyebrow">AI copilot</span>
        <h1 className="page-title">Describe it. We'll draft the tool.</h1>
        <p className="muted">
          Describe a calculation tool in plain language. Review the generated inputs and formulas before anything is
          created.
        </p>
      </div>

      <form onSubmit={analyze} className="card stack">
        <div className="field">
          <label htmlFor="ai-prompt" className="form-label">
            What should the tool do?
          </label>
          <textarea
            id="ai-prompt"
            className="form-control"
            rows={4}
            placeholder={`Example: ${EXAMPLE}`}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
        </div>
        <div className="row wrap">
          <button type="submit" className="btn-accent" disabled={analyzing || !prompt.trim()}>
            <Icon name="sparkles" size={16} />
            {analyzing ? 'Analysing…' : 'Generate draft'}
          </button>
          {!prompt && (
            <button type="button" className="btn-secondary" onClick={() => setPrompt(EXAMPLE)}>
              Use example
            </button>
          )}
        </div>
      </form>

      {error && <Alert kind="error">{error}</Alert>}

      {result && draft && (
        <section className="card stack" aria-label="Generated draft">
          <div className="row row-between wrap">
            <h2 className="section-title">Draft</h2>
            <span className={result.possible ? 'badge-status badge-active' : 'badge-status badge-danger'}>
              {result.possible ? 'Feasible' : 'Not feasible'} · confidence {Math.round(result.confidence * 100)}%
            </span>
          </div>

          {result.safety_warnings.length > 0 && (
            <Alert kind="error">
              <ul className="problem-list">
                {result.safety_warnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </Alert>
          )}

          <div className="field">
            <label htmlFor="ai-name" className="form-label">
              Tool name
            </label>
            <input id="ai-name" className="form-control" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          </div>

          <div className="grid-2">
            <div className="stack">
              <h3 className="form-label">Inputs</h3>
              <ul className="breakdown-list">
                {fields.map((f) => (
                  <li key={f.id}>
                    <span>
                      <strong>{f.label}</strong> <code className="muted small">{f.id}</code>
                    </span>
                    <span className="badge-status badge-muted">{f.type}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="stack">
              <h3 className="form-label">Formulas (editable)</h3>
              {(draft.formulaConfig.rules ?? []).map((r, i) => (
                <div key={`${r.targetOutputId}-${i}`} className="field">
                  <label htmlFor={`ai-rule-${i}`} className="form-label mono">
                    {r.targetOutputId} =
                  </label>
                  <input id={`ai-rule-${i}`} className="form-control mono" value={r.expression} onChange={(e) => updateRule(i, e.target.value)} />
                </div>
              ))}
            </div>
          </div>

          <p className="muted small">
            <strong>Reasoning:</strong> {result.reasoning}
          </p>

          <div className="row wrap">
            <button type="button" className="btn-accent" onClick={() => void create()} disabled={creating || !canCreate}>
              <Icon name="check" size={16} />
              {creating ? 'Creating…' : 'Approve & create tool'}
            </button>
            {!canCreate && <span className="muted small">Fix the issues above or rephrase the prompt to create this tool.</span>}
          </div>
        </section>
      )}
    </div>
  );
}
