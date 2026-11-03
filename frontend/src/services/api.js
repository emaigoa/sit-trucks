const BASE = import.meta.env.VITE_API_URL || '/api';
const TOKEN_KEY = 'sit-admin-token';

export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export const adminToken = {
  get: () => { try { return sessionStorage.getItem(TOKEN_KEY) || ''; } catch { return ''; } },
  set: (value) => { try { sessionStorage.setItem(TOKEN_KEY, value); } catch { /* sin storage */ } },
  clear: () => { try { sessionStorage.removeItem(TOKEN_KEY); } catch { /* sin storage */ } },
};

async function request(path, { method = 'GET', body, auth = false, signal } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth) headers.Authorization = `Bearer ${adminToken.get()}`;

  const response = await fetch(`${BASE}${path}`, { method, headers, signal, body: body === undefined ? undefined : JSON.stringify(body) });
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

  admin: {
    stats: () => request('/products/stats', { auth: true }),
    createProduct: (body) => request('/products', { method: 'POST', body, auth: true }),
    updateProduct: (id, body) => request(`/products/${id}`, { method: 'PATCH', body, auth: true }),
    deleteProduct: (id) => request(`/products/${id}`, { method: 'DELETE', auth: true }),
    inquiries: () => request('/inquiries', { auth: true }),
    setInquiryStatus: (id, status) => request(`/inquiries/${id}`, { method: 'PATCH', body: { status }, auth: true }),
  },
};
