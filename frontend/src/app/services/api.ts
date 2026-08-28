const API_GATEWAY_URL = 'http://localhost:3005';
const AI_ASSISTANT_URL = 'http://localhost:3006';

export function getStoredToken(): string {
  return localStorage.getItem('calcversa_jwt_token') || '';
}

export function setStoredToken(token: string, username?: string) {
  localStorage.setItem('calcversa_jwt_token', token);
  if (username) {
    localStorage.setItem('calcversa_username', username);
  }
}

export function clearStoredToken() {
  localStorage.removeItem('calcversa_jwt_token');
  localStorage.removeItem('calcversa_username');
}

export async function loginUser(usernameOrEmail: string, passwordStr: string) {
  const res = await fetch(`${API_GATEWAY_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usernameOrEmail, password: passwordStr }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Authentication failed');
  }
  const data = await res.json();
  setStoredToken(data.access_token, data.user.username);
  return data;
}

export async function fetchUserApps() {
  const token = getStoredToken();
  const res = await fetch(`${API_GATEWAY_URL}/apps`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    throw new Error('Failed to fetch calculation tools');
  }
  return res.json();
}

export async function fetchAppById(appId: string) {
  const token = getStoredToken();
  const res = await fetch(`${API_GATEWAY_URL}/apps/${appId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    throw new Error(`Tool with ID "${appId}" not found`);
  }
  return res.json();
}

export async function createApp(appData: any) {
  const token = getStoredToken();
  const res = await fetch(`${API_GATEWAY_URL}/apps`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(appData),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Failed to create calculation tool');
  }
  return res.json();
}

export async function calculateApp(appId: string, payload: Record<string, any>, saveRecord: boolean = true) {
  const token = getStoredToken();
  const res = await fetch(`${API_GATEWAY_URL}/apps/${appId}/calculate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ payload, saveRecord }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Calculation execution failed');
  }
  return res.json();
}

export async function evaluateAiFeasibility(prompt: string) {
  const res = await fetch(`${AI_ASSISTANT_URL}/agent/feasibility`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'AI Feasibility evaluation failed');
  }
  return res.json();
}

export async function createAiTool(toolDraft: any) {
  const token = getStoredToken();
  const res = await fetch(`${AI_ASSISTANT_URL}/agent/create-tool`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      user_confirmed: true,
      tool_draft: toolDraft,
    }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'AI Tool instantiation failed');
  }
  return res.json();
}
