import React, { useEffect, useState } from 'react';
import Icon from './Icon.jsx';
import { useBusiness } from '../hooks/useBusiness.jsx';
import { useVehicle } from '../hooks/useVehicle.jsx';
import { useRouter } from '../hooks/useRouter.jsx';
import { buildMessage, whatsappLink } from '../utils/business.js';

const SEEN_KEY = 'sit-wa-bubble-closed';
const wasClosed = () => { try { return sessionStorage.getItem(SEEN_KEY) === '1'; } catch { return false; } };

/**
 * Botón flotante de WhatsApp + burbuja que aparece sola una vez por visita.
 * Si hay más de un vendedor cargado, la burbuja permite elegir con quién hablar.
 * El mensaje incluye el camión elegido en el buscador, si lo hay.
 */
export default function WhatsAppFab() {
  const business = useBusiness();
  const { vehicle } = useVehicle();
  const { path } = useRouter();
  const [visible, setVisible] = useState(false);
  const [bubble, setBubble] = useState(false);
  const [closed, setClosed] = useState(wasClosed);

  useEffect(() => {
    const onScroll = () => setVisible(path !== '/' || window.scrollY > window.innerHeight * 0.5);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [path]);

  useEffect(() => {
    if (!visible || closed) return undefined;
    const id = setTimeout(() => setBubble(true), 6000);
    return () => clearTimeout(id);
  }, [visible, closed]);

  const close = () => {
    setBubble(false);
    setClosed(true);
    try { sessionStorage.setItem(SEEN_KEY, '1'); } catch { /* sin storage */ }
  };

  if (!business) return null;
  const sellers = business.sellers?.length ? business.sellers : [{ name: 'Mostrador', whatsapp: business.phone.whatsapp }];
  const message = buildMessage({ vehicle });
  
  return (
    <div className={`wa ${visible ? 'is-visible' : ''}`}>
      {bubble && (
        <div className="wa__bubble" role="dialog" aria-label="Asistencia por WhatsApp">
          <button className="wa__close" onClick={close} aria-label="Cerrar"><Icon name="close" size={14} /></button>
          <p><strong>¿Buscás un repuesto para tu {[vehicle.brand || 'IVECO', vehicle.model].filter(Boolean).join(' ')}?</strong> Pasanos modelo y año del camión y te confirmamos stock en el momento.</p>
          {sellers.length > 1 ? (
            <div className="wa__sellers">
              {sellers.map((s) => (
                <a key={s.name} href={whatsappLink(business, message, s.whatsapp)} target="_blank" rel="noreferrer" onClick={close}>
                  <span className="wa__avatar">{s.name.charAt(0)}</span>
                  <span><strong>{s.name}</strong><small>{s.role}</small></span>
                </a>
              ))}
            </div>
          ) : (
            <a className="wa__start" href={whatsappLink(business, message, sellers[0].whatsapp)} target="_blank" rel="noreferrer" onClick={close}>Iniciar chat <Icon name="arrow" size={15} /></a>
          )}
        </div>
      )}
      <a className="wa-fab" href={whatsappLink(business, message, sellers[0].whatsapp)} target="_blank" rel="noreferrer" aria-label="Escribinos por WhatsApp" onClick={() => bubble && close()}>
        <Icon name="whatsapp" size={24} />
        <span>Escribinos</span>
        {!closed && !bubble && <i className="wa-fab__dot" />}
      </a>
    </div>
  );
}
