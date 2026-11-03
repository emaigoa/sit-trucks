import React, { useEffect, useState } from 'react';
import Icon from '../components/Icon.jsx';

const blank = { code: '', oemCode: '', name: '', detail: '', category: '', stock: 0, badge: '', description: '', compatibility: '', image: '', thumb: '', manufacturer: '', origin: 'Alternativo', featured: false };

export default function ProductForm({ product, categories, origins = ['Original', 'Alternativo'], onSubmit, onClose }) {
  const [values, setValues] = useState(blank);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setValues(product ? { ...blank, ...product, compatibility: (product.compatibility || []).join(', ') } : { ...blank, category: categories[0] || '' });
    setErrors({});
  }, [product, categories]);

  const set = (key) => (e) => setValues((v) => ({ ...v, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await onSubmit({ ...values, stock: Number(values.stock) });
    } catch (err) {
      setErrors(err.details || { _: err.message });
    } finally {
      setBusy(false);
    }
  };

  const field = (key, label, props = {}) => (
    <label className={`field ${errors[key] ? 'has-error' : ''} ${props.full ? 'field--full' : ''}`}>
      <span>{label}</span>
      {props.textarea ? <textarea rows={3} value={values[key]} onChange={set(key)} /> : <input value={values[key]} onChange={set(key)} type={props.type || 'text'} min={props.min} />}
      {errors[key] && <small>{errors[key]}</small>}
    </label>
  );

  return (
    <div className="drawer" onMouseDown={onClose}>
      <form className="drawer__panel" onMouseDown={(e) => e.stopPropagation()} onSubmit={submit}>
        <header className="drawer__head">
          <h2>{product ? 'Editar repuesto' : 'Nuevo repuesto'}</h2>
          <button type="button" onClick={onClose} aria-label="Cerrar"><Icon name="close" /></button>
        </header>
        <div className="drawer__body form-grid">
          {field('code', 'Código')}
          <label className={`field ${errors.category ? 'has-error' : ''}`}>
            <span>Categoría</span>
            <select value={values.category} onChange={set('category')}>{categories.map((c) => <option key={c}>{c}</option>)}</select>
            {errors.category && <small>{errors.category}</small>}
          </label>
          {field('oemCode', 'Código OEM (opcional)', { full: true })}
          {field('name', 'Nombre', { full: true })}
          {field('detail', 'Detalle corto', { full: true })}
          {field('stock', 'Stock (unidades)', { type: 'number', min: 0 })}
          {field('manufacturer', 'Marca del repuesto (ej: Bosch)')}
          <label className={`field ${errors.origin ? 'has-error' : ''}`}>
            <span>Tipo</span>
            <select value={values.origin} onChange={set('origin')}>{origins.map((o) => <option key={o}>{o}</option>)}</select>
            {errors.origin && <small>{errors.origin}</small>}
          </label>
          {field('badge', 'Etiqueta (opcional)')}
          {field('compatibility', 'Compatible con, separado por comas (ej: IVECO = toda la línea, IVECO Daily, IVECO Tector)', { full: true })}
          {field('image', 'URL de foto (opcional)', { full: true })}
          {field('thumb', 'URL de miniatura (opcional, para el listado)', { full: true })}
          {field('description', 'Descripción', { full: true, textarea: true })}
          <label className="check field--full"><input type="checkbox" checked={values.featured} onChange={set('featured')} /> Destacado</label>
          {errors._ && <span className="form-error field--full">{errors._}</span>}
        </div>
        <footer className="drawer__foot">
          <button type="button" className="btn btn--ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn--accent" disabled={busy}>{busy ? 'Guardando…' : 'Guardar'}</button>
        </footer>
      </form>
    </div>
  );
}
