import { prisma } from '../db.js';
import { HttpError } from '../middleware/errors.js';
import { uploadImage, deleteImages } from './storage.js';
import { applyImage, currentImage, listHas } from './catalogService.js';

/**
 * kind = 'part' → foto exacta de un código de la lista.
 * kind = 'type' → imagen ilustrativa de una denominación (se ve en todos los repuestos de ese tipo).
 */
const TABLE = {
  part: { model: () => prisma.partImage, where: (key) => ({ code: key }), folder: 'repuestos' },
  type: { model: () => prisma.typeImage, where: (key) => ({ description: key }), folder: 'tipos' },
};

function target(kind, key) {
  const t = TABLE[kind];
  const k = String(key ?? '').trim();
  if (!t || !k) throw new HttpError(422, 'Destino de imagen inválido');
  return { t, k };
}

export async function setImage(kind, key, buffer) {
  const { t, k } = target(kind, key);
  if (!(await listHas(kind, k))) throw new HttpError(404, kind === 'part' ? 'El código no está en la lista vigente' : 'Ese tipo de pieza no está en la lista vigente');

  const previous = await currentImage(kind, k);
  const img = await uploadImage(buffer, { folder: t.folder, name: k });
  await t.model().upsert({ where: t.where(k), create: { ...t.where(k), ...img }, update: img });
  await applyImage(kind, k, img);
  if (previous) await deleteImages(previous.url, previous.thumb);
  return img;
}

export async function removeImage(kind, key) {
  const { t, k } = target(kind, key);
  const previous = await currentImage(kind, k);
  if (!previous) throw new HttpError(404, 'No tiene imagen');
  await t.model().delete({ where: t.where(k) });
  await applyImage(kind, k, null);
  await deleteImages(previous.url, previous.thumb);
}
