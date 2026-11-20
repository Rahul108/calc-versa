import type { FieldConfig, InputsConfig } from '../types';
import { localToday } from './format';

export type FieldType = 'number' | 'slider' | 'select' | 'checkbox' | 'text' | 'date';
export type FieldValue = string | boolean;

export interface ToolField {
  id: string;
  label: string;
  type: FieldType;
  defaultValue: unknown;
  options: Array<string | number>;
  min?: number;
  max?: number;
  step?: number;
  required: boolean;
}

export interface FieldSection {
  title: string;
  fields: ToolField[];
}

const TYPE_ALIASES: Record<string, FieldType> = {
  number: 'number',
  slider: 'slider',
  range: 'slider',
  select: 'select',
  dropdown: 'select', // emitted by the AI assistant and the builder
  checkbox: 'checkbox',
  boolean: 'checkbox',
  text: 'text',
  date: 'date',
};

export function normalizeType(type: unknown): FieldType {
  return TYPE_ALIASES[String(type ?? '').toLowerCase()] ?? 'text';
}

function normalizeOptions(options: FieldConfig['options']): Array<string | number> {
  if (Array.isArray(options)) return options;
  if (typeof options === 'string') {
    return options
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

function normalizeField(f: FieldConfig, index: number): ToolField | null {
  const id = f.id || f.name;
  if (!id) return null;
  const type = normalizeType(f.type);
  return {
    id,
    label: f.label || id || `Field ${index + 1}`,
    type,
    defaultValue: f.defaultValue,
    options: normalizeOptions(f.options),
    min: typeof f.min === 'number' ? f.min : undefined,
    max: typeof f.max === 'number' ? f.max : undefined,
    step: typeof f.step === 'number' ? f.step : undefined,
    // Numbers feed the formula engine, which fails on missing variables.
    required: f.required ?? (type === 'number' || type === 'slider'),
  };
}

/** Accepts both `{ sections: [{ fields }] }` and the flat `{ fields }` shape. */
export function getSections(config: InputsConfig | null | undefined): FieldSection[] {
  const raw = config?.sections?.length
    ? config.sections
    : [{ title: 'Inputs', fields: config?.fields ?? [] }];
  return raw.map((s, i) => ({
    title: s.title || (raw.length > 1 ? `Section ${i + 1}` : 'Inputs'),
    fields: (s.fields ?? []).map(normalizeField).filter((f): f is ToolField => f !== null),
  }));
}

export function allFields(sections: FieldSection[]): ToolField[] {
  return sections.flatMap((s) => s.fields);
}

export function defaultValues(fields: ToolField[], today = localToday()): Record<string, FieldValue> {
  const values: Record<string, FieldValue> = {};
  for (const f of fields) {
    if (f.type === 'checkbox') values[f.id] = f.defaultValue === true || f.defaultValue === 'true';
    else if (f.type === 'date') values[f.id] = !f.defaultValue || f.defaultValue === 'today' ? today : String(f.defaultValue);
    else if (f.type === 'select') {
      // Fall back to the first option when the configured default is not one of the options.
      const match = f.options.find((o) => String(o) === String(f.defaultValue));
      values[f.id] = String(match ?? f.options[0] ?? '');
    }
    else if (f.type === 'slider') values[f.id] = String(f.defaultValue ?? f.min ?? 0);
    else values[f.id] = f.defaultValue === undefined || f.defaultValue === null ? '' : String(f.defaultValue);
  }
  return values;
}

/**
 * Converts form state into the payload sent to the compute engine:
 * numbers become numbers, checkboxes booleans, numeric select options numbers.
 * Returns per-field validation errors instead of silently sending 0.
 */
export function buildPayload(
  fields: ToolField[],
  values: Record<string, FieldValue>,
): { payload: Record<string, unknown>; errors: Record<string, string> } {
  const payload: Record<string, unknown> = {};
  const errors: Record<string, string> = {};

  for (const f of fields) {
    const raw = values[f.id];
    if (f.type === 'checkbox') {
      payload[f.id] = raw === true;
      continue;
    }
    const str = typeof raw === 'string' ? raw.trim() : '';
    if (str === '') {
      if (f.required) errors[f.id] = `${f.label} is required`;
      continue;
    }
    if (f.type === 'number' || f.type === 'slider') {
      const n = Number(str);
      if (!Number.isFinite(n)) errors[f.id] = `${f.label} must be a number`;
      else if (f.min !== undefined && n < f.min) errors[f.id] = `${f.label} must be at least ${f.min}`;
      else if (f.max !== undefined && n > f.max) errors[f.id] = `${f.label} must be at most ${f.max}`;
      else payload[f.id] = n;
    } else if (f.type === 'select') {
      const match = f.options.find((o) => String(o) === str);
      payload[f.id] = typeof match === 'number' ? match : str;
    } else {
      payload[f.id] = str;
    }
  }
  return { payload, errors };
}
