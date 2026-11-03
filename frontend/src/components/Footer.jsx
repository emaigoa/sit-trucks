import React from 'react';
import Brand from './Brand.jsx';
import { useBusiness } from '../hooks/useBusiness.jsx';
import { groupedHours } from '../utils/business.js';
import { IS_STATIC } from '../services/api.js';
import { Link } from '../hooks/useRouter.jsx';

export default function Footer() {
  const b = useBusiness();
  return (
    <footer className="site-footer">
      <div className="container site-footer__grid">
        <div>
          <Brand large />
          <p className="site-footer__claim">Repuestos IVECO.<br />Atención directa, de mostrador.</p>
        </div>
        {b && (
          <>
            <div>
              <h4>Dirección</h4>
              <p>{b.address.street}<br />{b.address.city}, {b.address.region}</p>
            </div>
            <div>
              <h4>Contacto</h4>
              <p><a href={`tel:${b.phone.tel}`}>{b.phone.display}</a></p>
            </div>
            <div>
              <h4>Horarios</h4>
              <ul className="site-footer__hours">{groupedHours(b.hours).map((g) => <li key={g.label}><span>{g.label}</span><span>{g.range}</span></li>)}</ul>
            </div>
          </>
        )}
      </div>
      <div className="container site-footer__legal">
        <span>© {new Date().getFullYear()} Servicios Integrales Trucks</span>
        <Link to="/admin">{IS_STATIC ? 'Panel admin (demo)' : 'Acceso administración'}</Link>
      </div>
    </footer>
  );
}
