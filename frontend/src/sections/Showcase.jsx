import React from 'react';
import Icon from '../components/Icon.jsx';
import Slider from '../components/Slider.jsx';
import DispatchBadge from '../components/DispatchBadge.jsx';
import PhotoCredit from '../components/PhotoCredit.jsx';
import { useBusiness } from '../hooks/useBusiness.jsx';
import { Link } from '../hooks/useRouter.jsx';
import { whatsappLink } from '../utils/business.js';
import { catalogUrl } from '../utils/catalogUrl.js';

const sm = (src) => src.replace('.webp', '-sm.webp');

/** Slide de marca con foto real a sangre y degradado para leer el texto. */
function BrandSlide({ brand, index }) {
  return (
    <article className="slide slide--photo">
      <img className="slide__photo" src={sm(brand.image)} srcSet={`${sm(brand.image)} 720w, ${brand.image} 1600w`} sizes="100vw" alt="" loading={index ? 'lazy' : 'eager'} />
      <div className="container slide__inner">
        <div className="slide__copy">
          <p className="slide__kicker"><span>{String(index + 1).padStart(2, '0')}</span> Repuestos para</p>
          <h2 className="slide__title">{brand.name}</h2>
          <p className="slide__text">{brand.claim}. Te confirmamos compatibilidad con el modelo y año de tu unidad.</p>
          <ul className="slide__chips">
            {brand.models.slice(0, 8).map((m) => <li key={m}><Link to={catalogUrl({ marca: brand.name, modelo: m })}>{m}</Link></li>)}
          </ul>
          <Link className="btn btn--accent btn--lg slide__cta" to={catalogUrl({ marca: brand.name })}>Ver repuestos {brand.name} <Icon name="arrow" size={18} /></Link>
        </div>
      </div>
      <PhotoCredit credit={brand.credit} className="slide__credit" />
    </article>
  );
}

/** Slide de modelos: mosaico con fotos reales de cada modelo de la marca. */
function ModelsSlide({ brand, index }) {
  // Primero los modelos con foto propia; el de la foto principal va al final.
  const shots = [...(brand.gallery || [])].filter((g) => g.image).sort((a, b) => Number(a.image === brand.image) - Number(b.image === brand.image)).slice(0, 4);
  return (
    <article className="slide slide--dark">
      <div className="container slide__inner">
        <div className="slide__copy">
          <p className="slide__kicker"><span>{String(index + 1).padStart(2, '0')}</span> Modelos {brand.name}</p>
          <h2 className="slide__title">De la Daily<br />al Stralis</h2>
          <p className="slide__text">Repuestos para {brand.models.join(', ')}. Si no lo ves publicado, lo conseguimos.</p>
          <Link className="btn btn--accent btn--lg slide__cta" to={catalogUrl({})}>Ver todo el catálogo <Icon name="arrow" size={18} /></Link>
        </div>
        <div className="slide__mosaic">
          {shots.map((g, i) => (
            <Link key={g.model} to={catalogUrl({ modelo: g.model })} className="mosaic-tile" style={{ '--i': i }}>
              <img src={sm(g.image)} alt="" loading="lazy" />
              <span>{brand.name} {g.model}</span>
            </Link>
          ))}
        </div>
      </div>
    </article>
  );
}

/** Slide "multimarca": mosaico con el resto de las marcas (solo si se cargan varias marcas). */
function MultiBrandSlide({ brands, index }) {
  return (
    <article className="slide slide--dark">
      <div className="container slide__inner">
        <div className="slide__copy">
          <p className="slide__kicker"><span>{String(index + 1).padStart(2, '0')}</span> Multimarca</p>
          <h2 className="slide__title">Y también<br />{brands.length} marcas más</h2>
          <p className="slide__text">Trabajamos repuestos para {brands.map((b) => b.name).join(', ')}.</p>
          <Link className="btn btn--accent btn--lg slide__cta" to="/catalogo">Ver todo el catálogo <Icon name="arrow" size={18} /></Link>
        </div>
      </div>
    </article>
  );
}

