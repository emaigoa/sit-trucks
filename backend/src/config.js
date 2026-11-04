import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const list = (value) => String(value || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);

export const config = {
  port: Number(process.env.PORT) || 4000,
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseKey: process.env.SUPABASE_PUBLISHABLE_KEY || '',
  // Emails con acceso al panel. Vacío = cualquier usuario de Supabase Auth (los registros deben estar deshabilitados).
  adminEmails: list(process.env.ADMIN_EMAILS),
  dataDir: path.join(root, 'data'),
  frontendDist: path.resolve(root, '..', 'frontend', 'dist'),
};

if (!config.supabaseUrl || !config.supabaseKey) {
  console.warn('[config] Falta SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY: el panel admin va a rechazar todos los ingresos.');
}
if (!config.adminEmails.length) {
  console.warn('[config] ADMIN_EMAILS vacío: cualquier usuario de Supabase Auth entra al admin. Mantené deshabilitados los registros.');
}
