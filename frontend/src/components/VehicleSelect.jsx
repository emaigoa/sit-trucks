import React from 'react';
import { useBusiness } from '../hooks/useBusiness.jsx';
import { yearOptions } from '../utils/vehicle.js';

/** Tres selects encadenados: marca → modelo → año. Controlado desde afuera. */
export default function VehicleSelect({ value, onChange, dark = false, compact = false }) {
  const business = useBusiness();
  const brands = business?.brands ?? [];
  const models = brands.find((b) => b.name === value.brand)?.models ?? [];
  const years = yearOptions(business?.vehicleYears?.from);

  const set = (patch) => onChange({ ...value, ...patch });

  return (
    <div className={`vehicle-select ${dark ? 'vehicle-select--dark' : ''} ${compact ? 'vehicle-select--compact' : ''}`}>
      <label className="vehicle-select__field">
        <span>Marca</span>
        <select value={value.brand} onChange={(e) => set({ brand: e.target.value, model: '' })}>
          <option value="">Elegí la marca</option>
          {brands.map((b) => <option key={b.id} value={b.name}>{b.name}</option>)}
        </select>
      </label>
      <label className="vehicle-select__field">
        <span>Modelo</span>
        <select value={value.model} onChange={(e) => set({ model: e.target.value })} disabled={!value.brand}>
          <option value="">{value.brand ? 'Todos los modelos' : '—'}</option>
          {models.map((m) => <option key={m}>{m}</option>)}
        </select>
      </label>
      <label className="vehicle-select__field">
        <span>Año</span>
        <select value={value.year} onChange={(e) => set({ year: e.target.value })} disabled={!value.brand}>
          <option value="">{value.brand ? 'Cualquiera' : '—'}</option>
          {years.map((y) => <option key={y}>{y}</option>)}
        </select>
      </label>
    </div>
  );
}