function DispatchSlide({ business, index }) {
  const wa = whatsappLink(business, 'Hola, quería hacer un pedido para despacho en el día.');
  const cut = business.dispatch?.cutoffs || {};
  return (
    <article className="slide slide--accent">
      <div className="container slide__inner">
        <div className="slide__copy">
          <p className="slide__kicker"><span>{String(index + 1).padStart(2, '0')}</span> Logística</p>
          <h2 className="slide__title">Despacho<br />en el día</h2>
          <p className="slide__text">Confirmás el pedido antes del corte y sale hoy mismo. Lunes a viernes hasta las {cut[1] || '16:00'} · sábados hasta las {cut[6] || '11:00'}.</p>
          <DispatchBadge className="slide__dispatch" />
          {wa && <a className="btn btn--dark btn--lg slide__cta" href={wa} target="_blank" rel="noreferrer"><Icon name="whatsapp" size={18} /> Hacer un pedido</a>}
        </div>
        <div className="slide__art slide__art--road" aria-hidden="true">
          <svg viewBox="0 0 400 260" className="truck-art">
            <g className="truck-art__body">
              <rect x="40" y="70" width="200" height="110" rx="6" />
              <path d="M240 110h70l40 40v30H240z" />
              <path d="M262 118h40l26 28h-66z" className="thin" />
              <circle cx="95" cy="190" r="22" /><circle cx="95" cy="190" r="8" className="thin" />
              <circle cx="300" cy="190" r="22" /><circle cx="300" cy="190" r="8" className="thin" />
              <path d="M60 95h60M60 115h90M60 135h40" className="thin" />
            </g>
            <g className="truck-art__speed"><path d="M0 100h28M8 130h22M0 160h30" /></g>
            <path d="M0 214h400" className="truck-art__road" />
          </svg>
        </div>
      </div>
    </article>
  );
}

function PaymentsSlide({ business, index }) {
  return (
    <article className="slide slide--paper">
      <div className="container slide__inner">
        <div className="slide__copy">
          <p className="slide__kicker"><span>{String(index + 1).padStart(2, '0')}</span> Pagos</p>
          <h2 className="slide__title">Todos los<br />medios de pago</h2>
          <p className="slide__text">Pagás como te quede más cómodo, en el mostrador o a distancia.</p>
          <Link className="btn btn--accent btn--lg slide__cta" to="/catalogo">Ver catálogo <Icon name="arrow" size={18} /></Link>
        </div>
        <div className="slide__art slide__art--pay" aria-hidden="true">
          {business.payments.map((p, i) => <span key={p} className="pay-card" style={{ '--i': i }}>{p}</span>)}
        </div>
      </div>
    </article>
  );
}

export default function Showcase() {
  const b = useBusiness();
  if (!b?.brands?.length) return null;
  const featured = b.brands.filter((x) => x.image).slice(0, 2);
  const rest = b.brands.filter((x) => !featured.includes(x));
  const single = b.brands.length === 1 ? b.brands[0] : null;
  const slides = [
    ...featured.map((brand) => (i) => <BrandSlide key={brand.id} brand={brand} index={i} />),
    ...(single?.gallery?.length > 1 ? [(i) => <ModelsSlide key="models" brand={single} index={i} />] : []),
    ...(rest.length ? [(i) => <MultiBrandSlide key="multi" brands={rest} index={i} />] : []),
    (i) => <DispatchSlide key="dispatch" business={b} index={i} />,
    ...(b.payments?.length ? [(i) => <PaymentsSlide key="pay" business={b} index={i} />] : []),
  ];
  return (
    <section className="showcase" aria-label="Destacados">
      <Slider label="Destacados" interval={7000}>{slides.map((render, i) => render(i))}</Slider>
    </section>
  );
}
