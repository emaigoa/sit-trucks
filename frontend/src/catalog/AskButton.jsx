import React from 'react';
import Icon from '../components/Icon.jsx';
import { useBusiness } from '../hooks/useBusiness.jsx';
import { useVehicle } from '../hooks/useVehicle.jsx';
import { buildMessage, whatsappLink } from '../utils/business.js';

/**
 * Los precios no se publican: este botón abre WhatsApp con el mensaje ya armado
 * (repuesto, código, OEM, camión del cliente y link a la ficha).
 */
export default function AskButton({ product, size = 'sm', block = false, label = 'Consultar precio' }) {
  const business = useBusiness();
  const { vehicle } = useVehicle();
  const href = whatsappLink(business, buildMessage({ product, vehicle }));
  if (!href) return null;
  return (
    <a
      className={`btn btn--wa btn--${size} ${block ? 'btn--block' : ''} ask-btn`}
      href={href}
      target="_blank"
      rel="noreferrer"
      onClick={(e) => e.stopPropagation()}
      aria-label={`${label} de ${product.name} por WhatsApp`}
    >
      <Icon name="whatsapp" size={size === 'lg' ? 19 : 16} /> {label}
    </a>
  );
}
