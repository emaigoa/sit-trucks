import { prisma } from '../db.js';
import { HttpError } from '../middleware/errors.js';
import { uploadImage, deleteImages } from './storage.js';
import { applyImage, currentImage, imageInUse, listHas, shownImage } from './catalogService.js';

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

  const img = await uploadImage(buffer, { folder: t.folder, name: k });
  return save(kind, t, k, img);
}

/** Usa para kind/key la misma imagen que se ve en el código `fromCode` (exacta o ilustrativa), sin duplicar archivos. */
export async function copyImage(kind, key, fromCode) {
  const { t, k } = target(kind, key);
  const from = String(fromCode ?? '').trim().toUpperCase();
  if (!from) throw new HttpError(422, 'Indicá el código del que copiar la imagen');
  if (!(await listHas(kind, k))) throw new HttpError(404, kind === 'part' ? 'El código no está en la lista vigente' : 'Ese tipo de pieza no está en la lista vigente');
  if (!(await listHas('part', from))) throw new HttpError(404, `El código ${from} no está en la lista vigente`);
  const img = await shownImage(from);
  if (!img) throw new HttpError(404, `El código ${from} todavía no tiene imagen`);
  return save(kind, t, k, { url: img.url, thumb: img.thumb });
}

async function save(kind, t, k, img) {
  const previous = await currentImage(kind, k);
  await t.model().upsert({ where: t.where(k), create: { ...t.where(k), ...img }, update: img });
  await applyImage(kind, k, img);
  await release(previous);
  return img;
}

/** Borra los archivos de una imagen reemplazada, salvo que otra fila los siga usando (copias). */
async function release(previous) {
  if (previous && !(await imageInUse(previous.url))) await deleteImages(previous.url, previous.thumb);
}

export async function removeImage(kind, key) {
  const { t, k } = target(kind, key);
  const previous = await currentImage(kind, k);
  if (!previous) throw new HttpError(404, 'No tiene imagen');
  await t.model().delete({ where: t.where(k) });
  await applyImage(kind, k, null);
  await release(previous);
}
