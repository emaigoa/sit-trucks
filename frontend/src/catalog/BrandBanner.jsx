import React from 'react';
import { Link, useRouter } from '../hooks/useRouter.jsx';
import { withParams } from '../utils/catalogUrl.js';
import PhotoCredit from '../components/PhotoCredit.jsx';

/** Banner de marca (como las "tiendas oficiales" de ML) con foto real y accesos por modelo. */
export default function BrandBanner({ brand, activeModel }) {
  const { search } = useRouter();
  const shot = brand.gallery?.find((g) => g.model === activeModel) || { image: brand.image, credit: brand.credit };
  const sm = (src) => src.replace('.webp', '-sm.webp');
  return (
    <section className={`brand-banner ${brand.image ? '' : 'brand-banner--plain'}`}>
      {shot.image && <img key={shot.image} src={sm(shot.image)} srcSet={`${sm(shot.image)} 720w, ${shot.image} 1600w`} sizes="(max-width: 900px) 100vw, 1240px" alt={`Camión ${brand.name} ${activeModel || ''}`.trim()} />}
      <div className="brand-banner__copy">
        <p className="eyebrow"><span className="tick" /> Repuestos para</p>
        <h2>{brand.name}{activeModel && <span> {activeModel}</span>}</h2>
        <p>{brand.claim}</p>
        <ul>
          {brand.models.map((m) => (
            <li key={m}>
              <Link to={withParams(search, { modelo: activeModel === m ? '' : m })} className={activeModel === m ? 'is-on' : ''}>{m}</Link>
            </li>
          ))}
        </ul>
      </div>
      {shot.credit && <PhotoCredit credit={shot.credit} />}
    </section>
  );
}
