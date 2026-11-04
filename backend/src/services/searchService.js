import { read } from '../store/jsonStore.js';
import { catalogItems } from './catalogService.js';
import { searchCatalog, relatedProducts } from '../../../shared/catalog.js';

export { SORTS } from '../../../shared/catalog.js';

// business.json es configuración del sitio (versionada en el repo); el catálogo viene de Postgres.
const load = () => Promise.all([catalogItems(), read('business', {})]);

export async function search(query = {}) {
  const [items, business] = await load();
  return searchCatalog(items, business, query);
}

export async function related(product, limit = 10) {
  const [items, business] = await load();
  return relatedProducts(items, business, product, limit);
}
