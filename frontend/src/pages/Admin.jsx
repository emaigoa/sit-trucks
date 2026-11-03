import React, { useState } from 'react';
import Brand from '../components/Brand.jsx';
import Icon from '../components/Icon.jsx';
import AdminLogin from '../admin/AdminLogin.jsx';
import ProductsPanel from '../admin/ProductsPanel.jsx';
import InquiriesPanel from '../admin/InquiriesPanel.jsx';
import { adminToken, IS_STATIC } from '../services/api.js';
import { href } from '../hooks/useRouter.jsx';

const tabs = [
  { id: 'products', label: 'Repuestos', icon: 'box' },
  { id: 'inquiries', label: 'Consultas', icon: 'inbox' },
];

export default function Admin() {
  const [authed, setAuthed] = useState(() => Boolean(adminToken.get()));
  const [tab, setTab] = useState('products');

  const logout = () => { adminToken.clear(); setAuthed(false); };
  // Si la API rechaza el token, volvemos al login.
  const onUnauthorized = () => logout();

  if (!authed) return <AdminLogin onSuccess={() => setAuthed(true)} />;

  return (
    <div className="admin">
      <aside className="admin__side">
        <Brand compact />
        <nav>
          {tabs.map((t) => (
            <button key={t.id} className={tab === t.id ? 'is-active' : ''} onClick={() => setTab(t.id)}>
              <Icon name={t.icon} size={18} /> {t.label}
            </button>
          ))}
        </nav>
        <div className="admin__side-foot">
          <a href={href('/')}>Ver sitio <Icon name="arrowUpRight" size={15} /></a>
          <button onClick={logout}><Icon name="logout" size={17} /> Salir</button>
        </div>
      </aside>
      <main className="admin__main">
        {IS_STATIC && <p className="admin-demo"><strong>Modo demo.</strong> Podés probar todo: los cambios se ven en el catálogo mientras navegás, pero no se guardan y se pierden al recargar la página.</p>}
        {tab === 'products' ? <ProductsPanel onUnauthorized={onUnauthorized} /> : <InquiriesPanel onUnauthorized={onUnauthorized} />}
      </main>
    </div>
  );
}
