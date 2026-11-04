/**
 * Sesión del panel admin.
 * - Sitio real: Supabase Auth con email + contraseña (los usuarios se crean desde el dashboard de
 *   Supabase; el registro público está deshabilitado). El backend verifica el JWT.
 * - Demo estática (GitHub Pages): cualquier clave entra, la "sesión" vive en sessionStorage.
 */
const IS_STATIC = import.meta.env.VITE_STATIC === '1';
const DEMO_KEY = 'sit-admin-demo';

let clientPromise;
function client() {
  if (!clientPromise) {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    clientPromise = url && key
      ? import('@supabase/supabase-js').then(({ createClient }) => createClient(url, key))
      : Promise.reject(new Error('Faltan VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY'));
  }
  return clientPromise;
}

const demo = {
  get: () => { try { return sessionStorage.getItem(DEMO_KEY) === '1'; } catch { return false; } },
  set: (on) => { try { on ? sessionStorage.setItem(DEMO_KEY, '1') : sessionStorage.removeItem(DEMO_KEY); } catch { /* sin storage */ } },
};

const MESSAGES = {
  invalid_credentials: 'Email o contraseña incorrectos.',
  email_not_confirmed: 'El email todavía no está confirmado.',
  over_request_rate_limit: 'Demasiados intentos. Esperá un momento y probá de nuevo.',
};

export const auth = {
  async signIn(email, password) {
    if (IS_STATIC) return demo.set(true);
    const supabase = await client();
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) throw new Error(MESSAGES[error.code] || 'No se pudo iniciar sesión.');
  },

  async signOut() {
    if (IS_STATIC) return demo.set(false);
    const supabase = await client().catch(() => null);
    await supabase?.auth.signOut();
  },

  /** Access token vigente (Supabase lo renueva solo) o '' si no hay sesión. */
  async token() {
    if (IS_STATIC) return demo.get() ? 'demo' : '';
    const supabase = await client().catch(() => null);
    const { data } = (await supabase?.auth.getSession()) ?? {};
    return data?.session?.access_token || '';
  },

  async user() {
    if (IS_STATIC) return demo.get() ? { email: 'demo' } : null;
    const supabase = await client().catch(() => null);
    const { data } = (await supabase?.auth.getSession()) ?? {};
    return data?.session?.user ?? null;
  },
};
