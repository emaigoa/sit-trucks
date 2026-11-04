import React, { useMemo, useState } from 'react';
import Icon from '../components/Icon.jsx';
import ProductForm from './ProductForm.jsx';
import { api } from '../services/api.js';
import { useAsync } from '../hooks/useAsync.js';

export default function ProductsPanel({ onUnauthorized }) {
  const products = useAsync((opts) => api.products(opts), []);
  const summary = useAsync(() => api.admin.stats().catch(() => null), []);
  const [editing, setEditing] = useState(null); // null | 'new' | product
  const [query, setQuery] = useState('');
  const [toast, setToast] = useState('');

  const items = products.data?.items ?? [];
  const categories = products.data?.categories ?? [];
  const stats = useMemo(() => ({
    total: items.length,
    ok: items.filter((p) => p.stock > 5).length,
    low: items.filter((p) => p.stock > 0 && p.stock <= 5).length,
    out: items.filter((p) => p.stock === 0).length,
  }), [items]);

  const filtered = items.filter((p) => `${p.name} ${p.code} ${p.category}`.toLowerCase().includes(query.toLowerCase()));

  const flash = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2400); };
  const guard = async (fn) => {
    try { return await fn(); } catch (err) { if (err.status === 401) onUnauthorized(); throw err; }
  };

  const save = async (values) => {
    if (editing === 'new') {
      const created = await guard(() => api.admin.createProduct(values));
      products.setData((d) => ({ ...d, items: [created, ...d.items] }));
      flash('Repuesto creado');
    } else {
      const updated = await guard(() => api.admin.updateProduct(editing.id, values));
      products.setData((d) => ({ ...d, items: d.items.map((p) => (p.id === updated.id ? updated : p)) }));
      flash('Cambios guardados');
    }
    setEditing(null);
  };

  const remove = async (product) => {
    if (!window.confirm(`¿Eliminar "${product.name}"? Esta acción no se puede deshacer.`)) return;
    await guard(() => api.admin.deleteProduct(product.id));
    products.setData((d) => ({ ...d, items: d.items.filter((p) => p.id !== product.id) }));
    flash('Repuesto eliminado');
  };

  const quickStock = async (product, delta) => {
    const stock = Math.max(0, product.stock + delta);
    const updated = await guard(() => api.admin.updateProduct(product.id, { stock }));
    products.setData((d) => ({ ...d, items: d.items.map((p) => (p.id === updated.id ? updated : p)) }));
  };

  return (
    <>
      <div className="admin__head">
        <div><p className="eyebrow">Inventario</p><h1>Repuestos propios</h1></div>
        <button className="btn btn--accent" onClick={() => setEditing('new')}><Icon name="plus" size={18} /> Agregar</button>
      </div>

      {summary.data?.list > 0 && (
        <p className="img-help">
          La lista IVECO ({new Intl.NumberFormat('es-AR').format(summary.data.list)} repuestos) ya se publica sola en el catálogo, siempre con stock.
          Acá cargás productos propios (alternativos, usados, con foto y stock real), que se suman a la lista.
        </p>
      )}

      <div className="admin-stats">
        <div><span>Total</span><strong>{stats.total}</strong></div>
        <div><span>Con stock</span><strong>{stats.ok}</strong></div>
        <div className="is-warn"><span>Stock bajo</span><strong>{stats.low}</strong></div>
        <div className="is-bad"><span>Sin stock</span><strong>{stats.out}</strong></div>
      </div>

      <div className="admin-card">
        <div className="admin-card__bar">
          <label className="search search--sm"><Icon name="search" size={17} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filtrar" /></label>
        </div>
        {products.loading ? <p className="admin-empty">Cargando…</p> : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Repuesto</th><th>Código</th><th>Categoría</th><th>Stock</th><th /></tr></thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id}>
                    <td><strong>{p.name}</strong><small>{p.detail}</small></td>
                    <td className="mono">{p.code}{p.oemCode && <small>OEM {p.oemCode}</small>}</td>
                    <td><span className="chip">{p.category}</span></td>
                    <td>
                      <div className={`stepper ${p.stock === 0 ? 'is-bad' : p.stock <= 5 ? 'is-warn' : ''}`}>
                        <button onClick={() => quickStock(p, -1)} disabled={p.stock === 0} aria-label="Restar uno">−</button>
                        <span>{p.stock}</span>
                        <button onClick={() => quickStock(p, 1)} aria-label="Sumar uno">+</button>
                      </div>
                    </td>
                    <td className="table__actions">
                      <button onClick={() => setEditing(p)} aria-label={`Editar ${p.name}`}><Icon name="edit" size={17} /></button>
                      <button onClick={() => remove(p)} aria-label={`Eliminar ${p.name}`}><Icon name="trash" size={17} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!filtered.length && <p className="admin-empty">Sin resultados.</p>}
          </div>
        )}
      </div>

      {editing && <ProductForm product={editing === 'new' ? null : editing} categories={categories} origins={products.data?.origins} onSubmit={save} onClose={() => setEditing(null)} />}
      {toast && <div className="toast" role="status">{toast}</div>}
    </>
  );
}
