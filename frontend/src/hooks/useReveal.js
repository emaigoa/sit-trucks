import { useEffect, useRef, useState } from 'react';

/** Devuelve [ref, visible]: visible pasa a true la primera vez que el elemento entra en pantalla. */
export function useReveal({ threshold = 0.18, rootMargin = '0px 0px -8% 0px' } = {}) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || visible) return undefined;
    if (!('IntersectionObserver' in window)) { setVisible(true); return undefined; }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); observer.disconnect(); }
    }, { threshold, rootMargin });
    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold, rootMargin, visible]);

  return [ref, visible];
}
