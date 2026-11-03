import { useEffect, useState } from 'react';
import { openStatus } from '../utils/business.js';

/** Estado abierto/cerrado en vivo, recalculado cada 30 s. */
export function useOpenStatus(hours) {
  const [status, setStatus] = useState(() => openStatus(hours));
  useEffect(() => {
    setStatus(openStatus(hours));
    const id = setInterval(() => setStatus(openStatus(hours)), 30_000);
    return () => clearInterval(id);
  }, [hours]);
  return status;
}
