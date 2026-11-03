import { Router } from 'express';
import { read } from '../store/jsonStore.js';
import { asyncHandler } from '../middleware/errors.js';

export const businessRouter = Router();

businessRouter.get('/', asyncHandler(async (req, res) => {
  res.set('Cache-Control', 'public, max-age=300');
  res.json(await read('business'));
}));
