import { auth } from './auth.js';

const BASE = import.meta.env.VITE_API_URL || '/api';

export { auth };

export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

/**
 * Aviso de "servidor despertando": si un pedido tarda más de SLOW_MS (en el plan gratis de Render el
 * servidor se duerme tras 15 min sin visitas), se emite el evento `api-slow` con la cantidad de pedidos
 * lentos en curso. Lo escucha <ServerWaking />.
 */
const SLOW_MS = 2500;
let slowCount = 0;
const emitSlow = () => window.dispatchEvent(new CustomEvent('api-slow', { detail: slowCount }));

async function request(path, options = {}) {
  let slow = false;
  const timer = setTimeout(() => { slow = true; slowCount += 1; emitSlow(); }, SLOW_MS);
  try {
    return await send(path, options);
  } finally {
    clearTimeout(timer);
    if (slow) { slowCount -= 1; emitSlow(); }
  }
}

async function send(path, { method = 'GET', body, file, auth: withAuth = false, signal } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (file) headers['Content-Type'] = file.type || 'application/octet-stream';
  if (withAuth) headers.Authorization = `Bearer ${await auth.token()}`;

  const payload = file ?? (body === undefined ? undefined : JSON.stringify(body));
  const response = await fetch(`${BASE}${path}`, { method, headers, signal, body: payload });
  if (response.status === 204) return null;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(response.status, data.error || 'Error de conexión', data.details);
  return data;
}

// Las rutas de imágenes de business.json son absolutas ("/img/…"): se les antepone la base del sitio.
const withBase = (src) => (src?.startsWith('/') ? `${import.meta.env.BASE_URL}${src.slice(1)}` : src);
const fixBusiness = (b) => ({
  ...b,
  brands: (b.brands || []).map((x) => ({ ...x, image: withBase(x.image), gallery: x.gallery?.map((g) => ({ ...g, image: withBase(g.image) })) })),
});

// kind: 'part' (foto exacta por código) · 'type' (ilustrativa por denominación)
const imagePath = (kind, key) => (kind === 'part' ? `/images/part/${encodeURIComponent(key)}` : `/images/type?d=${encodeURIComponent(key)}`);

const source = {
  business: (opts) => request('/business', opts),
  products: (opts) => request('/products', opts),
  search: (params, opts) => request(`/products/search?${new URLSearchParams(params)}`, opts),
  product: (id, opts) => request(`/products/${encodeURIComponent(id)}`, opts),
  sendInquiry: (body) => request('/inquiries', { method: 'POST', body }),
};

export const api = {
  ...source,
  business: (opts) => source.business(opts).then(fixBusiness),

  admin: {
    stats: () => request('/products/stats', { auth: true }),
    createProduct: (body) => request('/products', { method: 'POST', body, auth: true }),
    updateProduct: (id, body) => request(`/products/${id}`, { method: 'PATCH', body, auth: true }),
    deleteProduct: (id) => request(`/products/${id}`, { method: 'DELETE', auth: true }),
    inquiries: () => request('/inquiries', { auth: true }),
    setInquiryStatus: (id, status) => request(`/inquiries/${id}`, { method: 'PATCH', body: { status }, auth: true }),
    imageTypes: (params, opts) => request(`/images/types?${new URLSearchParams(params)}`, { ...opts, auth: true }),
    uploadImage: (kind, key, file) => request(imagePath(kind, key), { method: 'PUT', file, auth: true }),
    copyImage: (kind, key, from) => request(kind === 'part'
      ? `/images/part/${encodeURIComponent(key)}/copy?from=${encodeURIComponent(from)}`
      : `/images/type/copy?d=${encodeURIComponent(key)}&from=${encodeURIComponent(from)}`, { method: 'PUT', auth: true }),
    removeImage: (kind, key) => request(imagePath(kind, key), { method: 'DELETE', auth: true }),
  },
};
