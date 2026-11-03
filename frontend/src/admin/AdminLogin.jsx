import React, { useState } from 'react';
import Brand from '../components/Brand.jsx';
import { adminToken, api, IS_STATIC } from '../services/api.js';
import { href } from '../hooks/useRouter.jsx';

export default function AdminLogin({ onSuccess }) {
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    adminToken.set(token.trim());
    try {
      await api.admin.stats();
      onSuccess();
    } catch (err) {
      adminToken.clear();
      setError(err.status === 401 ? 'Token incorrecto.' : 'No se pudo conectar con la API.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="admin-login">
      <form className="admin-login__card" onSubmit={submit}>
        <Brand compact />
        <h1>Panel de administración</h1>
        {IS_STATIC
          ? <p className="admin-login__demo">Versión de demostración: ingresá con <strong>cualquier clave</strong>. Los cambios no se guardan.</p>
          : <p>Ingresá el token configurado en <code>ADMIN_TOKEN</code> del backend.</p>}
        <label className="field">
          <span>Token</span>
          <input type="password" value={token} onChange={(e) => setToken(e.target.value)} autoFocus autoComplete="current-password" />
        </label>
        {error && <span className="form-error">{error}</span>}
        <button className="btn btn--accent btn--block" disabled={busy || !token}>{busy ? 'Verificando…' : 'Ingresar'}</button>
        <a className="admin-login__back" href={href('/')}>← Volver al sitio</a>
      </form>
    </div>
  );
}
