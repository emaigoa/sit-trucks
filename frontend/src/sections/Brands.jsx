import React from 'react';
import Icon from '../components/Icon.jsx';
import Reveal from '../components/Reveal.jsx';
import { useBusiness } from '../hooks/useBusiness.jsx';
import { Link } from '../hooks/useRouter.jsx';
import { catalogUrl } from '../utils/catalogUrl.js';

const sm = (src) => src.replace('.webp', '-sm.webp');

/**
 * Sitio monomarca: tarjetas por modelo (con foto real si está en la galería).
 * Con varias marcas: tarjetas por marca.
 */
export default function Brands({ counts, modelCounts }) {
  const b = useBusiness();
  const brands = b?.brands ?? [];
  if (!brands.length) return null;
  const single = brands.length === 1 ? brands[0] : null;

  const tiles = single
    ? single.models.map((m) => ({
      key: m,
      title: m,
      kicker: single.name,
      image: single.gallery?.find((g) => g.model === m)?.image,
      to: catalogUrl({ modelo: m }),
      total: modelCounts?.find((c) => c.value === m)?.count,
    }))
    : brands.map((x) => ({
      key: x.id,
      title: x.name,
      sub: x.models.slice(0, 4).join(' · '),
      image: x.image,
      to: catalogUrl({ marca: x.name }),
      total: counts?.find((c) => c.value === x.name)?.count,
    }));
  // Primero los que tienen foto: quedan arriba y en grande.
  tiles.sort((x, y) => Number(Boolean(y.image)) - Number(Boolean(x.image)));
  const big = single ? 0 : Math.min(2, tiles.filter((t) => t.image).length);

  return (
    <section className="section brands" id={single ? 'modelos' : 'marcas'}>
      <div className="container">
        <Reveal className="brands__head">
          <p className="eyebrow"><span className="tick" /> {single ? `Modelos ${single.name}` : 'Marcas'}</p>
          <h2 className="section-title">{single ? <>Toda la línea,<br /><em>de la Daily al Stralis.</em></> : <>Multimarca,<br /><em>de liviano a pesado.</em></>}</h2>
        </Reveal>
        <div className={`brands__grid ${single ? 'brands__grid--models' : ''}`}>
          {tiles.map((t, i) => (
            <Reveal key={t.key} delay={i * 60} className={`brand-tile-wrap ${i < big ? 'is-big' : ''}`}>
              <Link className={`brand-tile ${t.image ? '' : 'brand-tile--plain'}`} to={t.to}>
                {t.image && <img src={sm(t.image)} alt="" loading="lazy" />}
                <span className="brand-tile__body">
                  {t.kicker && <small className="brand-tile__kicker">{t.kicker}</small>}
                  <strong>{t.title}</strong>
                  {t.sub && <small>{t.sub}</small>}
                </span>
                <span className="brand-tile__meta">{t.total ? `${t.total} repuestos` : 'Consultar'} <Icon name="arrowUpRight" size={16} /></span>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
