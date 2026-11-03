import React from 'react';
import { Link, href } from '../hooks/useRouter.jsx';

/** Marca: logo circular del negocio + nombre. El logo gira levemente al hacer hover. */
export default function Brand({ compact = false, large = false }) {
  return (
    <Link className={`brand ${compact ? 'brand--compact' : ''} ${large ? 'brand--large' : ''}`} to="/" aria-label="Servicios Integrales Truck, inicio">
      <img
        className="brand__mark"
        src={href(large ? '/img/logo/logo-512.webp' : '/img/logo/logo-160.webp')}
        alt=""
        width={large ? 112 : 46}
        height={large ? 112 : 46}
        decoding="async"
      />
      <span className="brand__type">
        <strong>Servicios Integrales</strong>
        <span>Truck<i>·</i>Repuestos IVECO MDQ</span>
      </span>
    </Link>
  );
}
