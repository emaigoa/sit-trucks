
/**
 * Lógica pura del catálogo, compartida por el backend (API) y el frontend
 * (modo estático de GitHub Pages, donde no hay servidor).
 *
 * Búsqueda del catálogo público al estilo Mercado Libre:
 * filtros combinables + facetas con contadores + orden + paginación.
 *
 * Las facetas se calculan sobre el resultado ya filtrado (como en ML): un filtro
 * aplicado desaparece de la barra lateral y se muestra como "chip" removible.
 */

export const CATEGORIES = ['Motor', 'Filtros', 'Frenos', 'Transmisión', 'Suspensión', 'Neumática', 'Eléctrico', 'Iluminación', 'Refrigeración', 'Carrocería'];
export const ORIGINS = ['Original', 'Alternativo'];

// Los precios no se publican: se consultan por WhatsApp.
export const SORTS = ['relevancia', 'nuevos', 'nombre'];
const MAX_PER_PAGE = 60;

/**
 * Una entrada de compatibilidad puede ser solo la marca ("IVECO") o marca + modelo ("IVECO Tector").
 * La marca sola cubre todos sus modelos.
 */
export function fitsVehicle(product, brand, model) {
  if (!brand) return true;
  const b = brand.toLowerCase();
  const full = model ? `${b} ${model.toLowerCase()}` : null;
  return (product.compatibility || []).some((entry) => {
    const e = entry.toLowerCase();
    if (e === b) return true;
    return full ? e === full : e.startsWith(`${b} `);
  });
}

const fold = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const one = (v) => (Array.isArray(v) ? v[0] : v) ?? '';
function brandsOf(product, brandNames) {
  const out = new Set();
  for (const entry of product.compatibility || []) {
    const e = fold(entry);
    const hit = brandNames.find((b) => e === fold(b) || e.startsWith(`${fold(b)} `));
    if (hit) out.add(hit);
  }
  return [...out];
}

function modelsOf(product, brand) {
  const prefix = `${fold(brand)} `;
  return (product.compatibility || [])
    .filter((entry) => fold(entry).startsWith(prefix))
    .map((entry) => entry.slice(brand.length + 1).trim());
}

function score(product, tokens) {
  if (!tokens.length) return 0;
  const name = fold(product.name);
  const codes = fold(`${product.code} ${product.oemCode}`);
  let s = 0;
  for (const t of tokens) {
    if (codes.split(/[\s/]+/).includes(t)) s += 6;
    else if (codes.includes(t)) s += 4;
    if (name.startsWith(t)) s += 3;
    else if (new RegExp(`\\b${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).test(name)) s += 2;
    else if (name.includes(t)) s += 1;
  }
  return s;
}

const count = (items, keyFn) => {
  const map = new Map();
  for (const item of items) for (const k of [].concat(keyFn(item)).filter(Boolean)) map.set(k, (map.get(k) || 0) + 1);
  return [...map].map(([value, total]) => ({ value, count: total })).sort((a, b) => b.count - a.count || a.value.localeCompare(b.value, 'es'));
};

export function searchCatalog(items, business, query = {}) {
  const brandNames = (business.brands || []).map((b) => b.name).sort((a, b) => b.length - a.length);

  const q = String(one(query.q)).trim().slice(0, 80);
  const tokens = fold(q).split(/\s+/).filter(Boolean);
  const f = {
    categoria: String(one(query.categoria)),
    marca: String(one(query.marca)),
    modelo: String(one(query.modelo)),
    fabricante: String(one(query.fabricante)),
    tipo: String(one(query.tipo)),
    hoy: one(query.hoy) === '1',
  };
  const sort = SORTS.includes(one(query.orden)) ? one(query.orden) : 'relevancia';
  const perPage = Math.min(MAX_PER_PAGE, Math.max(1, Number.parseInt(one(query.porPagina), 10) || 24));

  const filtered = items.filter((p) => {
    if (f.categoria && p.category !== f.categoria) return false;
    if (f.marca && !fitsVehicle(p, f.marca, f.modelo)) return false;
    if (f.fabricante && p.manufacturer !== f.fabricante) return false;
    if (f.tipo && p.origin !== f.tipo) return false;
    if (f.hoy && !(p.stock > 0)) return false;
    if (tokens.length) {
      const hay = fold([p.name, p.code, p.oemCode, p.detail, p.category, p.manufacturer, ...(p.compatibility || [])].join(' '));
      if (!tokens.every((t) => hay.includes(t))) return false;
    }
    return true;
  });

  const scored = filtered.map((p) => ({ p, s: score(p, tokens) }));
  const recent = (a, b) => String(b.p.updatedAt).localeCompare(String(a.p.updatedAt));
  const relevance = (a, b) => b.s - a.s || Number(b.p.featured) - Number(a.p.featured) || Number(b.p.stock > 0) - Number(a.p.stock > 0) || recent(a, b);
  const byName = (a, b) => a.p.name.localeCompare(b.p.name, 'es', { sensitivity: 'base' });
  scored.sort({ nuevos: recent, nombre: byName }[sort] || relevance);

  const total = scored.length;
  const pages = Math.max(1, Math.ceil(total / perPage));
  const page = Math.min(pages, Math.max(1, Number.parseInt(one(query.pagina), 10) || 1));
  const pageItems = scored.slice((page - 1) * perPage, page * perPage).map(({ p }) => p);

  const facets = {
    categoria: f.categoria ? [] : count(filtered, (p) => p.category),
    marca: f.marca ? [] : count(filtered, (p) => brandsOf(p, brandNames)),
    modelo: f.marca && !f.modelo ? count(filtered, (p) => modelsOf(p, f.marca)) : [],
    fabricante: f.fabricante ? [] : count(filtered, (p) => p.manufacturer),
    tipo: f.tipo ? [] : count(filtered, (p) => p.origin),
    hoy: filtered.filter((p) => p.stock > 0).length,
  };

  return { query: { q, ...f, orden: sort }, total, page, pages, perPage, items: pageItems, facets, sorts: SORTS };
}

/** Relacionados para la página de producto: misma categoría o misma marca de camión. */
export function relatedProducts(items, business, product, limit = 10) {
  const brandNames = (business.brands || []).map((b) => b.name);
  const mine = new Set(brandsOf(product, brandNames));
  return items
    .filter((p) => p.id !== product.id)
    .map((p) => ({ p, s: (p.category === product.category ? 2 : 0) + (brandsOf(p, brandNames).some((b) => mine.has(b)) ? 3 : 0) + (p.stock > 0 ? 1 : 0) }))
    .filter((x) => x.s >= 3)
    .sort((a, b) => b.s - a.s || String(b.p.updatedAt).localeCompare(String(a.p.updatedAt)))
    .slice(0, limit)
    .map(({ p }) => p);
}
