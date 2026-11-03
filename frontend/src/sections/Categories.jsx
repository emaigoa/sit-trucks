import React from 'react';
import Icon from '../components/Icon.jsx';
import Reveal from '../components/Reveal.jsx';
import PartSchematic from '../components/PartSchematic.jsx';
import { Link } from '../hooks/useRouter.jsx';
import { catalogUrl } from '../utils/catalogUrl.js';

export default function Categories({ categories = [], counts }) {
  if (!categories.length) return null;
  const total = (c) => counts?.find((x) => x.value === c)?.count;

  return (
    <section className="section categories" id="categorias">
      <div className="container">
        <Reveal className="categories__head">
          <p className="eyebrow"><span className="tick" /> Rubros</p>
          <h2 className="section-title">Buscá por<br /><em>sistema.</em></h2>
        </Reveal>
        <div className="categories__grid">
          {categories.map((c, i) => (
            <Reveal key={c} delay={i * 50} className="cat-tile-wrap">
              <Link className="cat-tile" to={catalogUrl({ categoria: c })}>
                <span className="cat-tile__num">{String(i + 1).padStart(2, '0')}</span>
                <PartSchematic category={c} className="cat-tile__art" />
                <span className="cat-tile__name">{c}</span>
                <span className="cat-tile__meta">{total(c) ? `${total(c)} publicados` : 'Consultar'} <Icon name="arrowUpRight" size={16} /></span>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
