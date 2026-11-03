import React from 'react';
import Marquee from '../components/Marquee.jsx';

const words = ['IVECO', 'Motor', 'Mercedes-Benz', 'Frenos', 'Scania', 'Transmisión', 'Volvo', 'Despacho en el día', 'Ford', 'Neumática', 'Volkswagen', 'Suspensión'];

export default function CategoryTicker() {
  return (
    <section className="ticker" aria-label="Rubros">
      <Marquee items={words} speed={38} renderItem={(w, i) => <span className={i % 2 ? 'ticker__word ticker__word--outline' : 'ticker__word'}>{w}<i /></span>} />
    </section>
  );
}
