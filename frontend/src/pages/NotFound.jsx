import React from 'react';
import { Link } from '../hooks/useRouter.jsx';

export default function NotFound() {
  return (
    <section className="container not-found">
      <p className="eyebrow"><span className="tick" /> Error 404</p>
      <h1>Esta página no existe.</h1>
      <p>Puede que el enlace esté roto o que el repuesto ya no esté publicado.</p>
      <div className="not-found__actions">
        <Link className="btn btn--accent" to="/catalogo">Ir al catálogo</Link>
        <Link className="btn btn--ghost" to="/">Volver al inicio</Link>
      </div>
    </section>
  );
}
