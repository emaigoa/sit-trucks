import React, { createContext, useContext } from 'react';
import { api } from '../services/api.js';
import { useAsync } from './useAsync.js';

const BusinessContext = createContext(null);

export function BusinessProvider({ children }) {
  const { data } = useAsync((opts) => api.business(opts), []);
  return <BusinessContext.Provider value={data}>{children}</BusinessContext.Provider>;
}

/** Datos del negocio (nombre, dirección, horarios, reseñas). null mientras carga. */
export const useBusiness = () => useContext(BusinessContext);
