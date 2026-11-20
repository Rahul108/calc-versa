import { AI_ASSISTANT_URL, API_GATEWAY_URL } from '../config';
import { apiFetch } from './http';
import type {
  AggregationResponse,
  AppRecord,
  AuthUser,
  CalcApp,
  CalculationResponse,
  FeasibilityResponse,
  ToolDraft,
} from '../types';

const gw = <T>(path: string, options?: Parameters<typeof apiFetch>[2]) =>
  apiFetch<T>(API_GATEWAY_URL, path, options);
const ai = <T>(path: string, options?: Parameters<typeof apiFetch>[2]) =>
  apiFetch<T>(AI_ASSISTANT_URL, path, options);

const enc = encodeURIComponent;

export const api = {
  login: (usernameOrEmail: string, password: string) =>
    gw<{ access_token: string; user: AuthUser }>('/auth/login', {
      method: 'POST',
      body: { usernameOrEmail, password },
      auth: false,
    }),
  me: () => gw<AuthUser>('/auth/me'),

  listApps: () => gw<CalcApp[]>('/apps'),
  getApp: (appId: string) => gw<CalcApp>(`/apps/${enc(appId)}`),
  createApp: (draft: ToolDraft) => gw<CalcApp>('/apps', { method: 'POST', body: draft }),

  calculate: (appId: string, payload: Record<string, unknown>, saveRecord: boolean) =>
    gw<CalculationResponse>(`/apps/${enc(appId)}/calculate`, {
      method: 'POST',
      body: { payload, saveRecord },
    }),
  createRecord: (appId: string, payload: Record<string, unknown>, record_date?: string) =>
    gw<AppRecord>('/records', { method: 'POST', body: { app_id: appId, payload, record_date } }),
  listRecords: (appId: string) => gw<AppRecord[]>(`/apps/${enc(appId)}/records`),
  deleteRecord: (appId: string, recordId: string) =>
    gw<{ message: string }>(`/apps/${enc(appId)}/records/${enc(recordId)}`, { method: 'DELETE' }),
  aggregate: (appId: string, startDate?: string, endDate?: string) =>
    gw<AggregationResponse>(`/apps/${enc(appId)}/aggregate`, {
      method: 'POST',
      body: { startDate: startDate || undefined, endDate: endDate || undefined },
    }),

  aiFeasibility: (prompt: string) =>
    ai<FeasibilityResponse>('/agent/feasibility', { method: 'POST', body: { prompt } }),
  aiCreateTool: (draft: ToolDraft) =>
    ai<{ app: CalcApp }>('/agent/create-tool', {
      method: 'POST',
      body: { user_confirmed: true, tool_draft: draft },
    }),
};

export function adminPanelUrl() {
  return `${API_GATEWAY_URL}/admin`;
}
