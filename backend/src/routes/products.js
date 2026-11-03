import { Router } from 'express';
import * as products from '../services/productService.js';
import { search, related } from '../services/searchService.js';
import { asyncHandler } from '../middleware/errors.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

export const productsRouter = Router();

// Listado completo (lo usa el panel admin).
productsRouter.get('/', asyncHandler(async (req, res) => {
  res.json({ categories: products.CATEGORIES, origins: products.ORIGINS, items: await products.list(req.query) });
}));

// Catálogo público: filtros, facetas, orden y paginación.
productsRouter.get('/search', asyncHandler(async (req, res) => {
  res.json({ categories: products.CATEGORIES, ...(await search(req.query)) });
}));

productsRouter.get('/stats', requireAdmin, asyncHandler(async (req, res) => res.json(await products.stats())));

productsRouter.get('/:id', asyncHandler(async (req, res) => {
  const item = await products.get(req.params.id);
  res.json({ ...item, related: await related(item) });
}));

productsRouter.post('/', requireAdmin, asyncHandler(async (req, res) => res.status(201).json(await products.create(req.body))));

productsRouter.patch('/:id', requireAdmin, asyncHandler(async (req, res) => res.json(await products.patch(req.params.id, req.body))));

productsRouter.delete('/:id', requireAdmin, asyncHandler(async (req, res) => {
  await products.remove(req.params.id);
  res.status(204).end();
}));
