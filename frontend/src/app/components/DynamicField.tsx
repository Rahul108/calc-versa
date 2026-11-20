import type { FieldValue, ToolField } from '../lib/fields';

interface Props {
  field: ToolField;
  value: FieldValue | undefined;
  onChange: (value: FieldValue) => void;
  error?: string;
  disabled?: boolean;
  idPrefix?: string;
}

/** Renders one configured tool input with an associated label and error message. */
export function DynamicField({ field, value, onChange, error, disabled, idPrefix = 'field' }: Props) {
  const id = `${idPrefix}-${field.id}`;
  const errorId = error ? `${id}-error` : undefined;
  const common = {
    id,
    name: field.id,
    disabled,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': errorId,
  };
  const str = typeof value === 'string' ? value : '';

  let control;
  switch (field.type) {
    case 'select':
      control = (
        <select {...common} className="form-control" value={str} onChange={(e) => onChange(e.target.value)}>
          {field.options.length === 0 && <option value="">No options configured</option>}
          {field.options.map((opt) => (
            <option key={String(opt)} value={String(opt)}>
              {String(opt)}
            </option>
          ))}
        </select>
      );
      break;
    case 'checkbox':
      control = (
        <input
          {...common}
          type="checkbox"
          className="form-checkbox"
          checked={value === true}
          onChange={(e) => onChange(e.target.checked)}
        />
      );
      break;
    case 'slider':
      control = (
        <div className="row">
          <input
            {...common}
            type="range"
            className="range-slider"
            min={field.min ?? 0}
            max={field.max ?? 100}
            step={field.step ?? 'any'}
            value={str}
            onChange={(e) => onChange(e.target.value)}
          />
          <output htmlFor={id} className="slider-value">
            {str}
          </output>
        </div>
      );
      break;
    case 'number':
      control = (
        <input
          {...common}
          type="number"
          inputMode="decimal"
          step={field.step ?? 'any'}
          min={field.min}
          max={field.max}
          className="form-control"
          value={str}
          required={field.required}
          onChange={(e) => onChange(e.target.value)}
        />
      );
      break;
    case 'date':
      control = (
        <input {...common} type="date" className="form-control" value={str} onChange={(e) => onChange(e.target.value)} />
      );
      break;
    default:
      control = (
        <input {...common} type="text" className="form-control" value={str} onChange={(e) => onChange(e.target.value)} />
      );
  }

  return (
    <div className={field.type === 'checkbox' ? 'field field-inline' : 'field'}>
      <label htmlFor={id} className="form-label">
        {field.label}
        {field.required && <span aria-hidden="true"> *</span>}
      </label>
      {control}
      {error && (
        <p id={errorId} className="field-error">
          {error}
        </p>
      )}
    </div>
  );
}
