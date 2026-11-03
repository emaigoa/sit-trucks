import React, { useState } from 'react';
import Icon from './Icon.jsx';
import VehicleSelect from './VehicleSelect.jsx';
import { api, IS_STATIC } from '../services/api.js';
import { useBusiness } from '../hooks/useBusiness.jsx';
import { whatsappLink } from '../utils/business.js';

/** En la demo estática no hay servidor que reciba el formulario: se ofrece WhatsApp directo. */
function DemoNotice({ initialMessage }) {
  const business = useBusiness();
  const wa = whatsappLink(business, initialMessage || 'Hola, quería hacer una consulta.');
  return (
    <div className="form-done" role="note">
      <span className="form-done__icon"><Icon name="whatsapp" size={26} /></span>
      <strong>Consultas por WhatsApp</strong>
      <p>En esta versión de prueba el formulario no envía datos. Escribinos y te respondemos al momento.</p>
      {wa && <a className="btn btn--accent btn--sm" href={wa} target="_blank" rel="noreferrer"><Icon name="whatsapp" size={16} /> Escribir por WhatsApp</a>}
    </div>
  );
}

const emptyVehicle = { brand: '', model: '', year: '' };
const empty = { name: '', contact: '', message: '', website: '' };

export default function InquiryForm(props) {
  return IS_STATIC ? <DemoNotice initialMessage={props.initialMessage} /> : <InquiryFormFields {...props} />;
}

function InquiryFormFields({ productCode = '', initialMessage = '', initialVehicle = emptyVehicle, compact = false }) {
  const [values, setValues] = useState({ ...empty, message: initialMessage });
  const [vehicle, setVehicle] = useState(initialVehicle);
  const [errors, setErrors] = useState({});
  const [state, setState] = useState('idle'); // idle | sending | sent | error
  const [errorMessage, setErrorMessage] = useState('');

  const set = (key) => (event) => setValues((v) => ({ ...v, [key]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setState('sending');
    setErrors({});
    try {
      await api.sendInquiry({ ...values, productCode, vehicle, type: 'consulta' });
      setState('sent');
      setValues({ ...empty });
      setVehicle(emptyVehicle);
    } catch (error) {
      setErrors(error.details || {});
      setErrorMessage(error.details ? 'Revisá los campos marcados.' : error.message);
      setState('error');
    }
  };

  if (state === 'sent') {
    return (
      <div className="form-done" role="status">
        <span className="form-done__icon"><Icon name="check" size={26} stroke={2.2} /></span>
        <strong>Recibimos tu consulta</strong>
        <p>Te respondemos dentro del horario de atención.</p>
        <button className="btn btn--ghost btn--sm" onClick={() => setState('idle')}>Enviar otra</button>
      </div>
    );
  }

  return (
    <form className={`inquiry-form ${compact ? 'inquiry-form--compact' : ''}`} onSubmit={submit} noValidate>
      <label className={`field ${errors.name ? 'has-error' : ''}`}>
        <span>Nombre</span>
        <input value={values.name} onChange={set('name')} autoComplete="name" placeholder="Cómo te llamás" />
        {errors.name && <small>{errors.name}</small>}
      </label>
      <label className={`field ${errors.contact ? 'has-error' : ''}`}>
        <span>Teléfono o email</span>
        <input value={values.contact} onChange={set('contact')} autoComplete="tel" placeholder="Para responderte" />
        {errors.contact && <small>{errors.contact}</small>}
      </label>
      <div className="field--full">
        <VehicleSelect value={vehicle} onChange={setVehicle} compact />
        {errors.year && <small className="form-error">{errors.year}</small>}
      </div>
      <label className={`field field--full ${errors.message ? 'has-error' : ''}`}>
        <span>¿Qué necesitás?</span>
        <textarea rows={compact ? 3 : 4} value={values.message} onChange={set('message')} placeholder="Repuesto, código interno u OEM, cantidad…" />
        {errors.message && <small>{errors.message}</small>}
      </label>
      <input className="hp" tabIndex={-1} autoComplete="off" value={values.website} onChange={set('website')} aria-hidden="true" />
      <div className="inquiry-form__foot field--full">
        {state === 'error' && <span className="form-error">{errorMessage}</span>}
        <button className="btn btn--accent" disabled={state === 'sending'}>
          {state === 'sending' ? 'Enviando…' : <>Enviar consulta <Icon name="send" size={17} /></>}
        </button>
      </div>
    </form>
  );
}
