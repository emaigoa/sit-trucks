/**
 * Los filtros del catálogo viven en la URL (se pueden compartir y el botón "atrás" funciona).
 * /catalogo?q=&categoria=&marca=&modelo=&anio=&fabricante=&tipo=&hoy=1&orden=&pagina=&vista=
 */
export const FILTER_KEYS = ['q', 'categoria', 'marca', 'modelo', 'anio', 'fabricante', 'tipo', 'hoy'];

export function catalogUrl(filters = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) if (value !== undefined && value !== null && value !== '') params.set(key, value);
  const qs = params.toString();
  return `/catalogo${qs ? `?${qs}` : ''}`;
}

/** Devuelve la URL con cambios aplicados. Cualquier cambio de filtro vuelve a la página 1. */
export function withParams(current, patch) {
  const params = new URLSearchParams(current);
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined || value === null || value === '') params.delete(key);
    else params.set(key, value);
  }
  if (!('pagina' in patch)) params.delete('pagina');
  const qs = params.toString();
  return `/catalogo${qs ? `?${qs}` : ''}`;
}

export const vehicleUrl = (v) => catalogUrl({ marca: v.brand, modelo: v.model, anio: v.year });
