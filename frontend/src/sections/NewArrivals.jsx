import React from 'react';
import Icon from '../components/Icon.jsx';
import Reveal from '../components/Reveal.jsx';
import Carousel from '../components/Carousel.jsx';
import ResultItem from '../catalog/ResultItem.jsx';
import { useAsync } from '../hooks/useAsync.js';
import { useBusiness } from '../hooks/useBusiness.jsx';
import { useDispatch } from '../hooks/useDispatch.js';
import { Link } from '../hooks/useRouter.jsx';
import { api } from '../services/api.js';
import { catalogUrl } from '../utils/catalogUrl.js';

/** Últimos repuestos cargados con stock (los más recientes del catálogo). */
export default function NewArrivals() {
  const business = useBusiness();
  const dispatch = useDispatch(business?.dispatch);
  const { data } = useAsync((opts) => api.search({ orden: 'nuevos', hoy: 1, porPagina: 12 }, opts), []);
  const items = data?.items ?? [];
  if (items.length < 3) return null;

  return (
    <section className="section arrivals" id="novedades">
      <div className="container arrivals__head">
        <Reveal>
          <p className="eyebrow"><span className="tick" /> Novedades</p>
          <h2 className="section-title">Recién<br /><em>ingresados.</em></h2>
        </Reveal>
        <Link className="arrivals__all" to={catalogUrl({ orden: 'nuevos' })}>Ver todos <Icon name="arrow" size={16} /></Link>
      </div>
      <Carousel label="Repuestos recién ingresados">
        {items.map((p, i) => <div className="carousel__item" key={p.id}><ResultItem product={p} dispatch={dispatch} view="grid" index={i} /></div>)}
      </Carousel>
    </section>
  );
}
