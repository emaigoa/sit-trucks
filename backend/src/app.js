import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { businessRouter } from './routes/business.js';
import { productsRouter } from './routes/products.js';
import { inquiriesRouter } from './routes/inquiries.js';
import { imagesRouter } from './routes/images.js';
import { errorHandler, notFound } from './middleware/errors.js';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(cors({ origin: config.corsOrigin.split(',').map((o) => o.trim()) }));
  app.use(express.json({ limit: '100kb' }));

  app.get('/api/health', (req, res) => res.json({ ok: true }));
  app.use('/api/business', businessRouter);
  app.use('/api/products', productsRouter);
  app.use('/api/inquiries', inquiriesRouter);
  app.use('/api/images', imagesRouter);
  app.use('/api', notFound);

  // En producción el mismo servidor entrega el front compilado.
  if (fs.existsSync(config.frontendDist)) {
    app.use(express.static(config.frontendDist, { maxAge: '7d', index: false }));
    // index.html nunca se cachea: así cada deploy toma los assets nuevos (que sí tienen hash y caché larga).
    app.get('*', (req, res) => {
      res.set('Cache-Control', 'no-cache');
      res.sendFile(path.join(config.frontendDist, 'index.html'));
    });
  }

  app.use(errorHandler);
  return app;
}
