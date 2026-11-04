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

async function request(path, { method = 'GET', body, file, auth: withAuth = false, signal } = {}) {
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

/** true en el build para GitHub Pages: no hay servidor, los datos van dentro del sitio. */
export const IS_STATIC = import.meta.env.VITE_STATIC === '1';

// Las rutas de imágenes de business.json son absolutas ("/img/…"): se les antepone la base del sitio.
const withBase = (src) => (src?.startsWith('/') ? `${import.meta.env.BASE_URL}${src.slice(1)}` : src);
const fixBusiness = (b) => ({
  ...b,
  brands: (b.brands || []).map((x) => ({ ...x, image: withBase(x.image), gallery: x.gallery?.map((g) => ({ ...g, image: withBase(g.image) })) })),
});

// kind: 'part' (foto exacta por código) · 'type' (ilustrativa por denominación)
const imagePath = (kind, key) => (kind === 'part' ? `/images/part/${encodeURIComponent(key)}` : `/images/type?d=${encodeURIComponent(key)}`);

let staticApi;
const local = (name) => async (...args) => {
  if (!staticApi) staticApi = (await import('./staticApi.js')).createStaticApi(ApiError);
  return staticApi[name](...args);
};

const remote = {
  business: (opts) => request('/business', opts),
  products: (opts) => request('/products', opts),
  search: (params, opts) => request(`/products/search?${new URLSearchParams(params)}`, opts),
  product: (id, opts) => request(`/products/${encodeURIComponent(id)}`, opts),
  sendInquiry: (body) => request('/inquiries', { method: 'POST', body }),
};
const source = IS_STATIC
  ? { business: local('business'), products: local('products'), search: local('search'), product: local('product'), sendInquiry: local('sendInquiry') }
  : remote;

export const api = {
  ...source,
  business: (opts) => source.business(opts).then(fixBusiness),

  admin: IS_STATIC
    ? Object.fromEntries(['stats', 'createProduct', 'updateProduct', 'deleteProduct', 'inquiries', 'setInquiryStatus'].map((name) => [name, async (...args) => {
      if (!staticApi) staticApi = (await import('./staticApi.js')).createStaticApi(ApiError);
      return staticApi.admin[name](...args);
    }]))
    : {
      stats: () => request('/products/stats', { auth: true }),
      createProduct: (body) => request('/products', { method: 'POST', body, auth: true }),
      updateProduct: (id, body) => request(`/products/${id}`, { method: 'PATCH', body, auth: true }),
      deleteProduct: (id) => request(`/products/${id}`, { method: 'DELETE', auth: true }),
      inquiries: () => request('/inquiries', { auth: true }),
      setInquiryStatus: (id, status) => request(`/inquiries/${id}`, { method: 'PATCH', body: { status }, auth: true }),
      imageTypes: (params, opts) => request(`/images/types?${new URLSearchParams(params)}`, { ...opts, auth: true }),
      uploadImage: (kind, key, file) => request(imagePath(kind, key), { method: 'PUT', file, auth: true }),
      removeImage: (kind, key) => request(imagePath(kind, key), { method: 'DELETE', auth: true }),
    },
};
