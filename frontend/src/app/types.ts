// Shapes returned by the API Gateway / AI Assistant (see docs/modules/api-gateway.md).

export interface AppAccess {
  read: boolean;
  write: boolean;
  owner: boolean;
}

export interface FieldConfig {
  id?: string;
  name?: string;
  label?: string;
  type?: string;
  defaultValue?: unknown;
  options?: Array<string | number> | string;
  min?: number;
  max?: number;
  step?: number;
  required?: boolean;
}

export interface InputsConfig {
  sections?: Array<{ title?: string; fields?: FieldConfig[] }>;
  fields?: FieldConfig[];
}

export interface FormulaOutput {
  id: string;
  label?: string;
  format?: 'currency' | 'number' | 'percent' | string;
}

export interface FormulaConfig {
  rules?: Array<{ targetOutputId: string; expression: string }>;
  outputs?: FormulaOutput[];
}

export interface UiConfig {
  toolType?: 'tracker' | 'calculator' | string;
  currency?: string;
  source?: string;
  summaryMetrics?: Array<{ key: string; label?: string }>;
  analytics?: { amountField?: string; memberField?: string; categoryField?: string };
  [key: string]: unknown;
}

export interface CalcApp {
  id: string;
  name: string;
  description: string;
  status: boolean;
  inputsConfig: InputsConfig | null;
  formulaConfig: FormulaConfig | null;
  uiConfig: UiConfig | null;
  created_at: string;
  updated_at: string;
  /** Present on GET /apps/:id: the caller's access level. */
  access?: AppAccess;
}

export interface AppRecord {
  id: string;
  app_id: string;
  user_id: string;
  payload: Record<string, unknown>;
  results: Record<string, unknown> | null;
  record_date: string;
  created_at: string;
}

export interface CalculationResponse {
  app_id: string;
  app_name: string;
  payload: Record<string, unknown>;
  results: Record<string, unknown>;
  execution_time_ms: number;
  saved_record: AppRecord | null;
}

export interface Breakdown {
  count: number;
  totalAmount: number;
}

export interface AggregationResponse {
  app_id: string;
  startDate: string;
  endDate: string;
  field_mapping: { amountField?: string; memberField?: string; categoryField?: string };
  total_runs: number;
  aggregated_totals: Record<string, number>;
  payload_totals: Record<string, number>;
  per_member_breakdown: Record<
    string,
    Breakdown & { results: Record<string, number>; payloadTotals: Record<string, number> }
  >;
  category_breakdown: Record<string, Breakdown>;
  daily_breakdown: Record<string, Breakdown>;
  monthly_breakdown: Record<string, Breakdown>;
}

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  is_admin: boolean;
}

export interface ToolDraft {
  name: string;
  description: string;
  inputsConfig: InputsConfig;
  formulaConfig: FormulaConfig;
  uiConfig: UiConfig;
}

export interface FeasibilityResponse {
  possible: boolean;
  confidence: number;
  safety_validated: boolean;
  requires_user_confirmation: boolean;
  tool_draft: ToolDraft;
  reasoning: string;
  safety_warnings: string[];
}
