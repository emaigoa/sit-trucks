import React, { createContext, useContext, useMemo, useState } from 'react';

/**
 * Camión elegido por el visitante (buscador de la home o filtros del catálogo).
 * Se guarda en sessionStorage para que el mensaje de WhatsApp lo incluya en cualquier página.
 */
const KEY = 'sit-vehicle';
export const emptyVehicle = { brand: '', model: '', year: '' };
const VehicleContext = createContext(null);

const load = () => {
  try { return { ...emptyVehicle, ...JSON.parse(sessionStorage.getItem(KEY) || '{}') }; } catch { return emptyVehicle; }
};

export function VehicleProvider({ children }) {
  const [vehicle, setState] = useState(load);
  const value = useMemo(() => {
    const setVehicle = (next) => {
      const v = { ...emptyVehicle, ...next };
      setState((prev) => (prev.brand === v.brand && prev.model === v.model && prev.year === v.year ? prev : v));
      try { sessionStorage.setItem(KEY, JSON.stringify(v)); } catch { /* sin storage */ }
    };
    return { vehicle, setVehicle, clearVehicle: () => setVehicle(emptyVehicle) };
  }, [vehicle]);
  return <VehicleContext.Provider value={value}>{children}</VehicleContext.Provider>;
}

export const useVehicle = () => useContext(VehicleContext);
