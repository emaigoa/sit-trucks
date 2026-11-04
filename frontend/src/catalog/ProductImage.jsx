import React, { useState } from 'react';
import PartSchematic from '../components/PartSchematic.jsx';

/** Foto del repuesto con fallback al dibujo técnico de la categoría si no hay foto o no carga. */
export default function ProductImage({ product, large = false, className = '' }) {
  const [failed, setFailed] = useState(false);
  const src = large ? product.image || product.thumb : product.thumb || product.image;
  if (!src || failed) return <PartSchematic category={product.category} className={`product-image product-image--drawn ${className}`} />;
  const img = (
    <img
      className={`product-image ${className}`}
      src={src}
      alt={product.name}
      loading={large ? 'eager' : 'lazy'}
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  );
  // Imagen del tipo de pieza (no del código exacto): se aclara para no confundir al cliente.
  if (product.imageKind !== 'ilustrativa') return img;
  return <span className="product-image-wrap">{img}<span className="product-image__note">Imagen ilustrativa</span></span>;
}
