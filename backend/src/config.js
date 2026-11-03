import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const config = {
  port: Number(process.env.PORT) || 4000,
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  adminToken: process.env.ADMIN_TOKEN || 'dev-admin',
  dataDir: path.join(root, 'data'),
  frontendDist: path.resolve(root, '..', 'frontend', 'dist'),
};

if (!process.env.ADMIN_TOKEN) {
  console.warn('[config] ADMIN_TOKEN no definido: usando "dev-admin" (solo para desarrollo).');
}
