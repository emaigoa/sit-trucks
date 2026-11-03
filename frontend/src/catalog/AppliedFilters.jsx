import React from 'react';
import Icon from '../components/Icon.jsx';
import { Link, useRouter } from '../hooks/useRouter.jsx';
import { withParams } from '../utils/catalogUrl.js';

/** Filtros aplicados como chips removibles + "Limpiar filtros". */
export default function AppliedFilters() {
  const { params, search } = useRouter();
  const get = (k) => params.get(k) || '';
  const chips = [];
  const add = (label, patch) => chips.push({ label, to: withParams(search, patch) });

  if (get('q')) add(`“${get('q')}”`, { q: '' });
  if (get('categoria')) add(get('categoria'), { categoria: '' });
  if (get('marca')) add(get('marca'), { marca: '', modelo: '', anio: '' });
  if (get('modelo')) add(`Modelo ${get('modelo')}`, { modelo: '' });
  if (get('anio')) add(`Año ${get('anio')}`, { anio: '' });
  if (get('fabricante')) add(get('fabricante'), { fabricante: '' });
  if (get('tipo')) add(get('tipo'), { tipo: '' });
  if (get('hoy') === '1') add('Despacho en el día', { hoy: '' });
  if (!chips.length) return null;

  const keep = new URLSearchParams();
  for (const k of ['orden', 'vista']) if (get(k)) keep.set(k, get(k));

  return (
    <div className="applied">
      <ul>
        {chips.map((c) => (
          <li key={c.label}><Link to={c.to} aria-label={`Quitar filtro ${c.label}`}>{c.label} <Icon name="close" size={12} stroke={2.4} /></Link></li>
        ))}
      </ul>
      {chips.length > 1 && <Link className="applied__clear" to={`/catalogo${keep.toString() ? `?${keep}` : ''}`}>Limpiar filtros</Link>}
    </div>
  );
}
