import { Router } from 'express';
import * as products from '../services/productService.js';
import { search, related } from '../services/searchService.js';
import { invalidateCurated, catalogItem } from '../services/catalogService.js';
import { HttpError } from '../middleware/errors.js';
import { asyncHandler } from '../middleware/errors.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

export const productsRouter = Router();

// Listado completo (lo usa el panel admin).
productsRouter.get('/', asyncHandler(async (req, res) => {
  res.json({ categories: products.CATEGORIES, origins: products.ORIGINS, items: await products.list(req.query) });
}));

// Catálogo público: filtros, facetas, orden y paginación.
productsRouter.get('/search', asyncHandler(async (req, res) => {
  res.set('Cache-Control', 'public, max-age=60');
  res.json({ categories: products.CATEGORIES, ...(await search(req.query)) });
}));

productsRouter.get('/stats', requireAdmin, asyncHandler(async (req, res) => res.json(await products.stats())));

productsRouter.get('/:id', asyncHandler(async (req, res) => {
  // Repuestos de la lista de precios (id "iveco-<código>") o productos cargados en el admin.
  const item = await catalogItem(req.params.id);
  if (!item) throw new HttpError(404, 'Repuesto no encontrado');
  res.set('Cache-Control', 'public, max-age=300');
  res.json({ ...item, related: await related(item) });
}));

productsRouter.post('/', requireAdmin, asyncHandler(async (req, res) => {
  const item = await products.create(req.body);
  invalidateCurated();
  res.status(201).json(item);
}));

productsRouter.patch('/:id', requireAdmin, asyncHandler(async (req, res) => {
  const item = await products.patch(req.params.id, req.body);
  invalidateCurated();
  res.json(item);
}));

productsRouter.delete('/:id', requireAdmin, asyncHandler(async (req, res) => {
  await products.remove(req.params.id);
  invalidateCurated();
  res.status(204).end();
}));
