import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { evaluateAiFeasibility, createAiTool } from '../services/api';

export const AiCopilotPage: React.FC = () => {
  const navigate = useNavigate();

  const [prompt, setPrompt] = useState('prepare me a building management tool, total number of flat: 81, each flat owner will be able to see their rents and bills, separate search fields for each flat numbers, show summarized result');
  const [analyzing, setAnalyzing] = useState(false);
  const [instantiating, setInstantiating] = useState(false);
  const [feasibility, setFeasibility] = useState<any>(null);
  const [error, setError] = useState('');

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setAnalyzing(true);
    setError('');
    setFeasibility(null);

    try {
      const result = await evaluateAiFeasibility(prompt);
      setFeasibility(result);
    } catch (err: any) {
      setError(err.message || 'AI Feasibility evaluation failed.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleRuleExpressionChange = (ruleIdx: number, newExpression: string) => {
    if (!feasibility?.tool_draft?.formulaConfig?.rules) return;
    const updatedDraft = JSON.parse(JSON.stringify(feasibility.tool_draft));
    updatedDraft.formulaConfig.rules[ruleIdx].expression = newExpression;
    setFeasibility({ ...feasibility, tool_draft: updatedDraft });
  };

  const handleToolNameChange = (newName: string) => {
    if (!feasibility?.tool_draft) return;
    const updatedDraft = JSON.parse(JSON.stringify(feasibility.tool_draft));
    updatedDraft.name = newName;
    setFeasibility({ ...feasibility, tool_draft: updatedDraft });
  };

  const handleInstantiate = async () => {
    if (!feasibility?.tool_draft) return;
    setInstantiating(true);
    setError('');

    try {
      const res = await createAiTool(feasibility.tool_draft);
      if (res?.app?.id) {
        navigate(`/product?id=${res.app.id}`);
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || 'Tool instantiation failed.');
    } finally {
      setInstantiating(false);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '2rem auto', padding: '0 1.5rem' }}>
      <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <span className="badge-status badge-ai" style={{ marginBottom: '0.5rem' }}>✨ Google Gemini 2.5 Flash Engine</span>
        <h2 style={{ fontSize: '2.25rem', fontWeight: 800 }} className="gradient-text">
          AI Prompt Copilot & Tool Configurator
        </h2>
        <p style={{ color: '#94a3b8', marginTop: '0.5rem', maxWidth: '650px', margin: '0.5rem auto 0' }}>
          Describe any calculation tool in plain English. CalcVersa AI Agent will evaluate feasibility, generate input schemas, format mathematical formulas, and allow you to tweak formulas before instantiating.
        </p>
      </div>

      {/* Prompt Input Form */}
      <div className="glass-card" style={{ marginBottom: '2rem' }}>
        <form onSubmit={handleAnalyze}>
          <label className="form-label" style={{ fontSize: '1rem', color: '#fff', marginBottom: '0.75rem' }}>
            User Requirement Prompt
          </label>
          <textarea
            className="form-control"
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. Create a Building Management Tool with 81 flats, rent, utilities..."
            style={{ fontSize: '1rem', marginBottom: '1.25rem' }}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setPrompt('prepare me a building management tool, total number of flat: 81, each flat owner will be able to see their rents and bills, separate search fields for each flat numbers, show summarized result')}
                style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
              >
                Sample: Building Management
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setPrompt('Create a Loan Amortization Schedule tool with Principal, Rate, and Months.')}
                style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
              >
                Sample: Amortization
              </button>
            </div>

            <button type="submit" className="btn-primary" disabled={analyzing}>
              {analyzing ? 'Evaluating Feasibility...' : '⚡ Analyze Feasibility with Gemini'}
            </button>
          </div>
        </form>
      </div>

      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '1rem', borderRadius: '0.75rem', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {/* AI Feasibility & Interactive Formula Configurator Preview Card */}
      {feasibility && (
        <div className="glass-card" style={{ border: feasibility.possible ? '1px solid #6366f1' : '1px solid #ef4444', animation: 'fadeIn 0.3s ease-in' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #23304d', paddingBottom: '1rem' }}>
            <div>
              <span className={`badge-status ${feasibility.possible ? 'badge-active' : ''}`} style={{ background: feasibility.possible ? undefined : 'rgba(239, 68, 68, 0.2)', color: feasibility.possible ? undefined : '#ef4444' }}>
                {feasibility.possible ? '✅ Tool Creation Feasible' : '❌ Requirements Not Feasible'}
              </span>
              <span style={{ fontSize: '0.85rem', color: '#94a3b8', marginLeft: '1rem' }}>
                Confidence Score: <strong>{(feasibility.confidence * 100).toFixed(0)}%</strong>
              </span>
            </div>

            {feasibility.possible && (
              <button onClick={handleInstantiate} className="btn-primary" disabled={instantiating}>
                {instantiating ? 'Instantiating Tool...' : '🚀 Approve & Instantiate Tool'}
              </button>
            )}
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label className="form-label">Tool Name (Editable)</label>
            <input
              type="text"
              className="form-control"
              value={feasibility.tool_draft?.name || ''}
              onChange={(e) => handleToolNameChange(e.target.value)}
              style={{ fontWeight: 700, fontSize: '1.1rem' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
            {/* Extracted Input Controls */}
            <div style={{ background: '#0d1322', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid #23304d' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#a5b4fc', marginBottom: '1rem' }}>Extracted Input Parameters</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {feasibility.tool_draft?.inputsConfig?.sections?.[0]?.fields?.map((f: any, idx: number) => (
                  <div key={idx} style={{ background: '#131b2e', padding: '0.75rem', borderRadius: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 600 }}>{f.label}</span>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>ID: <code>{f.id}</code></span>
                    </div>
                    <span className="badge-status badge-active" style={{ fontSize: '0.7rem' }}>{f.type}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Editable Formula Rules */}
            <div style={{ background: '#0d1322', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid #23304d' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#a5b4fc', marginBottom: '0.5rem' }}>
                Mathematical Formula Rules (Editable)
              </h4>
              <p style={{ color: '#94a3b8', fontSize: '0.75rem', marginBottom: '1rem' }}>
                Review and tweak any formula rule expression before instantiating:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {feasibility.tool_draft?.formulaConfig?.rules?.map((r: any, idx: number) => (
                  <div key={idx} style={{ background: '#131b2e', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #23304d' }}>
                    <label style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                      Target Output: <code>{r.targetOutputId}</code>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={r.expression}
                      onChange={(e) => handleRuleExpressionChange(idx, e.target.value)}
                      style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: '#34d399' }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ background: '#090d16', padding: '1rem', borderRadius: '0.5rem', fontSize: '0.85rem', color: '#94a3b8' }}>
            💡 <strong>AI Reasoning:</strong> {feasibility.reasoning}
          </div>
        </div>
      )}
    </div>
  );
};
