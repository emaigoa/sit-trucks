import React, { useEffect, useMemo, useState } from 'react';
import Icon from '../components/Icon.jsx';
import FiltersPanel from '../catalog/FiltersPanel.jsx';
import AppliedFilters from '../catalog/AppliedFilters.jsx';
import ResultItem from '../catalog/ResultItem.jsx';
import Pagination from '../catalog/Pagination.jsx';
import BrandBanner from '../catalog/BrandBanner.jsx';
import { useAsync } from '../hooks/useAsync.js';
import { useBusiness } from '../hooks/useBusiness.jsx';
import { useDispatch } from '../hooks/useDispatch.js';
import { Link, useRouter } from '../hooks/useRouter.jsx';
import { useVehicle } from '../hooks/useVehicle.jsx';
import { api } from '../services/api.js';
import { buildMessage, whatsappLink } from '../utils/business.js';
import { withParams } from '../utils/catalogUrl.js';
import { plural } from '../utils/format.js';

const SORT_LABELS = { relevancia: 'Más relevantes', nuevos: 'Más recientes', nombre: 'Nombre (A-Z)' };
const API_KEYS = ['q', 'categoria', 'marca', 'modelo', 'fabricante', 'tipo', 'hoy', 'orden', 'pagina'];

function useDocumentTitle(title) {
  useEffect(() => {
    const previous = document.title;
    document.title = `${title} · Servicios Integrales Trucks`;
    return () => { document.title = previous; };
  }, [title]);
}

