import React, { useState } from 'react';
import Brand from '../components/Brand.jsx';
import { auth, api } from '../services/api.js';
import { href } from '../hooks/useRouter.jsx';

export default function AdminLogin({ onSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await auth.signIn(email, password);
      try {
        await api.admin.stats(); // confirma que el backend acepta la sesión
      } catch (err) {
        await auth.signOut();
        throw new Error(err.status === 401 ? 'Tu usuario no tiene acceso al panel.' : 'No se pudo conectar con la API.');
      }
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="admin-login">
      <form className="admin-login__card" onSubmit={submit}>
        <Brand compact />
        <h1>Panel de administración</h1>
        <p>Ingresá con tu usuario de administrador.</p>
        <label className="field">
          <span>Email</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus autoComplete="username" required />
        </label>
        <label className="field">
          <span>Contraseña</span>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
        </label>
        {error && <span className="form-error">{error}</span>}
        <button className="btn btn--accent btn--block" disabled={busy || !email || !password}>{busy ? 'Verificando…' : 'Ingresar'}</button>
        <a className="admin-login__back" href={href('/')}>← Volver al sitio</a>
      </form>
    </div>
  );
}
