/** Utilidades puras sobre los datos del negocio (horarios, links). */

const toMinutes = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

/** Hora actual en Argentina, sin depender de la zona horaria del visitante. */
export function nowInArgentina(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Argentina/Buenos_Aires', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(date);
  const get = (type) => parts.find((p) => p.type === type)?.value;
  const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
  return { day, minutes: Number(get('hour')) * 60 + Number(get('minute')) };
}

const fmt = (mins) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h ? `${h} h${m ? ` ${m} min` : ''}` : `${m} min`;
};

export function openStatus(hours = [], date = new Date()) {
  if (!hours.length) return { open: false, label: '' };
  const { day, minutes } = nowInArgentina(date);
  const today = hours.find((h) => h.day === day);

  if (today?.open && minutes >= toMinutes(today.open) && minutes < toMinutes(today.close)) {
    const left = toMinutes(today.close) - minutes;
    return { open: true, closingSoon: left <= 45, label: left <= 45 ? `Cierra en ${fmt(left)}` : `Abierto · hasta las ${today.close}` };
  }
  if (today?.open && minutes < toMinutes(today.open)) {
    return { open: false, label: `Abre hoy a las ${today.open}` };
  }
  for (let i = 1; i <= 7; i += 1) {
    const next = hours.find((h) => h.day === (day + i) % 7);
    if (next?.open) return { open: false, label: `Abre ${i === 1 ? 'mañana' : `el ${next.label.toLowerCase()}`} a las ${next.open}` };
  }
  return { open: false, label: 'Cerrado' };
}

/** Agrupa días consecutivos con el mismo horario: "Lun – Vie  08:00 – 17:00". */
export function groupedHours(hours = []) {
  const order = [1, 2, 3, 4, 5, 6, 0];
  const sorted = order.map((d) => hours.find((h) => h.day === d)).filter(Boolean);
  const groups = [];
  for (const h of sorted) {
    const range = h.open ? `${h.open} – ${h.close}` : 'Cerrado';
    const last = groups[groups.length - 1];
    if (last && last.range === range) last.to = h.label;
    else groups.push({ from: h.label, to: null, range, days: [] });
    groups[groups.length - 1].days.push(h.day);
  }
  return groups.map((g) => ({ ...g, label: g.to ? `${g.from.slice(0, 3)} – ${g.to.slice(0, 3)}` : g.from }));
}

/**
 * Estado del despacho en el día: cuánto falta para la hora de corte de hoy,
 * o cuándo sale el próximo despacho si ya pasó.
 */
export function dispatchStatus(dispatch, date = new Date()) {
  if (!dispatch?.sameDay || !dispatch.cutoffs) return null;
  const { day, minutes } = nowInArgentina(date);
  const cutoff = dispatch.cutoffs[day];
  if (cutoff && minutes < toMinutes(cutoff)) {
    const left = toMinutes(cutoff) - minutes;
    return { today: true, left, cutoff, label: `Pedí en ${fmt(left)} y sale hoy`, short: fmt(left) };
  }
  const names = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  for (let i = 1; i <= 7; i += 1) {
    const d = (day + i) % 7;
    if (dispatch.cutoffs[d]) {
      return { today: false, cutoff: dispatch.cutoffs[d], label: `Próximo despacho: ${i === 1 ? 'mañana' : names[d]}`, short: i === 1 ? 'mañana' : names[d] };
    }
  }
  return null;
}

/** Texto prolijo para WhatsApp a partir del vehículo y el repuesto. */
export function buildMessage({ vehicle, product, extra } = {}) {
  const v = vehicle && [vehicle.brand, vehicle.model, vehicle.year].filter(Boolean).join(' ');
  if (product) {
    // Mensaje de consulta de precio: una línea por dato para que el vendedor lo lea de un vistazo.
    const lines = [
      'Hola, quería consultar precio y disponibilidad de este repuesto:',
      `• ${product.name}`,
      `• Código: ${product.code}${product.oemCode ? ` · OEM ${product.oemCode}` : ''}`,
    ];
    if (v) lines.push(`• Mi camión: ${v}`);
    if (typeof window !== 'undefined') lines.push(`${window.location.origin}${import.meta.env.BASE_URL}producto/${encodeURIComponent(product.id)}`);
    if (extra) lines.push(extra);
    return lines.join('\n');
  }
  const parts = ['Hola, quería consultar por un repuesto.'];
  if (v) parts.push(`Mi camión: ${v}.`);
  if (extra) parts.push(extra);
  return parts.join(' ');
}

export function whatsappLink(business, text, number = business?.phone?.whatsapp) {
  if (!number) return null;
  return `https://wa.me/${number}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
}

export const directionsLink = (business) =>
  business?.geo ? `https://www.google.com/maps/dir/?api=1&destination=${business.geo.lat},${business.geo.lng}` : business?.mapsUrl;

export const mapEmbed = (business) =>
  business?.geo ? `https://maps.google.com/maps?q=${business.geo.lat},${business.geo.lng}&z=16&output=embed` : null;
