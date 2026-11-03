import React from 'react';
import { Link, useRouter } from '../hooks/useRouter.jsx';
import { withParams } from '../utils/catalogUrl.js';
import PhotoCredit from '../components/PhotoCredit.jsx';

/** Banner de marca (como las "tiendas oficiales" de ML) con foto real y accesos por modelo. */
export default function BrandBanner({ brand, activeModel }) {
  const { search } = useRouter();
  return (
    <section className={`brand-banner ${brand.image ? '' : 'brand-banner--plain'}`}>
      {brand.image && <img src={brand.image.replace('.webp', '-sm.webp')} srcSet={`${brand.image.replace('.webp', '-sm.webp')} 720w, ${brand.image} 1600w`} sizes="(max-width: 900px) 100vw, 1240px" alt={`Camión ${brand.name}`} />}
      <div className="brand-banner__copy">
        <p className="eyebrow"><span className="tick" /> Repuestos para</p>
        <h2>{brand.name}</h2>
        <p>{brand.claim}</p>
        <ul>
          {brand.models.map((m) => (
            <li key={m}>
              <Link to={withParams(search, { modelo: activeModel === m ? '' : m })} className={activeModel === m ? 'is-on' : ''}>{m}</Link>
            </li>
          ))}
        </ul>
      </div>
      {brand.credit && <PhotoCredit credit={brand.credit} />}
    </section>
  );
}
