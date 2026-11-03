import React, { useEffect, useState } from 'react';
import Brand from './Brand.jsx';
import Icon from './Icon.jsx';
import OpenBadge from './OpenBadge.jsx';
import { useBusiness } from '../hooks/useBusiness.jsx';
import { Link, useRouter } from '../hooks/useRouter.jsx';
import { whatsappLink } from '../utils/business.js';
import { withParams } from '../utils/catalogUrl.js';

const links = [
  { to: '/catalogo', label: 'Catálogo' },
  { to: '/#buscador', label: 'Tu camión' },
  { to: '/#marcas', label: 'Marcas' },
  { to: '/#como-trabajamos', label: 'Cómo trabajamos' },
  { to: '/#ubicacion', label: 'Ubicación' },
];

/** Buscador global (como la barra de Mercado Libre): siempre lleva al catálogo con la búsqueda aplicada. */
function HeaderSearch({ onDone }) {
  const { path, params, search, navigate } = useRouter();
  const current = path === '/catalogo' ? params.get('q') || '' : '';
  const [value, setValue] = useState(current);
  useEffect(() => setValue(current), [current]);

  const submit = (event) => {
    event.preventDefault();
    const q = value.trim();
    // Dentro del catálogo se conservan los filtros activos; desde otra página se arranca de cero.
    navigate(path === '/catalogo' ? withParams(search, { q }) : withParams('', { q }));
    event.currentTarget.querySelector('input')?.blur();
    onDone?.();
  };

  return (
    <form className="header-search" role="search" onSubmit={submit}>
      <input value={value} onChange={(e) => setValue(e.target.value)} placeholder="Buscar repuesto, código u OEM…" aria-label="Buscar repuestos" enterKeyHint="search" />
      <button aria-label="Buscar"><Icon name="search" size={18} /></button>
    </form>
  );
}

export default function Header() {
  const business = useBusiness();
  const { path } = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const solid = path !== '/';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => setOpen(false), [path]);

  const wa = whatsappLink(business, 'Hola, quería consultar por un repuesto.');

  return (
    <header className={`site-header ${scrolled || solid ? 'is-scrolled' : ''} ${open ? 'is-open' : ''}`}>
      <div className="site-header__inner container">
        <Brand />
        <div className="site-header__search site-header__search--wide"><HeaderSearch /></div>
        <div className="site-header__actions">
          <OpenBadge className="hide-sm" />
          {wa && <a className="btn btn--accent btn--sm" href={wa} target="_blank" rel="noreferrer"><Icon name="whatsapp" size={17} /> <span className="hide-sm">Consultar</span></a>}
          <button className="menu-toggle" onClick={() => setOpen(!open)} aria-expanded={open} aria-label={open ? 'Cerrar menú' : 'Abrir menú'}>
            <Icon name={open ? 'close' : 'menu'} size={22} />
          </button>
        </div>
      </div>
      <div className="site-header__sub container">
        <nav className="site-nav" aria-label="Principal">
          {links.map((l) => (
            <Link key={l.to} to={l.to} className={l.to === path ? 'is-active' : ''} onClick={() => setOpen(false)}>{l.label}</Link>
          ))}
        </nav>
        <div className="site-header__search site-header__search--narrow"><HeaderSearch /></div>
      </div>
    </header>
  );
}
