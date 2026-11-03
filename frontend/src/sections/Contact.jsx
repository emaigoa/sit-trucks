import React from 'react';
import Icon from '../components/Icon.jsx';
import Reveal from '../components/Reveal.jsx';
import InquiryForm from '../components/InquiryForm.jsx';
import { useBusiness } from '../hooks/useBusiness.jsx';
import { whatsappLink } from '../utils/business.js';

export default function Contact() {
  const b = useBusiness();
  const wa = whatsappLink(b, 'Hola, quería consultar por un repuesto.');
  return (
    <section className="section contact" id="contacto">
      <div className="container contact__grid">
        <Reveal>
          <p className="eyebrow eyebrow--light"><span className="tick" /> 05 — Consultas</p>
          <h2 className="section-title section-title--light">¿No encontrás<br />la pieza?</h2>
          <p className="contact__lead">Contanos qué necesitás y la buscamos. Lo más rápido es WhatsApp; si preferís, dejanos el pedido y te contactamos.</p>
          {wa && <a className="btn btn--dark btn--lg" href={wa} target="_blank" rel="noreferrer"><Icon name="whatsapp" size={20} /> Escribir por WhatsApp</a>}
        </Reveal>
        <Reveal delay={120} className="contact__card">
          <InquiryForm />
        </Reveal>
      </div>
    </section>
  );
}
