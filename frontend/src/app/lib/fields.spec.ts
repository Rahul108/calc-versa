import { buildPayload, defaultValues, getSections, normalizeType } from './fields';

describe('field normalisation', () => {
  it('treats the AI/builder "dropdown" type as a select', () => {
    expect(normalizeType('dropdown')).toBe('select');
    expect(normalizeType('select')).toBe('select');
    expect(normalizeType('weird')).toBe('text');
  });

  it('supports both sectioned and flat inputsConfig shapes', () => {
    expect(getSections({ fields: [{ id: 'a', type: 'number' }] })[0].fields[0].id).toBe('a');
    expect(getSections({ sections: [{ title: 'S', fields: [{ name: 'b' }] }] })[0].fields[0].id).toBe('b');
  });

  it('falls back to the first option when the default is not an option', () => {
    const [section] = getSections({ fields: [{ id: 'm', type: 'select', defaultValue: 'Member 1', options: ['Member 1 (John)', 'Member 2'] }] });
    expect(defaultValues(section.fields)).toEqual({ m: 'Member 1 (John)' });
  });

  it('uses the local date for date defaults', () => {
    const [section] = getSections({ fields: [{ id: 'd', type: 'date', defaultValue: 'today' }] });
    expect(defaultValues(section.fields, '2026-11-21')).toEqual({ d: '2026-11-21' });
  });
});

describe('buildPayload', () => {
  const [section] = getSections({
    fields: [
      { id: 'amount', label: 'Amount', type: 'number' },
      { id: 'rate', label: 'Rate', type: 'slider', min: 1, max: 20 },
      { id: 'term', label: 'Term', type: 'dropdown', options: [15, 30] },
      { id: 'note', label: 'Note', type: 'text' },
      { id: 'insured', label: 'Insured', type: 'checkbox' },
    ],
  });

  it('converts values to the types the formula engine expects', () => {
    const { payload, errors } = buildPayload(section.fields, { amount: '12.5', rate: '6', term: '30', note: ' hi ', insured: true });
    expect(errors).toEqual({});
    expect(payload).toEqual({ amount: 12.5, rate: 6, term: 30, note: 'hi', insured: true });
  });

  it('reports missing or invalid numbers instead of sending 0', () => {
    const { payload, errors } = buildPayload(section.fields, { amount: '', rate: '50', term: '15', note: '', insured: false });
    expect(errors.amount).toBe('Amount is required');
    expect(errors.rate).toBe('Rate must be at most 20');
    expect(payload).not.toHaveProperty('amount');
  });
});
