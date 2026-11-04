/**
 * Carga los productos y consultas de backend/data/*.json en Postgres (una sola vez, al migrar).
 * Es idempotente: lo que ya existe (mismo id o código) se saltea.
 *
 *   npm run db:seed -w backend
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { prisma } from '../src/db.js';

const dataDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'data');
const readJson = async (name) => {
  try { return JSON.parse(await fs.readFile(path.join(dataDir, `${name}.json`), 'utf8')); } catch { return []; }
};

const products = (await readJson('products')).map((p) => ({
  id: p.id,
  code: p.code,
  oemCode: p.oemCode || '',
  name: p.name,
  detail: p.detail || '',
  description: p.description || '',
  category: p.category,
  stock: p.stock ?? 0,
  badge: p.badge || '',
  featured: Boolean(p.featured),
  compatibility: p.compatibility || [],
  image: p.image || '',
  thumb: p.thumb || '',
  manufacturer: p.manufacturer || '',
  origin: p.origin || 'Alternativo',
  updatedAt: p.updatedAt ? new Date(p.updatedAt) : new Date(),
}));

const inquiries = (await readJson('inquiries')).map((i) => ({
  id: i.id,
  type: i.type,
  status: i.status || 'nueva',
  name: i.name,
  contact: i.contact,
  message: i.message || '',
  productCode: i.productCode || '',
  vehicle: i.vehicle || {},
  company: i.company ?? null,
  businessKind: i.businessKind ?? null,
  city: i.city ?? null,
  createdAt: i.createdAt ? new Date(i.createdAt) : new Date(),
}));

try {
  const p = await prisma.product.createMany({ data: products, skipDuplicates: true });
  const q = await prisma.inquiry.createMany({ data: inquiries, skipDuplicates: true });
  console.log(`Productos: ${p.count} nuevos de ${products.length} · Consultas: ${q.count} nuevas de ${inquiries.length}`);
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
