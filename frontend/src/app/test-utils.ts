/** Replaces global.fetch with a Jest mock (typed, so specs avoid `any`). */
export function mockFetch(impl: (url: string, init?: RequestInit) => unknown): jest.Mock {
  const fn = jest.fn(async (url: string, init?: RequestInit) => impl(url, init));
  global.fetch = fn as unknown as typeof fetch;
  return fn;
}

export const jsonResponse = (status: number, body: unknown) => ({
  ok: status < 400,
  status,
  text: async () => (body === undefined ? '' : JSON.stringify(body)),
});
