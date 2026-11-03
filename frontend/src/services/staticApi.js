/**
 * API "sin servidor" para la demo en GitHub Pages: usa los mismos datos JSON
 * del backend, incluidos en el build, y la misma lógica de búsqueda (shared/catalog.js).
 * Solo lectura: el admin y el formulario de consultas no guardan datos en este modo.
 */
import products from '../../../backend/data/products.json';
import business from '../../../backend/data/business.json';
import { CATEGORIES, relatedProducts, searchCatalog } from '../../../shared/catalog.js';

const reply = (data) => Promise.resolve(structuredClone(data));

export function createStaticApi(ApiError) {
  return {
    business: () => reply(business),
    products: () => reply({ categories: CATEGORIES, items: products }),
    search: (params) => reply({ categories: CATEGORIES, ...searchCatalog(products, business, Object.fromEntries(new URLSearchParams(params))) }),
    product: (id) => {
      const item = products.find((p) => p.id === id);
      if (!item) return Promise.reject(new ApiError(404, 'Repuesto no encontrado'));
      return reply({ ...item, related: relatedProducts(products, business, item) });
    },
    sendInquiry: () => Promise.reject(new ApiError(503, 'En esta demo el formulario no envía datos. Escribinos por WhatsApp y te respondemos al momento.')),
  };
}
