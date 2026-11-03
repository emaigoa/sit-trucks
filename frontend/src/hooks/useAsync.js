import { useCallback, useEffect, useRef, useState } from 'react';

/** Ejecuta una función async y expone { data, error, loading, reload }. */
export function useAsync(fn, deps = []) {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const run = useCallback(() => {
    const controller = new AbortController();
    setState((s) => ({ ...s, loading: true, error: null }));
    fnRef.current({ signal: controller.signal })
      .then((data) => setState({ data, error: null, loading: false }))
      .catch((error) => { if (error.name !== 'AbortError') setState({ data: null, error, loading: false }); });
    return controller;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    const controller = run();
    return () => controller.abort();
  }, [run]);

  return { ...state, reload: run, setData: (data) => setState((s) => ({ ...s, data: typeof data === 'function' ? data(s.data) : data })) };
}
