import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createApp } from '../services/api';

export const CreateToolPage: React.FC = () => {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [fields, setFields] = useState<any[]>([
    { id: 'principal', label: 'Loan Amount', type: 'number', defaultValue: 250000 },
    { id: 'annual_rate', label: 'Interest Rate (%)', type: 'slider', min: 1, max: 20, defaultValue: 6.5 },
  ]);
  const [outputId, setOutputId] = useState('monthly_payment');
  const [expression, setExpression] = useState('(principal * (annual_rate / 1200)) / (1 - (1 + (annual_rate / 1200)) ** -360)');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const addField = () => {
    const newId = `field_${fields.length + 1}`;
    setFields([...fields, { id: newId, label: `Custom Parameter ${fields.length + 1}`, type: 'number', defaultValue: 100 }]);
  };

  const updateField = (index: number, key: string, val: any) => {
    const updated = [...fields];
    updated[index][key] = val;
    setFields(updated);
  };

  const removeField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Tool name is required.');
      return;
    }

    setSubmitting(true);
    setError('');

    const payload = {
      name,
      description,
      inputsConfig: {
        sections: [
          {
            title: 'User Input Parameters',
            fields,
          },
        ],
      },
      formulaConfig: {
        rules: [
          {
            targetOutputId: outputId,
            expression,
          },
        ],
      },
      uiConfig: { theme: 'dark', primaryColor: '#6366f1' },
    };

    try {
      const created = await createApp(payload);
      navigate(`/product?id=${created.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create tool.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '2rem auto', padding: '0 1.5rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link to="/" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem' }}>
          ← Back to Tools Dashboard
        </Link>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 800 }} className="gradient-text">
          Creative Tool Builder
        </h2>
        <p style={{ color: '#94a3b8', marginTop: '0.25rem' }}>
          Visually configure custom form input fields, dynamic sliders, and mathematical formula rules
        </p>
      </div>

      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '1rem', borderRadius: '0.75rem', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '2rem' }}>
          {/* Left Column: Form Controls Configurator */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="glass-card">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '1rem' }}>Tool Details</h3>
              <div style={{ marginBottom: '1rem' }}>
                <label className="form-label">Tool Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Compound Interest Growth Tool"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="form-label">Description</label>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="Describes what this calculation tool computes..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>

            {/* Input Fields Builder */}
            <div className="glass-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>Input Form Controls</h3>
                <button type="button" onClick={addField} className="btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>
                  + Add Input Field
                </button>
              </div>

              {fields.map((field, idx) => (
                <div key={idx} style={{ background: '#090d16', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #23304d', marginBottom: '1rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <div>
                      <label className="form-label">Field ID (Variable Name)</label>
                      <input
                        type="text"
                        className="form-control"
                        value={field.id}
                        onChange={(e) => updateField(idx, 'id', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="form-label">Display Label</label>
                      <input
                        type="text"
                        className="form-control"
                        value={field.label}
                        onChange={(e) => updateField(idx, 'label', e.target.value)}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '0.75rem', alignItems: 'flex-end' }}>
                    <div>
                      <label className="form-label">Control Type</label>
                      <select
                        className="form-control"
                        value={field.type}
                        onChange={(e) => updateField(idx, 'type', e.target.value)}
                      >
                        <option value="number">Number Box</option>
                        <option value="slider">Range Slider</option>
                        <option value="dropdown">Dropdown Options</option>
                      </select>
                    </div>
                    <div>
                      <label className="form-label">Default Value</label>
                      <input
                        type="number"
                        className="form-control"
                        value={field.defaultValue}
                        onChange={(e) => updateField(idx, 'defaultValue', Number(e.target.value))}
                      />
                    </div>
                    {fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeField(idx)}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.5rem' }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Formula Expression Builder */}
            <div className="glass-card">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '1rem' }}>Mathematical Formula Rules</h3>
              <div style={{ marginBottom: '1rem' }}>
                <label className="form-label">Target Output Name (Variable)</label>
                <input
                  type="text"
                  className="form-control"
                  value={outputId}
                  onChange={(e) => setOutputId(e.target.value)}
                />
              </div>
              <div>
                <label className="form-label">Formula Expression (Go Engine Evaluated)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="(principal * annual_rate) / 100"
                  value={expression}
                  onChange={(e) => setExpression(e.target.value)}
                  required
                />
                <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.35rem' }}>
                  Use field IDs defined above (e.g., <code>principal</code>, <code>annual_rate</code>) with math operators (<code>+</code>, <code>-</code>, <code>*</code>, <code>/</code>, <code>^</code> or <code>**</code>).
                </p>
              </div>
            </div>

            <button type="submit" className="btn-primary" disabled={submitting} style={{ width: '100%', justifyContent: 'center', padding: '0.9rem' }}>
              {submitting ? 'Instantiating Tool in Database...' : '🚀 Save & Instantiate Calculator Tool'}
            </button>
          </div>

          {/* Right Column: Real-Time Visual Tool Form Preview */}
          <div>
            <div className="glass-card" style={{ border: '1px dashed #6366f1', position: 'sticky', top: '100px' }}>
              <span className="badge-status badge-active" style={{ marginBottom: '1rem' }}>Live Tool Form Preview</span>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.25rem' }}>
                {name || 'Untitled Tool Preview'}
              </h3>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                {description || 'Preview of live input controls...'}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                {fields.map((f, i) => (
                  <div key={i} style={{ background: '#0d1322', padding: '0.9rem', borderRadius: '0.5rem', border: '1px solid #23304d' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{f.label || f.id}</span>
                      <span style={{ fontSize: '0.85rem', color: '#6366f1', fontWeight: 600 }}>{f.defaultValue}</span>
                    </div>
                    {f.type === 'slider' ? (
                      <input type="range" className="range-slider" readOnly value={f.defaultValue} />
                    ) : (
                      <div style={{ color: '#fff', fontSize: '0.9rem' }}>{f.defaultValue}</div>
                    )}
                  </div>
                ))}
              </div>

              <div style={{ background: '#090d16', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #23304d' }}>
                <p style={{ color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase' }}>Formula Rule</p>
                <p style={{ color: '#34d399', fontWeight: 600, fontSize: '0.9rem', fontFamily: 'monospace', marginTop: '0.25rem' }}>
                  {outputId} = {expression}
                </p>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
