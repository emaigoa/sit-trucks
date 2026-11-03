import React from 'react';
import Marquee from '../components/Marquee.jsx';

const words = ['IVECO', 'Daily', 'Motor', 'Tector', 'Frenos', 'Stralis', 'Despacho en el día', 'EuroCargo', 'Transmisión', 'Cursor', 'Neumática', 'S-Way'];

export default function CategoryTicker() {
  return (
    <section className="ticker" aria-label="Rubros">
      <Marquee items={words} speed={38} renderItem={(w, i) => <span className={i % 2 ? 'ticker__word ticker__word--outline' : 'ticker__word'}>{w}<i /></span>} />
    </section>
  );
}
