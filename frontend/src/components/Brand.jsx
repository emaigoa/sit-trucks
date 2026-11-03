import React from 'react';
import { Link } from '../hooks/useRouter.jsx';

/** Marca: maza de rueda estilizada + logotipo. La marca gira levemente al hacer hover. */
export default function Brand({ compact = false }) {
  return (
    <Link className={`brand ${compact ? 'brand--compact' : ''}`} to="/" aria-label="Servicios Integrales Trucks, inicio">
      <svg className="brand__mark" viewBox="0 0 48 48" aria-hidden="true">
        <circle cx="24" cy="24" r="21" className="brand__ring" />
        <g className="brand__hub">
          <circle cx="24" cy="24" r="12" />
          {[0, 60, 120, 180, 240, 300].map((a) => (
            <circle key={a} cx={24 + 8 * Math.cos((a * Math.PI) / 180)} cy={24 + 8 * Math.sin((a * Math.PI) / 180)} r="1.6" className="brand__bolt" />
          ))}
          <circle cx="24" cy="24" r="3.4" className="brand__core" />
        </g>
      </svg>
      <span className="brand__type">
        <strong>Servicios Integrales</strong>
        <span>Trucks<i>·</i>Mar del Plata</span>
      </span>
    </Link>
  );
}
