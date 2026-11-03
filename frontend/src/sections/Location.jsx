import React, { useState } from 'react';
import Icon from '../components/Icon.jsx';
import Reveal from '../components/Reveal.jsx';
import OpenBadge from '../components/OpenBadge.jsx';
import { useBusiness } from '../hooks/useBusiness.jsx';
import { href } from '../hooks/useRouter.jsx';
import { directionsLink, groupedHours, mapEmbed, nowInArgentina } from '../utils/business.js';

export default function Location() {
  const b = useBusiness();
  const [mapLoaded, setMapLoaded] = useState(false);
  if (!b) return null;
  const today = nowInArgentina().day;

  return (
    <section className="section location" id="ubicacion">
      <div className="container location__grid">
        <Reveal className="location__info">
          <p className="eyebrow"><span className="tick" /> 04 — Dónde estamos</p>
          <h2 className="section-title">Pasá por<br /><em>el mostrador.</em></h2>
          <address>
            <strong>{b.address.street}</strong>
            <span>{b.address.city}, {b.address.region}</span>
            {b.address.reference && <span className="muted">{b.address.reference}</span>}
          </address>
          <OpenBadge />
          <ul className="hours">
            {groupedHours(b.hours).map((g) => (
              <li key={g.label} className={g.days.includes(today) ? 'is-today' : ''}>
                <span>{g.label}</span><i /><span>{g.range}</span>
              </li>
            ))}
          </ul>
          <div className="location__ctas">
            <a className="btn btn--accent" href={directionsLink(b)} target="_blank" rel="noreferrer"><Icon name="pin" size={18} /> Cómo llegar</a>
            <a className="btn btn--ghost" href={`tel:${b.phone.tel}`}><Icon name="phone" size={18} /> {b.phone.display}</a>
          </div>
        </Reveal>
        <Reveal className="location__map" variant="clip" delay={150}>
          <figure className="storefront">
            <img src={href('/img/local/entrada.webp')} alt={`Entrada del local en ${b.address.street}`} width="543" height="345" loading="lazy" />
            <figcaption><Icon name="pin" size={14} /> Así es la entrada · {b.address.street}</figcaption>
          </figure>
          <div className={`map-frame ${mapLoaded ? 'is-loaded' : ''}`}>
            <iframe title={`Mapa de ${b.name}`} src={mapEmbed(b)} loading="lazy" referrerPolicy="no-referrer-when-downgrade" onLoad={() => setMapLoaded(true)} />
            <span className="map-frame__coords">{b.geo.lat.toFixed(4)}° S · {Math.abs(b.geo.lng).toFixed(4)}° O</span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
