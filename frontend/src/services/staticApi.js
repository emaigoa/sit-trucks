/**
 * API "sin servidor" para la demo en GitHub Pages: usa los mismos datos JSON
 * del backend, incluidos en el build, y la misma lógica de búsqueda (shared/catalog.js).
 *
 * El admin funciona en memoria: se puede crear, editar y borrar, y los cambios se ven
 * en el catálogo durante la sesión, pero se pierden al recargar la página.
 */
import products from '../../../backend/data/products.json';
import business from '../../../backend/data/business.json';
import { CATEGORIES, ORIGINS, relatedProducts, searchCatalog } from '../../../shared/catalog.js';

const clone = (data) => structuredClone(data);
const reply = (data) => Promise.resolve(clone(data));

const db = { products: clone(products), inquiries: sampleInquiries() };

/** Consultas de ejemplo para mostrar la bandeja del admin (datos ficticios). */
function sampleInquiries() {
  const ago = (hours) => new Date(Date.now() - hours * 3600 * 1000).toISOString();
  const p = (code) => products.find((x) => x.code === code) || products[0];
  return [
    { id: 'demo-1', type: 'consulta', status: 'nueva', name: 'Taller Ejemplo', contact: '223 000-0001', message: `Precio y stock de ${p('SIT-6153').name}. ¿Sale hoy?`, productCode: 'SIT-6153', vehicle: { brand: 'IVECO', model: 'Daily', year: '2016' }, createdAt: ago(2) },
    { id: 'demo-2', type: 'consulta', status: 'nueva', name: 'Transporte Demo', contact: 'flota@ejemplo.com', message: 'Necesito kit de embrague para dos unidades. ¿Hacen precio por cantidad?', productCode: '', vehicle: { brand: 'IVECO', model: 'Tector', year: '2012' }, createdAt: ago(7) },
    { id: 'demo-3', type: 'consulta', status: 'respondida', name: 'Cliente de prueba', contact: '223 000-0003', message: 'Busco óptica delantera izquierda.', productCode: '', vehicle: { brand: 'IVECO', model: 'Stralis', year: '2009' }, createdAt: ago(30) },
    { id: 'demo-4', type: 'consulta', status: 'archivada', name: 'Consulta antigua', contact: '223 000-0004', message: '¿Tienen filtro de aire primario?', productCode: 'SIT-3301', vehicle: { brand: '', model: '', year: '' }, createdAt: ago(96) },
  ];
}

const notFound = (ApiError) => Promise.reject(new ApiError(404, 'Repuesto no encontrado'));

export function createStaticApi(ApiError) {
  const stats = () => ({
    total: db.products.length,
    inStock: db.products.filter((p) => p.stock > 5).length,
    low: db.products.filter((p) => p.stock > 0 && p.stock <= 5).length,
    out: db.products.filter((p) => p.stock === 0).length,
  });

  const validate = (input, current) => {
    const errors = {};
    const code = String(input.code ?? current?.code ?? '').trim();
    if (!code) errors.code = 'El código es obligatorio';
    else if (db.products.some((p) => p.id !== current?.id && p.code.toLowerCase() === code.toLowerCase())) errors.code = 'Código duplicado';
    if (!String(input.name ?? current?.name ?? '').trim()) errors.name = 'El nombre es obligatorio';
    if (Object.keys(errors).length) throw new ApiError(422, 'Datos inválidos', errors);
  };
  const normalize = (input) => ({
    ...input,
    ...(input.stock !== undefined && { stock: Math.max(0, Number.parseInt(input.stock, 10) || 0) }),
    ...(input.compatibility !== undefined && {
      compatibility: (Array.isArray(input.compatibility) ? input.compatibility : String(input.compatibility).split(',')).map((s) => String(s).trim()).filter(Boolean),
    }),
  });

  return {
    business: () => reply(business),
    products: () => reply({ categories: CATEGORIES, origins: ORIGINS, items: db.products }),
    search: (params) => reply({ categories: CATEGORIES, ...searchCatalog(db.products, business, Object.fromEntries(new URLSearchParams(params))) }),
    product: (id) => {
      const item = db.products.find((p) => p.id === id);
      if (!item) return notFound(ApiError);
      return reply({ ...item, related: relatedProducts(db.products, business, item) });
    },
    sendInquiry: () => Promise.reject(new ApiError(503, 'En esta demo el formulario no envía datos. Escribinos por WhatsApp y te respondemos al momento.')),

    admin: {
      stats: () => reply(stats()),
      createProduct: async (body) => {
        validate(body);
        const item = { id: `demo-${Date.now()}`, featured: false, compatibility: [], badge: '', description: '', detail: '', image: '', thumb: '', oemCode: '', manufacturer: '', origin: 'Alternativo', ...normalize(body), updatedAt: new Date().toISOString() };
        db.products.unshift(item);
        return clone(item);
      },
      updateProduct: async (id, body) => {
        const index = db.products.findIndex((p) => p.id === id);
        if (index === -1) return notFound(ApiError);
        validate(body, db.products[index]);
        db.products[index] = { ...db.products[index], ...normalize(body), updatedAt: new Date().toISOString() };
        return clone(db.products[index]);
      },
      deleteProduct: async (id) => {
        db.products = db.products.filter((p) => p.id !== id);
        return null;
      },
      inquiries: () => reply([...db.inquiries].sort((a, b) => b.createdAt.localeCompare(a.createdAt))),
      setInquiryStatus: async (id, status) => {
        const item = db.inquiries.find((i) => i.id === id);
        if (!item) throw new ApiError(404, 'Consulta no encontrada');
        item.status = status;
        return clone(item);
      },
    },
  };
}
