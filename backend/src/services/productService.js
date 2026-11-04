import { prisma } from '../db.js';
import { HttpError } from '../middleware/errors.js';
import { CATEGORIES, ORIGINS, fitsVehicle } from '../../../shared/catalog.js';
import { listCount } from './catalogService.js';

export { CATEGORIES, ORIGINS, fitsVehicle };


/** Forma pública del producto (la misma que tenía el JSON). */
export const toApi = (p) => ({ ...p, updatedAt: p.updatedAt.toISOString() });

function clean(input, { partial = false } = {}) {
  const errors = {};
  const out = {};
  const str = (key, max = 140) => {
    if (input[key] === undefined) return;
    out[key] = String(input[key]).trim().slice(0, max);
  };

  str('code', 24);
  str('oemCode', 60);
  str('name');
  str('detail', 200);
  str('description', 1000);
  str('badge', 24);
  str('image', 500);
  str('thumb', 500);
  str('manufacturer', 40);

  if (input.category !== undefined) out.category = String(input.category);
  if (input.stock !== undefined) out.stock = Number(input.stock);
  if (input.origin !== undefined) out.origin = String(input.origin);
  if (input.compatibility !== undefined) {
    out.compatibility = (Array.isArray(input.compatibility) ? input.compatibility : String(input.compatibility).split(','))
      .map((item) => String(item).trim()).filter(Boolean).slice(0, 12);
  }
  if (input.featured !== undefined) out.featured = Boolean(input.featured);

  const need = (key) => !partial || out[key] !== undefined;
  if (need('code') && !out.code) errors.code = 'El código es obligatorio';
  if (need('name') && !out.name) errors.name = 'El nombre es obligatorio';
  if (need('category') && !CATEGORIES.includes(out.category)) errors.category = 'Categoría inválida';
  if (need('stock') && (!Number.isInteger(out.stock) || out.stock < 0)) errors.stock = 'Stock debe ser un entero ≥ 0';
  if (out.origin !== undefined && !ORIGINS.includes(out.origin)) errors.origin = 'Tipo inválido';
  for (const key of ['image', 'thumb']) {
    if (out[key] && !/^(https?:\/\/|\/)/i.test(out[key])) errors[key] = 'La imagen debe ser una URL http(s)';
  }

  if (Object.keys(errors).length) throw new HttpError(422, 'Datos inválidos', errors);
  return out;
}

async function assertUniqueCode(code, exceptId) {
  const clash = await prisma.product.findFirst({
    where: { code: { equals: code, mode: 'insensitive' }, ...(exceptId && { NOT: { id: exceptId } }) },
    select: { id: true },
  });
  if (clash) throw new HttpError(409, 'Ya existe un repuesto con ese código', { code: 'Código duplicado' });
}

/** Todos los productos de la tienda (el catálogo público se filtra en memoria con shared/catalog.js). */
export async function all() {
  return (await prisma.product.findMany({ orderBy: { updatedAt: 'desc' } })).map(toApi);
}

export async function list({ q = '', category, brand, model } = {}) {
  const term = q.toString().trim().toLowerCase();
  return (await all()).filter((p) =>
    (!category || category === 'Todos' || p.category === category) &&
    fitsVehicle(p, brand, model) &&
    (!term || [p.name, p.code, p.oemCode, p.detail, p.category, ...(p.compatibility || [])].join(' ').toLowerCase().includes(term)));
}

export async function get(id) {
  const item = await prisma.product.findUnique({ where: { id: String(id) } });
  if (!item) throw new HttpError(404, 'Repuesto no encontrado');
  return toApi(item);
}

export async function create(input) {
  const data = clean(input);
  await assertUniqueCode(data.code);
  return toApi(await prisma.product.create({ data }));
}

export async function patch(id, input) {
  const data = clean(input, { partial: true });
  await get(id);
  if (data.code) await assertUniqueCode(data.code, id);
  return toApi(await prisma.product.update({ where: { id }, data }));
}

export async function remove(id) {
  await get(id);
  await prisma.product.delete({ where: { id } });
  return true;
}

export async function stats() {
  const [list, total, inStock, low, out] = await Promise.all([
    listCount(),
    prisma.product.count(),
    prisma.product.count({ where: { stock: { gt: 5 } } }),
    prisma.product.count({ where: { stock: { gt: 0, lte: 5 } } }),
    prisma.product.count({ where: { stock: 0 } }),
  ]);
  return { list, total, inStock, low, out };
}
