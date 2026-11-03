import React, { useEffect, useRef } from 'react';
import Icon from '../components/Icon.jsx';
import Carousel from '../components/Carousel.jsx';
import InquiryForm from '../components/InquiryForm.jsx';
import AskButton from '../catalog/AskButton.jsx';
import ProductImage from '../catalog/ProductImage.jsx';
import ResultItem from '../catalog/ResultItem.jsx';
import { useAsync } from '../hooks/useAsync.js';
import { useBusiness } from '../hooks/useBusiness.jsx';
import { useDispatch } from '../hooks/useDispatch.js';
import { Link } from '../hooks/useRouter.jsx';
import { useVehicle } from '../hooks/useVehicle.jsx';
import { api } from '../services/api.js';
import { buildMessage } from '../utils/business.js';
import { catalogUrl } from '../utils/catalogUrl.js';
import { stockInfo } from '../utils/stock.js';
import { fitsVehicle, vehicleLabel } from '../utils/vehicle.js';
import NotFound from './NotFound.jsx';

/** Zoom tipo lupa siguiendo el puntero (solo mouse). */
function Gallery({ product }) {
  const ref = useRef(null);
  const move = (e) => {
    if (e.pointerType !== 'mouse' || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    ref.current.style.setProperty('--zx', `${((e.clientX - r.left) / r.width) * 100}%`);
    ref.current.style.setProperty('--zy', `${((e.clientY - r.top) / r.height) * 100}%`);
  };
  return (
    <div className="pdp-gallery" ref={ref} onPointerMove={move}>
      <ProductImage product={product} large />
    </div>
  );
}

/** Agrupa "IVECO Tector", "IVECO Cursor" → { IVECO: [Tector, Cursor] } */
function groupCompat(list, brandNames) {
  const out = new Map();
  for (const entry of list || []) {
    const brand = brandNames.find((b) => entry === b || entry.startsWith(`${b} `)) || entry.split(' ')[0];
    const model = entry.slice(brand.length).trim();
    if (!out.has(brand)) out.set(brand, []);
    if (model) out.get(brand).push(model);
  }
  return [...out];
}

export default function ProductPage({ id }) {
  const business = useBusiness();
  const dispatch = useDispatch(business?.dispatch);
  const { vehicle } = useVehicle();
  const { data: product, loading, error } = useAsync((opts) => api.product(id, opts), [id]);

  useEffect(() => {
    if (!product) return undefined;
    const previous = document.title;
    document.title = `${product.name} · Servicios Integrales Trucks`;
    return () => { document.title = previous; };
  }, [product]);

  if (error?.status === 404) return <NotFound />;
  if (error) return <div className="container pdp-state"><p>No pudimos cargar el repuesto.</p></div>;
  if (loading || !product) return <div className="container pdp-state"><div className="pdp-skeleton" /></div>;

  const stock = stockInfo(product.stock);
  const inStock = product.stock > 0;
  const message = buildMessage({ product, vehicle });
  const brandNames = (business?.brands || []).map((b) => b.name).sort((a, b) => b.length - a.length);
  const compat = groupCompat(product.compatibility, brandNames);
  const vLabel = vehicleLabel(vehicle);
  const fits = vehicle.brand ? fitsVehicle(product, vehicle) : null;

  const specs = [
    ['Categoría', product.category],
    ['Marca del repuesto', product.manufacturer || '—'],
    ['Tipo', product.origin || 'Alternativo'],
    ['Condición', 'Nuevo'],
    ['Código interno', product.code],
    ['Código OEM', product.oemCode || '—'],
  ];

  return (
    <div className="pdp">
      <div className="container">
        <nav className="crumbs" aria-label="Ruta">
          <Link to="/">Inicio</Link><span>›</span>
          <Link to="/catalogo">Catálogo</Link><span>›</span>
          <Link to={catalogUrl({ categoria: product.category })}>{product.category}</Link>
        </nav>

        <div className="pdp-main">
          <Gallery product={product} />

          <div className="pdp-buy">
            <p className="pdp-buy__meta">Nuevo · {product.origin || 'Alternativo'}{product.manufacturer && <> · <Link to={catalogUrl({ fabricante: product.manufacturer })}>{product.manufacturer}</Link></>}</p>
            <h1>{product.name}</h1>
            <p className="pdp-buy__code">Código {product.code}{product.oemCode && <> · OEM <strong>{product.oemCode}</strong></>}</p>

            <div className="pdp-buy__price">
              <strong>Precio a consultar</strong>
              <p>Te respondemos precio y stock al momento por WhatsApp, con todos los medios de pago.</p>
            </div>

            <div className="pdp-box">
              {inStock ? (
                <p className="pdp-box__ship is-ok"><Icon name="send" size={16} /> {dispatch?.today ? <><strong>Despacho hoy</strong> si confirmás antes de las {dispatch.cutoff}</> : <><strong>Despacho {dispatch?.short || 'en el día'}</strong></>}</p>
              ) : (
                <p className="pdp-box__ship"><Icon name="clock" size={16} /> <strong>A pedido</strong> · consultá la demora</p>
              )}
              <p className={`pdp-box__stock is-${stock.tone}`}>{inStock ? (product.stock <= 5 ? '¡Últimas unidades disponibles!' : 'Stock disponible') : 'Sin stock en mostrador'}</p>
              {fits !== null && (
                <p className={`pdp-box__fit ${fits ? 'is-ok' : 'is-warn'}`}>
                  <Icon name={fits ? 'check' : 'search'} size={15} stroke={2.4} />
                  {fits ? <>Compatible con tu <strong>{vLabel}</strong></> : <>No figura para tu {vLabel}: consultanos y lo verificamos</>}
                </p>
              )}
<AskButton product={product} size="lg" block label="Consultar precio por WhatsApp" />
              {business && <a className="btn btn--outline btn--block" href={`tel:${business.phone.tel}`}><Icon name="phone" size={17} /> Llamar al {business.phone.display}</a>}
            </div>

            {business?.payments?.length > 0 && (
              <div className="pdp-pay">
                <h2>Medios de pago</h2>
                <ul>{business.payments.map((p) => <li key={p}>{p}</li>)}</ul>
              </div>
            )}

            {business && (
              <div className="pdp-seller">
                <Icon name="pin" size={16} />
                <p><strong>{business.name}</strong><span>{business.address.street}, {business.address.city} · {business.rating.value.toFixed(1).replace('.', ',')} ★ en Google</span></p>
              </div>
            )}
          </div>
        </div>

        <div className="pdp-details">
          {compat.length > 0 && (
            <section className="pdp-section">
              <h2>Compatibilidad</h2>
              <table className="spec-table">
                <thead><tr><th>Marca</th><th>Modelos</th></tr></thead>
                <tbody>
                  {compat.map(([brand, models]) => (
                    <tr key={brand}>
                      <th><Link to={catalogUrl({ marca: brand })}>{brand}</Link></th>
                      <td>{models.length ? models.map((m, i) => <React.Fragment key={m}>{i > 0 && ', '}<Link to={catalogUrl({ marca: brand, modelo: m })}>{m}</Link></React.Fragment>) : 'Toda la línea (confirmar año)'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          <section className="pdp-section">
            <h2>Características</h2>
            <table className="spec-table spec-table--two">
              <tbody>{specs.map(([k, v]) => <tr key={k}><th>{k}</th><td>{v}</td></tr>)}</tbody>
            </table>
          </section>

          <section className="pdp-section">
            <h2>Descripción</h2>
            <p className="pdp-desc">{product.detail}{product.detail && '. '}{product.description}</p>
            <details className="pdp-form">
              <summary>Dejanos tu consulta y te llamamos</summary>
              <InquiryForm compact productCode={product.code} initialMessage={message} initialVehicle={vehicle} />
            </details>
          </section>
        </div>
      </div>

      {product.related?.length > 0 && (
        <section className="pdp-related">
          <div className="container"><h2>Productos relacionados</h2></div>
          <Carousel label="Productos relacionados">
            {product.related.map((p, i) => <div className="carousel__item" key={p.id}><ResultItem product={p} dispatch={dispatch} view="grid" index={i} /></div>)}
          </Carousel>
        </section>
      )}
    </div>
  );
}
