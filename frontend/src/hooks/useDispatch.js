import { useEffect, useState } from 'react';
import { dispatchStatus } from '../utils/business.js';

/** Cuenta regresiva al corte de despacho del día, recalculada cada 20 s. */
export function useDispatch(dispatch) {
  const [status, setStatus] = useState(() => dispatchStatus(dispatch));
  useEffect(() => {
    setStatus(dispatchStatus(dispatch));
    const id = setInterval(() => setStatus(dispatchStatus(dispatch)), 20_000);
    return () => clearInterval(id);
  }, [dispatch]);
  return status;
}
