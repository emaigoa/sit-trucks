import { read, update } from '../store/jsonStore.js';
import { HttpError } from '../middleware/errors.js';
import { CATEGORIES, ORIGINS, fitsVehicle } from '../../../shared/catalog.js';

export { CATEGORIES, ORIGINS, fitsVehicle };

const STORE = 'products';

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

export async function list({ q = '', category, brand, model } = {}) {
  const items = await read(STORE, []);
  const term = q.toString().trim().toLowerCase();
  return items
    .filter((p) =>
      (!category || category === 'Todos' || p.category === category) &&
      fitsVehicle(p, brand, model) &&
      (!term || [p.name, p.code, p.oemCode, p.detail, p.category, ...(p.compatibility || [])].join(' ').toLowerCase().includes(term)))
    .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
}

export async function get(id) {
  const item = (await read(STORE, [])).find((p) => p.id === id);
  if (!item) throw new HttpError(404, 'Repuesto no encontrado');
  return item;
}

export function create(input) {
  const data = clean(input);
  return update(STORE, [], (items) => {
    if (items.some((p) => p.code.toLowerCase() === data.code.toLowerCase())) {
      throw new HttpError(409, 'Ya existe un repuesto con ese código', { code: 'Código duplicado' });
    }
    const item = { id: crypto.randomUUID(), featured: false, compatibility: [], badge: '', description: '', detail: '', image: '', thumb: '', oemCode: '', manufacturer: '', origin: 'Alternativo', ...data, updatedAt: new Date().toISOString() };
    return { data: [item, ...items], value: item };
  });
}

export function patch(id, input) {
  const data = clean(input, { partial: true });
  return update(STORE, [], (items) => {
    const index = items.findIndex((p) => p.id === id);
    if (index === -1) throw new HttpError(404, 'Repuesto no encontrado');
    if (data.code && items.some((p) => p.id !== id && p.code.toLowerCase() === data.code.toLowerCase())) {
      throw new HttpError(409, 'Ya existe un repuesto con ese código', { code: 'Código duplicado' });
    }
    const item = { ...items[index], ...data, updatedAt: new Date().toISOString() };
    const next = [...items];
    next[index] = item;
    return { data: next, value: item };
  });
}

export function remove(id) {
  return update(STORE, [], (items) => {
    if (!items.some((p) => p.id === id)) throw new HttpError(404, 'Repuesto no encontrado');
    return { data: items.filter((p) => p.id !== id), value: true };
  });
}

export async function stats() {
  const items = await read(STORE, []);
  return {
    total: items.length,
    inStock: items.filter((p) => p.stock > 5).length,
    low: items.filter((p) => p.stock > 0 && p.stock <= 5).length,
    out: items.filter((p) => p.stock === 0).length,
  };
}
