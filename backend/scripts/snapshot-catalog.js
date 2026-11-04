/**
 * Guarda en disco los repuestos activos de la lista (backend/data/parts-snapshot.json) para que el
 * servidor arranque sin bajar ~50k filas de Supabase. Se corre en el build de Render:
 *
 *   npm run db:snapshot -w backend
 *
 * Si después se importa una lista nueva, el servidor la detecta solo (compara la versión) y la baja
 * una vez; el próximo deploy vuelve a generar el snapshot.
 */
import fs from 'node:fs/promises';
import { prisma } from '../src/db.js';
import { SNAPSHOT_FILE, fetchListRows, listVersion } from '../src/services/catalogService.js';

try {
  const [version, rows] = await Promise.all([listVersion(), fetchListRows()]);
  await fs.writeFile(SNAPSHOT_FILE, JSON.stringify({ version, rows }));
  const { size } = await fs.stat(SNAPSHOT_FILE);
  console.log(`Snapshot ${version}: ${rows.length} repuestos, ${(size / 1024 / 1024).toFixed(1)} MB → ${SNAPSHOT_FILE}`);
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
