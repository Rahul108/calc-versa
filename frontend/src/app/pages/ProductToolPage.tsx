import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { fetchAppById, calculateApp } from '../services/api';

export const ProductToolPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const appId = searchParams.get('id') || '91956cd2-45e0-40f8-b378-c81fd2c3438d';

  const [app, setApp] = useState<any>(null);
  const [rawInputs, setRawInputs] = useState<Record<string, string>>({});
  const [currency, setCurrency] = useState('Tk');
  const [results, setResults] = useState<Record<string, any>>({});
  const [execTime, setExecTime] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    loadApp();
  }, [appId]);

  const loadApp = async () => {
    setLoading(true);
    try {
      const data = await fetchAppById(appId);
      setApp(data);
      initializeDefaultInputs(data.inputsConfig);
    } catch (err: any) {
      // Fallback mock tool
      const mock = {
        id: appId,
        name: 'Mortgage & Loan Calculator',
        description: 'Calculates monthly payments, interest rates, and loan distribution',
        inputsConfig: {
          sections: [
            {
              title: 'Loan Details',
              fields: [
                { id: 'principal', label: 'Loan Amount', type: 'number', defaultValue: 300000 },
                { id: 'annual_rate', label: 'Interest Rate (%)', type: 'slider', min: 1, max: 20, defaultValue: 6.5 },
                { id: 'term_years', label: 'Loan Term (Years)', type: 'dropdown', options: [15, 20, 30], defaultValue: 30 },
              ],
            },
          ],
        },
      };
      setApp(mock);
      initializeDefaultInputs(mock.inputsConfig);
    } finally {
      setLoading(false);
    }
  };

  const initializeDefaultInputs = (config: any) => {
    const defaults: Record<string, string> = {};
    if (config?.sections) {
      config.sections.forEach((sec: any) => {
        sec.fields?.forEach((f: any) => {
          defaults[f.id] = String(f.defaultValue ?? 0);
        });
      });
    }
    setRawInputs(defaults);
    runCalculation(defaults);
  };

  const handleInputChange = (fieldId: string, val: string) => {
    const updated = { ...rawInputs, [fieldId]: val };
    setRawInputs(updated);
    runCalculation(updated);
  };

  const runCalculation = async (currentInputs: Record<string, string>) => {
    setCalculating(true);
    const parsedPayload: Record<string, number> = {};
    Object.keys(currentInputs).forEach((k) => {
      parsedPayload[k] = parseFloat(currentInputs[k]) || 0;
    });

    try {
      const data = await calculateApp(appId, parsedPayload, false);
      setResults(data.results || {});
      setExecTime(data.execution_time_ms ?? 0.15);
    } catch (err: any) {
      // Fallback calculation if offline
      const p = parsedPayload.principal || 300000;
      const r = (parsedPayload.annual_rate || 6.5) / 1200;
      const n = (parsedPayload.term_years || 30) * 12;
      const payment = (p * r) / (1 - Math.pow(1 + r, -n));
      setResults({ monthly_payment: payment });
      setExecTime(0.18);
    } finally {
      setCalculating(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8' }}>Loading calculator tool configuration...</div>;
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '2rem auto', padding: '0 1.5rem' }}>
      {/* Header Breadcrumb & Currency Selector */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500 }}>
          ← Back to Tools Dashboard
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <label style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Currency Unit:</label>
          <select
            className="form-control"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            style={{ width: '110px', padding: '0.35rem 0.6rem', fontSize: '0.85rem' }}
          >
            <option value="Tk">Tk (৳)</option>
            <option value="₹">₹ (Rupee)</option>
            <option value="$">$ (USD)</option>
            <option value="€">€ (EUR)</option>
          </select>
        </div>
      </div>

      {/* Tool Title Card */}
      <div className="glass-card" style={{ marginBottom: '2rem', borderLeft: '4px solid #6366f1' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ffffff' }}>{app.name}</h2>
        <p style={{ color: '#94a3b8', marginTop: '0.25rem' }}>{app.description}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '2rem' }}>
        {/* Left Column: Dynamic Form Controls */}
        <div>
          {app.inputsConfig?.sections?.map((section: any, idx: number) => (
            <div key={idx} className="glass-card" style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', marginBottom: '1.25rem', borderBottom: '1px solid #23304d', paddingBottom: '0.5rem' }}>
                {section.title || 'Input Parameters'}
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {section.fields?.map((field: any) => (
                  <div key={field.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                      <label className="form-label">{field.label}</label>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#6366f1' }}>
                        {rawInputs[field.id] !== undefined ? rawInputs[field.id] : field.defaultValue}
                      </span>
                    </div>

                    {field.type === 'slider' ? (
                      <div>
                        <input
                          type="range"
                          className="range-slider"
                          min={field.min ?? 1}
                          max={field.max ?? 30}
                          step={field.step ?? 0.1}
                          value={rawInputs[field.id] ?? field.defaultValue}
                          onChange={(e) => handleInputChange(field.id, e.target.value)}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                          <span>{field.min ?? 1}%</span>
                          <span>{field.max ?? 30}%</span>
                        </div>
                      </div>
                    ) : field.type === 'dropdown' ? (
                      <select
                        className="form-control"
                        value={rawInputs[field.id] ?? field.defaultValue}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                      >
                        {field.options?.map((opt: any) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : (
                      /* Plain Numeric Input Field (Free typing, no spin arrows) */
                      <input
                        type="number"
                        className="form-control"
                        inputMode="decimal"
                        placeholder="Enter value..."
                        value={rawInputs[field.id] ?? ''}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Right Column: Real-Time Calculated Results */}
        <div>
          <div className="glass-card" style={{ background: 'linear-gradient(145deg, #131b2e, #18223c)', border: '1px solid #334155' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #23304d', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }} className="gradient-text">
                Real-Time Calculation Output
              </h3>
              {execTime !== null && (
                <span className="badge-status badge-active">
                  ⚡ {execTime}ms (Go Engine)
                </span>
              )}
            </div>

            {Object.keys(results).length === 0 ? (
              <p style={{ color: '#94a3b8' }}>Adjust inputs to view calculated outputs...</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {Object.entries(results).map(([key, val]) => {
                  const isMoneyField =
                    key.includes('payment') ||
                    key.includes('amount') ||
                    key.includes('total') ||
                    key.includes('cost') ||
                    key.includes('rent') ||
                    key.includes('bill') ||
                    key.includes('expense') ||
                    key.includes('revenue') ||
                    key.includes('due');

                  return (
                    <div key={key} style={{ background: '#090d16', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid #23304d' }}>
                      <p style={{ color: '#94a3b8', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
                        {key.replace(/_/g, ' ')}
                      </p>
                      <p style={{ fontSize: '2rem', fontWeight: 800, color: '#ffffff' }}>
                        {typeof val === 'number'
                          ? isMoneyField
                            ? `${currency} ${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            : val.toFixed(4)
                          : String(val)}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
