import React from 'react';
import { useBusiness } from '../hooks/useBusiness.jsx';
import { useDispatch } from '../hooks/useDispatch.js';

/** "Pedí en 2 h 14 min y sale hoy" con un anillo que se va cerrando hasta el corte. */
export default function DispatchBadge({ className = '' }) {
  const business = useBusiness();
  const status = useDispatch(business?.dispatch);
  if (!status) return null;
  // Proporción restante sobre una jornada de 8 h, solo para el anillo.
  const ratio = status.today ? Math.min(1, status.left / 480) : 0;
  return (
    <span className={`dispatch-badge ${status.today ? 'is-today' : ''} ${className}`}>
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <circle cx="10" cy="10" r="8" className="dispatch-badge__track" />
        <circle cx="10" cy="10" r="8" className="dispatch-badge__fill" style={{ strokeDashoffset: 50.3 * (1 - ratio) }} />
      </svg>
      {status.label}
    </span>
  );
}
