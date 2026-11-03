import { useEffect, useState } from 'react';

const reduced = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** Anima un número de 0 a `target` cuando `start` es true. */
export function useCountUp(target, { start = true, duration = 1400, decimals = 0 } = {}) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!start) return undefined;
    if (reduced()) { setValue(target); return undefined; }
    let frame;
    const t0 = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / duration);
      const eased = 1 - (1 - p) ** 4;
      setValue(target * eased);
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, start, duration]);

  return value.toFixed(decimals).replace('.', ',');
}
