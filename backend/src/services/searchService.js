import { read } from '../store/jsonStore.js';
import { searchCatalog, relatedProducts } from '../../../shared/catalog.js';

export { SORTS } from '../../../shared/catalog.js';

const load = () => Promise.all([read('products', []), read('business', {})]);

export async function search(query = {}) {
  const [items, business] = await load();
  return searchCatalog(items, business, query);
}

export async function related(product, limit = 10) {
  const [items, business] = await load();
  return relatedProducts(items, business, product, limit);
}
