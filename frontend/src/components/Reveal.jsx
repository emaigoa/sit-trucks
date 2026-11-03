import React from 'react';
import { useReveal } from '../hooks/useReveal.js';

/** Envuelve contenido y lo anima al entrar en pantalla. `delay` en ms para escalonar. */
export default function Reveal({ as: Tag = 'div', delay = 0, variant = 'up', className = '', children, ...rest }) {
  const [ref, visible] = useReveal();
  return (
    <Tag ref={ref} className={`reveal reveal--${variant} ${visible ? 'is-visible' : ''} ${className}`} style={{ '--delay': `${delay}ms` }} {...rest}>
      {children}
    </Tag>
  );
}
