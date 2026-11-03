import React from 'react';
import { api } from '../services/api.js';
import { useAsync } from '../hooks/useAsync.js';

const statuses = ['nueva', 'respondida', 'archivada'];
const fmt = new Intl.DateTimeFormat('es-AR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Argentina/Buenos_Aires' });

export default function InquiriesPanel({ onUnauthorized }) {
  const inquiries = useAsync(async (opts) => {
    try { return await api.admin.inquiries(opts); } catch (err) { if (err.status === 401) onUnauthorized(); throw err; }
  }, []);

  const setStatus = async (item, status) => {
    const updated = await api.admin.setInquiryStatus(item.id, status);
    inquiries.setData((list) => list.map((i) => (i.id === updated.id ? updated : i)));
  };

  const list = inquiries.data ?? [];
  const pending = list.filter((i) => i.status === 'nueva').length;

  return (
    <>
      <div className="admin__head">
        <div><p className="eyebrow">Formulario web</p><h1>Consultas {pending > 0 && <span className="pill">{pending} nuevas</span>}</h1></div>
      </div>
      <div className="inquiries">
        {inquiries.loading && <p className="admin-empty">Cargando…</p>}
        {!inquiries.loading && !list.length && <p className="admin-empty">Todavía no llegaron consultas.</p>}
        {list.map((i) => (
          <article key={i.id} className={`inquiry inquiry--${i.status}`}>
            <header>
              <strong>{i.name}</strong>
              <span className="mono">{i.contact}</span>
              <time>{fmt.format(new Date(i.createdAt))}</time>
            </header>
            <div className="inquiry__tags">
              <span className={`chip ${i.type === 'mayorista' ? 'chip--accent' : ''}`}>{i.type === 'mayorista' ? `Mayorista · ${i.businessKind}` : 'Consulta'}</span>
              {i.company && <span className="chip">{i.company}{i.city ? ` · ${i.city}` : ''}</span>}
              {i.vehicle?.brand && <span className="chip">{[i.vehicle.brand, i.vehicle.model, i.vehicle.year].filter(Boolean).join(' ')}</span>}
              {i.productCode && <span className="chip mono">{i.productCode}</span>}
            </div>
            {i.message && <p>{i.message}</p>}
            <div className="inquiry__status">
              {statuses.map((s) => <button key={s} className={i.status === s ? 'is-active' : ''} onClick={() => setStatus(i, s)}>{s}</button>)}
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
