import React from 'react';

/** Atribución obligatoria de las fotos con licencia Creative Commons (Wikimedia Commons). */
export default function PhotoCredit({ credit, className = '' }) {
  if (!credit) return null;
  return (
    <a className={`photo-credit ${className}`} href={credit.url} target="_blank" rel="noreferrer">
      Foto: {credit.author} · {credit.license}
    </a>
  );
}
