import { read, update } from '../store/jsonStore.js';
import { HttpError } from '../middleware/errors.js';

const STORE = 'inquiries';
export const TYPES = ['consulta', 'mayorista'];
const BUSINESS_KINDS = ['Taller', 'Flota / transporte', 'Casa de repuestos', 'Otro'];

const text = (value, max) => String(value ?? '').trim().slice(0, max);

export function create(input = {}) {
  // Campo trampa anti-spam: los humanos no lo ven ni lo completan.
  if (input.website) return Promise.resolve({ ok: true });

  const type = TYPES.includes(input.type) ? input.type : 'consulta';
  const item = {
    type,
    name: text(input.name, 80),
    contact: text(input.contact, 120),
    message: text(input.message, 1500),
    productCode: text(input.productCode, 24),
    vehicle: {
      brand: text(input.vehicle?.brand, 30),
      model: text(input.vehicle?.model, 40),
      year: text(input.vehicle?.year, 4),
    },
  };
  if (type === 'mayorista') {
    item.company = text(input.company, 100);
    item.businessKind = BUSINESS_KINDS.includes(input.businessKind) ? input.businessKind : 'Otro';
    item.city = text(input.city, 80);
  }

  const errors = {};
  if (item.name.length < 2) errors.name = 'Contanos tu nombre';
  if (item.contact.length < 6) errors.contact = 'Dejanos un teléfono o email';
  if (type === 'consulta' && item.message.length < 5) errors.message = 'Escribí qué repuesto buscás';
  if (type === 'mayorista' && item.company.length < 2) errors.company = 'Indicá el nombre del negocio';
  if (item.vehicle.year && !/^(19|20)\d{2}$/.test(item.vehicle.year)) errors.year = 'Año inválido';
  if (Object.keys(errors).length) throw new HttpError(422, 'Datos inválidos', errors);

  const record = { id: crypto.randomUUID(), ...item, status: 'nueva', createdAt: new Date().toISOString() };
  return update(STORE, [], (items) => ({ data: [record, ...items].slice(0, 2000), value: record }));
}

export const list = () => read(STORE, []);

export function setStatus(id, status) {
  if (!['nueva', 'respondida', 'archivada'].includes(status)) throw new HttpError(422, 'Estado inválido');
  return update(STORE, [], (items) => {
    const index = items.findIndex((i) => i.id === id);
    if (index === -1) throw new HttpError(404, 'Consulta no encontrada');
    const next = [...items];
    next[index] = { ...next[index], status };
    return { data: next, value: next[index] };
  });
}
