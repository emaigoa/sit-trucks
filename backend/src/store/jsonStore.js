import fs from 'node:fs/promises';
import path from 'node:path';
import { config } from '../config.js';

/**
 * Persistencia mínima en archivos JSON. Las escrituras se serializan por archivo
 * y se hacen de forma atómica (archivo temporal + rename) para no corromper datos.
 * Pensado para poco volumen; si el catálogo crece, reemplazar por SQLite/Postgres
 * manteniendo la misma interfaz (read / write).
 */
const queues = new Map();

const fileFor = (name) => path.join(config.dataDir, `${name}.json`);

export async function read(name, fallback) {
  try {
    return JSON.parse(await fs.readFile(fileFor(name), 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT' && fallback !== undefined) return fallback;
    throw error;
  }
}

export function write(name, data) {
  const previous = queues.get(name) || Promise.resolve();
  const next = previous.then(async () => {
    const target = fileFor(name);
    const tmp = `${target}.${process.pid}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(data, null, 2), 'utf8');
    await fs.rename(tmp, target);
  });
  queues.set(name, next.catch(() => {}));
  return next;
}

/** Lee, aplica una transformación y guarda, todo dentro de la misma cola. */
export async function update(name, fallback, mutate) {
  let result;
  const previous = queues.get(name) || Promise.resolve();
  const next = previous.then(async () => {
    const current = await read(name, fallback);
    const { data, value } = await mutate(current);
    const target = fileFor(name);
    const tmp = `${target}.${process.pid}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(data, null, 2), 'utf8');
    await fs.rename(tmp, target);
    result = value;
  });
  queues.set(name, next.catch(() => {}));
  await next;
  return result;
}
