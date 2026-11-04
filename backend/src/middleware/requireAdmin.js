import { createClient } from '@supabase/supabase-js';
import { config } from '../config.js';

/**
 * El panel inicia sesión con Supabase Auth (email + contraseña) y manda el access token (JWT).
 * Acá se verifica la firma con las claves del proyecto y, si hay ADMIN_EMAILS, que el email esté permitido.
 */
const supabase = config.supabaseUrl && config.supabaseKey
  ? createClient(config.supabaseUrl, config.supabaseKey, { auth: { persistSession: false, autoRefreshToken: false } })
  : null;

const deny = (res) => res.status(401).json({ error: 'No autorizado' });

export async function requireAdmin(req, res, next) {
  const header = req.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token || !supabase) return deny(res);

  let claims;
  try {
    const { data, error } = await supabase.auth.getClaims(token);
    if (error) return deny(res);
    claims = data?.claims;
  } catch {
    return deny(res); // token mal formado
  }
  if (!claims || claims.role !== 'authenticated' || claims.is_anonymous) return deny(res);
  const email = String(claims.email || '').toLowerCase();
  if (config.adminEmails.length && !config.adminEmails.includes(email)) return deny(res);
  req.admin = { id: claims.sub, email };
  next();
}
