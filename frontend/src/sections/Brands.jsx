import React from 'react';
import Icon from '../components/Icon.jsx';
import Reveal from '../components/Reveal.jsx';
import { useBusiness } from '../hooks/useBusiness.jsx';
import { Link } from '../hooks/useRouter.jsx';
import { catalogUrl } from '../utils/catalogUrl.js';

/** Marcas con foto real: cada tarjeta abre el catálogo filtrado por esa marca. */
export default function Brands({ counts }) {
  const b = useBusiness();
  const brands = b?.brands ?? [];
  if (!brands.length) return null;
  const total = (name) => counts?.find((c) => c.value === name)?.count;

  return (
    <section className="section brands" id="marcas">
      <div className="container">
        <Reveal className="brands__head">
          <p className="eyebrow"><span className="tick" /> Marcas</p>
          <h2 className="section-title">Multimarca,<br /><em>de liviano a pesado.</em></h2>
        </Reveal>
        <div className="brands__grid">
          {brands.map((brand, i) => (
            <Reveal key={brand.id} delay={i * 60} className={`brand-tile-wrap ${i < 2 ? 'is-big' : ''}`}>
              <Link className={`brand-tile ${brand.image ? '' : 'brand-tile--plain'}`} to={catalogUrl({ marca: brand.name })}>
                {brand.image && <img src={brand.image.replace('.webp', '-sm.webp')} alt="" loading="lazy" />}
                <span className="brand-tile__body">
                  <strong>{brand.name}</strong>
                  <small>{brand.models.slice(0, 4).join(' · ')}</small>
                </span>
                <span className="brand-tile__meta">{total(brand.name) ? `${total(brand.name)} repuestos` : 'Consultar'} <Icon name="arrowUpRight" size={16} /></span>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
