import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { evaluateAiFeasibility, createAiTool } from '../services/api';

export const AiCopilotPage: React.FC = () => {
  const navigate = useNavigate();

  const [prompt, setPrompt] = useState('Create a Mortgage Loan Calculator with Loan Amount, Interest Rate slider, and Loan Term in years.');
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
      setError(err.message || 'AI Feasibility analysis failed.');
    } finally {
      setAnalyzing(false);
    }
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
    <div style={{ maxWidth: '1100px', margin: '2rem auto', padding: '0 1.5rem' }}>
      <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <span className="badge-status badge-ai" style={{ marginBottom: '0.5rem' }}>✨ Google Gemini 2.5 Flash Engine</span>
        <h2 style={{ fontSize: '2.25rem', fontWeight: 800 }} className="gradient-text">
          AI Prompt Copilot & Tool Generator
        </h2>
        <p style={{ color: '#94a3b8', marginTop: '0.5rem', maxWidth: '650px', margin: '0.5rem auto 0' }}>
          Describe any calculation tool in plain English. CalcVersa AI Agent will evaluate feasibility, generate input schemas, format mathematical formulas, and await your confirmation before instantiating.
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
            placeholder="e.g. Create a Mortgage Calculator with Loan Amount, Rate slider, and Term in years..."
            style={{ fontSize: '1rem', marginBottom: '1.25rem' }}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setPrompt('Create a Loan Amortization Schedule tool with Principal, Rate, and Months.')}
                style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
              >
                Sample: Amortization
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setPrompt('Create a Compound Interest Growth calculator with Principal, Rate, Years, and Compounding Frequency.')}
                style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
              >
                Sample: Compound Interest
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

      {/* AI Feasibility & Dry-Run Draft Preview Card */}
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
                {instantiating ? 'Instantiating Tool...' : '✅ Approve & Instantiate Tool'}
              </button>
            )}
          </div>

          <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.35rem' }}>
            {feasibility.tool_draft?.name}
          </h3>
          <p style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>{feasibility.tool_draft?.description}</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
            {/* Extracted Input Controls */}
            <div style={{ background: '#0d1322', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid #23304d' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#a5b4fc', marginBottom: '1rem' }}>Extracted Input Fields</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {feasibility.tool_draft?.inputsConfig?.sections?.[0]?.fields?.map((f: any, idx: number) => (
                  <div key={idx} style={{ background: '#131b2e', padding: '0.75rem', borderRadius: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.85rem', color: '#fff' }}>{f.label}</span>
                    <span style={{ fontSize: '0.75rem', color: '#8b5cf6', fontWeight: 600 }}>{f.type} (default: {f.defaultValue})</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Generated Formula Rules */}
            <div style={{ background: '#0d1322', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid #23304d' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#a5b4fc', marginBottom: '1rem' }}>Generated Formula Rules</h4>
              {feasibility.tool_draft?.formulaConfig?.rules?.map((r: any, idx: number) => (
                <div key={idx} style={{ background: '#131b2e', padding: '0.75rem', borderRadius: '0.5rem', fontFamily: 'monospace', fontSize: '0.8rem', color: '#34d399', wordBreak: 'break-all' }}>
                  {r.targetOutputId} = {r.expression}
                </div>
              ))}
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
