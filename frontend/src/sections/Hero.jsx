import React from 'react';
import Icon from '../components/Icon.jsx';
import SplitText from '../components/SplitText.jsx';
import OpenBadge from '../components/OpenBadge.jsx';
import HeroVisual from './HeroVisual.jsx';
import RotatingWord from '../components/RotatingWord.jsx';
import DispatchBadge from '../components/DispatchBadge.jsx';
import { useBusiness } from '../hooks/useBusiness.jsx';
import { whatsappLink } from '../utils/business.js';
import { Link } from '../hooks/useRouter.jsx';

export default function Hero() {
  const b = useBusiness();
  const wa = whatsappLink(b, 'Hola, estoy buscando un repuesto para mi camión.');

  return (
    <section className="hero" id="inicio">
      <div className="hero__grid-bg" aria-hidden="true" />
      <div className="container hero__inner">
        <div className="hero__copy">
          <p className="eyebrow hero__eyebrow"><span className="tick" /> Mar del Plata · Repuestos <RotatingWord words={b?.brands?.map((x) => x.name) ?? ['IVECO']} /></p>
          <h1 className="hero__title">
            <SplitText text="Que el camión" />
            <br />
            <SplitText text="no se quede" start={3} />
            <br />
            <span className="hero__title-accent"><SplitText text="parado." start={6} /></span>
          </h1>
          <p className="hero__lead">Repuestos para IVECO, Mercedes-Benz, Scania, Volvo, Ford y Volkswagen. Nos pasás el código o una foto de la pieza, te confirmamos stock y compatibilidad en el momento y despachamos en el día.</p>
          <div className="hero__ctas">
            <Link className="btn btn--accent btn--lg" to="/catalogo">Ver catálogo <Icon name="arrow" size={18} /></Link>
            {wa && <a className="btn btn--ghost btn--lg" href={wa} target="_blank" rel="noreferrer"><Icon name="whatsapp" size={18} /> WhatsApp</a>}
          </div>
        </div>
        <HeroVisual />
      </div>

      <div className="container hero__bar">
        <div className="hero__bar-cell">
          <Icon name="send" size={18} />
          <div><small>Despacho</small><DispatchBadge /></div>
        </div>
        <div className="hero__bar-cell">
          <Icon name="clock" size={18} />
          <div><small>Hoy</small><OpenBadge /></div>
        </div>
        <div className="hero__bar-cell">
          <Icon name="star" size={18} />
          <div><small>Google</small><strong>{b ? `${b.rating.value.toFixed(1).replace('.', ',')} · ${b.rating.count} reseñas` : '—'}</strong></div>
        </div>
        {b && <a className="hero__bar-cell hero__bar-call" href={`tel:${b.phone.tel}`}><Icon name="phone" size={18} /><div><small>Llamanos</small><strong>{b.phone.display}</strong></div></a>}
      </div>

      <div className="road" aria-hidden="true"><span /></div>
    </section>
  );
}
