import React, { useEffect, useState } from 'react';

/** Aviso flotante mientras la API tarda en responder (servidor despertando en el plan gratis). */
export default function ServerWaking() {
  const [pending, setPending] = useState(0);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const onSlow = (e) => setPending(e.detail);
    window.addEventListener('api-slow', onSlow);
    return () => window.removeEventListener('api-slow', onSlow);
  }, []);

  useEffect(() => {
    if (!pending) { setSeconds(0); return undefined; }
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [pending]);

  if (!pending) return null;
  return (
    <div className="waking" role="status" aria-live="polite">
      <span className="waking__spinner" aria-hidden="true" />
      <div>
        <strong>Preparando el catálogo…</strong>
        <small>{seconds < 12 ? 'Un momento, ya casi está.' : 'La primera visita puede tardar hasta un minuto. Gracias por esperar.'}</small>
      </div>
    </div>
  );
}
