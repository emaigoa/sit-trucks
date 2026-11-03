import React from 'react';
import Icon from '../components/Icon.jsx';
import Marquee from '../components/Marquee.jsx';
import DispatchBadge from '../components/DispatchBadge.jsx';
import { useBusiness } from '../hooks/useBusiness.jsx';

/** Franja de confianza: medios de pago en cinta + despacho del día. */
export default function Payments() {
  const b = useBusiness();
  if (!b?.payments?.length) return null;
  return (
    <section className="payments" aria-label="Medios de pago y despacho">
      <div className="container payments__inner">
        <div className="payments__lead">
          <strong>Todos los medios de pago</strong>
          <DispatchBadge />
        </div>
        <Marquee
          className="payments__marquee"
          items={b.payments}
          speed={26}
          renderItem={(p) => <span className="pay-chip"><Icon name="check" size={14} stroke={2.4} /> {p}</span>}
        />
      </div>
    </section>
  );
}
