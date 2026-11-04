import { prisma } from '../db.js';
import { HttpError } from '../middleware/errors.js';

export const TYPES = ['consulta', 'mayorista'];
const BUSINESS_KINDS = ['Taller', 'Flota / transporte', 'Casa de repuestos', 'Otro'];
const STATUSES = ['nueva', 'respondida', 'archivada'];

const text = (value, max) => String(value ?? '').trim().slice(0, max);

/** Forma pública de la consulta (la misma que tenía el JSON: sin campos de mayorista si no aplica). */
function toApi({ company, businessKind, city, createdAt, ...rest }) {
  return {
    ...rest,
    ...(rest.type === 'mayorista' && { company: company ?? '', businessKind: businessKind ?? 'Otro', city: city ?? '' }),
    createdAt: createdAt.toISOString(),
  };
}

export async function create(input = {}) {
  // Campo trampa anti-spam: los humanos no lo ven ni lo completan.
  if (input.website) return { ok: true };

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

  return toApi(await prisma.inquiry.create({ data: item }));
}

export async function list() {
  return (await prisma.inquiry.findMany({ orderBy: { createdAt: 'desc' }, take: 2000 })).map(toApi);
}

export async function setStatus(id, status) {
  if (!STATUSES.includes(status)) throw new HttpError(422, 'Estado inválido');
  const found = await prisma.inquiry.findUnique({ where: { id }, select: { id: true } });
  if (!found) throw new HttpError(404, 'Consulta no encontrada');
  return toApi(await prisma.inquiry.update({ where: { id }, data: { status } }));
}
