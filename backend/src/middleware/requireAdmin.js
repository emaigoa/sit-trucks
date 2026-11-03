import crypto from 'node:crypto';
import { config } from '../config.js';

function safeEqual(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

export function requireAdmin(req, res, next) {
  const header = req.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token || !safeEqual(token, config.adminToken)) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  next();
}