export default function CatalogPage() {
  const business = useBusiness();
  const dispatch = useDispatch(business?.dispatch);
  const { params, search, navigate } = useRouter();
  const { setVehicle } = useVehicle();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const apiParams = useMemo(() => {
    const out = { porPagina: 24 };
    for (const k of API_KEYS) if (params.get(k)) out[k] = params.get(k);
    return out;
  }, [params]);
  const key = JSON.stringify(apiParams);
  const { data, loading, error, reload } = useAsync((opts) => api.search(apiParams, opts), [key]);

  const view = params.get('vista') === 'grilla' ? 'grid' : 'list';
  const sort = params.get('orden') || 'relevancia';
  const q = params.get('q') || '';
  const marca = params.get('marca') || '';
  const modelo = params.get('modelo') || '';
  const anio = params.get('anio') || '';
  const categoria = params.get('categoria') || '';

  // El camión de los filtros pasa a ser "el camión del visitante" para los mensajes de WhatsApp.
  useEffect(() => { if (marca) setVehicle({ brand: marca, model: modelo, year: anio }); }, [marca, modelo, anio, setVehicle]);
  useEffect(() => { setFiltersOpen(false); }, [search]);
  useEffect(() => {
    document.body.style.overflow = filtersOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [filtersOpen]);

  const heading = q ? q.charAt(0).toUpperCase() + q.slice(1) : [categoria || 'Repuestos', marca && `para ${[marca, modelo, anio].filter(Boolean).join(' ')}`].filter(Boolean).join(' ');
  useDocumentTitle(heading);

  const brand = business?.brands?.find((b) => b.name === marca);
  const activeCount = ['q', 'categoria', 'marca', 'fabricante', 'tipo', 'hoy'].filter((k) => params.get(k)).length;
  const askWa = whatsappLink(business, buildMessage({ vehicle: { brand: marca, model: modelo, year: anio }, extra: q ? `Busco: ${q}.` : categoria ? `Busco repuestos de ${categoria.toLowerCase()}.` : '' }));

  return (
    <div className="catalog-page">
      <div className="container">
        <nav className="crumbs" aria-label="Ruta">
          <Link to="/">Inicio</Link>
          <span>›</span>
          <Link to="/catalogo">Catálogo</Link>
          {marca && <><span>›</span><Link to={withParams('', { marca })}>{marca}</Link></>}
          {categoria && <><span>›</span><span aria-current="page">{categoria}</span></>}
        </nav>

        {brand && <BrandBanner brand={brand} activeModel={modelo} />}

        <div className="catalog-layout">
          <aside className={`catalog-side ${filtersOpen ? 'is-open' : ''}`} aria-label="Filtros">
            <div className="catalog-side__sheet">
              <header className="catalog-side__head">
                <strong>Filtrar</strong>
                <button onClick={() => setFiltersOpen(false)} aria-label="Cerrar filtros"><Icon name="close" /></button>
              </header>
              <div className="catalog-side__intro">
                <h1>{heading}</h1>
                <p>{data ? plural(data.total, 'resultado', 'resultados') : '…'}</p>
              </div>
              <AppliedFilters />
              {data && <FiltersPanel data={data} dispatch={dispatch} />}
            </div>
          </aside>

          <section className="catalog-results" aria-live="polite" aria-busy={loading}>
            <div className="results-bar">
              <button className="results-bar__filter" onClick={() => setFiltersOpen(true)}>
                <Icon name="menu" size={16} /> Filtrar{activeCount > 0 && <span>{activeCount}</span>}
              </button>
              <p className="results-bar__count">{data ? plural(data.total, 'resultado', 'resultados') : ''}</p>
              <label className="sort">
                <span>Ordenar por</span>
                <select value={sort} onChange={(e) => navigate(withParams(search, { orden: e.target.value === 'relevancia' ? '' : e.target.value }))}>
                  {Object.entries(SORT_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
              <div className="view-toggle" role="group" aria-label="Vista">
                <Link to={withParams(search, { vista: '', pagina: params.get('pagina') || '' })} keepScroll replace aria-pressed={view === 'list'} aria-label="Ver como lista" className={view === 'list' ? 'is-on' : ''}>
                  <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="2" /></svg>
                </Link>
                <Link to={withParams(search, { vista: 'grilla', pagina: params.get('pagina') || '' })} keepScroll replace aria-pressed={view === 'grid'} aria-label="Ver como grilla" className={view === 'grid' ? 'is-on' : ''}>
                  <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path d="M3 3h6v6H3zM11 3h6v6h-6zM3 11h6v6H3zM11 11h6v6h-6z" fill="currentColor" /></svg>
                </Link>
              </div>
            </div>

            {error && (
              <div className="results-empty">
                <strong>No pudimos cargar el catálogo</strong>
                <p>Revisá tu conexión e intentá de nuevo.</p>
                <button className="btn btn--accent btn--sm" onClick={reload}>Reintentar</button>
              </div>
            )}

            {!data && !error && (
              <div className={`results results--${view}`}>{Array.from({ length: 6 }, (_, i) => <div key={i} className={`result result--${view} result--skeleton`} />)}</div>
            )}

            {data && data.total > 0 && (
              <>
                <div className={`results results--${view} ${loading ? 'is-loading' : ''}`} key={`${key}-${view}`}>
                  {data.items.map((p, i) => <ResultItem key={p.id} product={p} dispatch={dispatch} view={view} index={i} />)}
                </div>
                <Pagination page={data.page} pages={data.pages} />
                <p className="results-note">¿No encontrás la pieza? No todo el stock está publicado. {askWa && <a href={askWa} target="_blank" rel="noreferrer">Consultanos por WhatsApp</a>}</p>
              </>
            )}

            {data && data.total === 0 && (
              <div className="results-empty">
                <Icon name="search" size={28} />
                <strong>No hay publicaciones que coincidan con tu búsqueda.</strong>
                <ul>
                  <li>Revisá la ortografía o probá con el código OEM.</li>
                  <li>Usá palabras más genéricas o quitá algún filtro.</li>
                  <li>Puede que lo tengamos en depósito: consultanos y te confirmamos.</li>
                </ul>
                <div className="results-empty__actions">
                  {askWa && <a className="btn btn--accent btn--sm" href={askWa} target="_blank" rel="noreferrer"><Icon name="whatsapp" size={16} /> Consultar por WhatsApp</a>}
                  <Link className="btn btn--ghost btn--sm" to="/catalogo">Ver todo el catálogo</Link>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
      {filtersOpen && <button className="catalog-scrim" aria-label="Cerrar filtros" onClick={() => setFiltersOpen(false)} />}
    </div>
  );
}
