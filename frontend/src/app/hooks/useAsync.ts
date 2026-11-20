import { useCallback, useEffect, useRef, useState, type DependencyList } from 'react';

export interface AsyncState<T> {
  data: T | undefined;
  error: Error | undefined;
  loading: boolean;
  reload: () => void;
}

/**
 * Runs `fn` when `deps` change (and on reload()), ignoring results from
 * superseded runs. Errors are surfaced, never replaced with placeholder data.
 */
export function useAsync<T>(fn: () => Promise<T>, deps: DependencyList, enabled = true): AsyncState<T> {
  const [data, setData] = useState<T>();
  const [error, setError] = useState<Error>();
  const [loading, setLoading] = useState(enabled);
  const [tick, setTick] = useState(0);
  const runId = useRef(0);

  // `deps` is the caller's dependency list for `fn` (same contract as useCallback).
  const run = useCallback(fn, deps);

  useEffect(() => {
    if (!enabled) return;
    const id = ++runId.current;
    setLoading(true);
    setError(undefined);
    run()
      .then((result) => {
        if (id === runId.current) setData(result);
      })
      .catch((err) => {
        if (id === runId.current) setError(err instanceof Error ? err : new Error(String(err)));
      })
      .finally(() => {
        if (id === runId.current) setLoading(false);
      });
  }, [run, tick, enabled]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { data, error, loading, reload };
}
