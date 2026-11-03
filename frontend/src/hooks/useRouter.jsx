import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

/**
 * Router mínimo sobre la History API (sin dependencias).
 * Rutas: "/", "/catalogo?…", "/producto/:id", "/admin".
 * Los links a "/#seccion" desde otra página vuelven a la home y bajan a la sección.
 */
const RouterContext = createContext(null);

// Base del sitio ("" en local, "/sit-trucks" en GitHub Pages). Las rutas de la app no la incluyen.
export const BASE = import.meta.env.BASE_URL.replace(/\/+$/, '');
export const href = (to) => (to.startsWith('/') ? `${BASE}${to}` : to);

const read = () => {
  let path = window.location.pathname;
  if (BASE && path.startsWith(BASE)) path = path.slice(BASE.length);
  return { path: path.replace(/\/+$/, '') || '/', search: window.location.search, hash: window.location.hash };
};

function scrollToHash(hash) {
  if (!hash || hash.length < 2) return false;
  let tries = 0;
  const attempt = () => {
    const el = document.getElementById(decodeURIComponent(hash.slice(1)));
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    else if (tries++ < 20) setTimeout(attempt, 50); // la sección puede tardar un render en aparecer
  };
  requestAnimationFrame(attempt);
  return true;
}

export function RouterProvider({ children }) {
  const [location, setLocation] = useState(read);

  useEffect(() => {
    // Compatibilidad con el enlace viejo "#/admin".
    if (window.location.hash.startsWith('#/admin')) window.history.replaceState(null, '', href('/admin'));
    else scrollToHash(window.location.hash); // entrada directa a "/#seccion"
    const onPop = () => setLocation(read());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const navigate = useCallback((to, { replace = false, keepScroll = false } = {}) => {
    const url = new URL(href(to), window.location.origin);
    const samePage = url.pathname === window.location.pathname;
    window.history[replace ? 'replaceState' : 'pushState'](null, '', url.pathname + url.search + url.hash);
    setLocation(read());
    if (scrollToHash(url.hash)) return;
    if (!keepScroll && !(samePage && replace)) window.scrollTo({ top: 0, behavior: samePage ? 'smooth' : 'auto' });
  }, []);

  const value = useMemo(() => ({ ...location, params: new URLSearchParams(location.search), navigate }), [location, navigate]);
  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

export const useRouter = () => useContext(RouterContext);

/** <a> que navega sin recargar. Respeta ctrl/cmd-click y target. */
export function Link({ to, onClick, replace, keepScroll, ...props }) {
  const { navigate } = useRouter();
  const handle = (event) => {
    onClick?.(event);
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || props.target) return;
    event.preventDefault();
    navigate(to, { replace, keepScroll });
  };
  return <a href={href(to)} onClick={handle} {...props} />;
}
