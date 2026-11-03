import React from 'react';
import Reveal from '../components/Reveal.jsx';
import { useScrollProgress } from '../hooks/useScrollProgress.js';

const steps = [
  { n: '01', title: 'Nos pasás la pieza', text: 'Código, foto del repuesto o marca, modelo y año del camión. Por WhatsApp, teléfono o en el mostrador.' },
  { n: '02', title: 'Verificamos compatibilidad', text: 'Confirmamos que sea la pieza correcta para tu unidad antes de que hagas un viaje en vano.' },
  { n: '03', title: 'Retirás o te lo enviamos', text: 'Lo buscás en Tomás Falkner 6957 o coordinamos el envío para que la pieza llegue a donde está el camión.' },
];

export default function Process() {
  const [ref, progress] = useScrollProgress();
  return (
    <section className="section process" id="como-trabajamos">
      <div className="container">
        <Reveal>
          <p className="eyebrow"><span className="tick" /> 02 — Cómo trabajamos</p>
          <h2 className="section-title">Tres pasos.<br /><em>Sin vueltas.</em></h2>
        </Reveal>
        <ol className="process__steps" ref={ref} style={{ '--progress': progress }}>
          <span className="process__rail" aria-hidden="true"><i /></span>
          {steps.map((s, i) => (
            <li key={s.n} className={progress > (i + 0.2) / steps.length ? 'is-active' : ''}>
              <span className="process__num">{s.n}</span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
