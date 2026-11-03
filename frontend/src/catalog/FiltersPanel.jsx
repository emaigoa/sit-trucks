import React, { useState } from 'react';
import Icon from '../components/Icon.jsx';
import { Link, useRouter } from '../hooks/useRouter.jsx';
import { withParams } from '../utils/catalogUrl.js';

const VISIBLE = 8;

/** Grupo de filtro con "Mostrar más" (como en ML, se ven los 8 con más resultados). */
function FacetGroup({ title, param, options }) {
  const { search } = useRouter();
  const [expanded, setExpanded] = useState(false);
  if (!options?.length) return null;
  const shown = expanded ? options : options.slice(0, VISIBLE);
  return (
    <section className="facet">
      <h3>{title}</h3>
      <ul>
        {shown.map((o) => (
          <li key={o.value}><Link to={withParams(search, { [param]: o.value })}>{o.value} <span>({o.count})</span></Link></li>
        ))}
      </ul>
      {options.length > VISIBLE && (
        <button type="button" className="facet__more" onClick={() => setExpanded(!expanded)}>{expanded ? 'Mostrar menos' : 'Mostrar más'}</button>
      )}
    </section>
  );
}

/** Interruptor "Despacho en el día" (equivalente al "Llegan hoy" de ML). */
function DispatchToggle({ active, count, dispatch }) {
  const { search } = useRouter();
  return (
    <Link className={`ship-toggle ${active ? 'is-on' : ''}`} to={withParams(search, { hoy: active ? '' : '1' })} role="switch" aria-checked={active}>
      <span className="ship-toggle__text">
        <strong><Icon name="send" size={14} /> Despacho en el día</strong>
        <small>{dispatch?.today ? `Pedí antes de las ${dispatch.cutoff}` : 'Solo repuestos con stock'}{!active && ` · ${count}`}</small>
      </span>
      <span className="ship-toggle__switch" aria-hidden="true"><i /></span>
    </Link>
  );
}

export default function FiltersPanel({ data, dispatch }) {
  const { facets, query } = data;
  return (
    <div className="filters">
      <DispatchToggle active={query.hoy} count={facets.hoy} dispatch={dispatch} />
      <FacetGroup title="Categorías" param="categoria" options={facets.categoria} />
      <FacetGroup title="Marca del camión" param="marca" options={facets.marca} />
      <FacetGroup title={`Modelo ${query.marca}`} param="modelo" options={facets.modelo} />
      <FacetGroup title="Marca del repuesto" param="fabricante" options={facets.fabricante} />
      <FacetGroup title="Tipo de repuesto" param="tipo" options={facets.tipo} />
    </div>
  );
}
