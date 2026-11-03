import { Router } from 'express';
import * as inquiries from '../services/inquiryService.js';
import { asyncHandler } from '../middleware/errors.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { rateLimit } from '../middleware/rateLimit.js';

export const inquiriesRouter = Router();

inquiriesRouter.post('/', rateLimit({ windowMs: 10 * 60_000, max: 5 }), asyncHandler(async (req, res) => {
  await inquiries.create(req.body);
  res.status(201).json({ ok: true });
}));

inquiriesRouter.get('/', requireAdmin, asyncHandler(async (req, res) => res.json(await inquiries.list())));

inquiriesRouter.patch('/:id', requireAdmin, asyncHandler(async (req, res) => res.json(await inquiries.setStatus(req.params.id, req.body?.status))));
