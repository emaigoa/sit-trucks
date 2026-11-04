import express, { Router } from 'express';
import { asyncHandler } from '../middleware/errors.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { setImage, removeImage } from '../services/imageService.js';
import { typeStats } from '../services/catalogService.js';
import { storageReady } from '../services/storage.js';

/**
 * Imágenes de los repuestos de la lista (solo admin).
 *   GET    /api/images/types?q=&faltantes=1&pagina=   tipos de pieza con su cantidad e imagen
 *   PUT    /api/images/part/:code                     body = archivo de imagen (foto exacta)
 *   PUT    /api/images/type?d=<denominación>          body = archivo de imagen (ilustrativa)
 *   DELETE /api/images/part/:code  ·  /api/images/type?d=…
 */
export const imagesRouter = Router();
imagesRouter.use(requireAdmin);

const rawImage = express.raw({ type: ['image/*', 'application/octet-stream'], limit: '12mb' });

imagesRouter.get('/types', asyncHandler(async (req, res) => {
  res.json({
    storage: storageReady(),
    ...(await typeStats({ q: req.query.q, missing: req.query.faltantes === '1', page: Number(req.query.pagina) || 1 })),
  });
}));

imagesRouter.put('/part/:code', rawImage, asyncHandler(async (req, res) => res.json(await setImage('part', req.params.code, req.body))));
imagesRouter.put('/type', rawImage, asyncHandler(async (req, res) => res.json(await setImage('type', req.query.d, req.body))));

imagesRouter.delete('/part/:code', asyncHandler(async (req, res) => {
  await removeImage('part', req.params.code);
  res.status(204).end();
}));
imagesRouter.delete('/type', asyncHandler(async (req, res) => {
  await removeImage('type', req.query.d);
  res.status(204).end();
}));
