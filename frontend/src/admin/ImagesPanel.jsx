import React, { useCallback, useEffect, useRef, useState } from 'react';
import Icon from '../components/Icon.jsx';
import { api } from '../services/api.js';
import { useAsync } from '../hooks/useAsync.js';

/**
 * Imágenes de los repuestos de la lista IVECO.
 * - Por tipo de pieza: una imagen ilustrativa por denominación ("FILTRO COMBUSTIBLE") que se ve en
 *   todos los repuestos de ese tipo. Ordenado por cantidad: los primeros cubren la mayor parte del catálogo.
 * - Por código: la foto exacta de un repuesto (tiene prioridad sobre la del tipo).
 * Flujo rápido: "Google" abre la búsqueda de imágenes → clic derecho "Copiar imagen" → volver y Ctrl+V.
 */
const nf = new Intl.NumberFormat('es-AR');
const google = (q) => `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(q)}`;

function imageFromClipboard(event) {
  const files = [...(event.clipboardData?.files ?? [])];
  return files.find((f) => f.type.startsWith('image/')) ?? null;
}

function CopyFrom({ onCopy, onClose }) {
  const [code, setCode] = useState('');
  const submit = (e) => { e.preventDefault(); if (code.trim()) onCopy(code.trim().toUpperCase()); };
  return (
    <form className="img-copy" onSubmit={submit}>
      <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Código que ya tiene imagen" autoFocus aria-label="Código del que copiar la imagen" />
      <button className="btn btn--accent btn--sm" disabled={!code.trim()}>Usar su imagen</button>
      <button type="button" className="btn btn--ghost btn--sm" onClick={onClose}>Cancelar</button>
    </form>
  );
}

function Row({ thumb, title, subtitle, badge, queries, active, busy, error, onPick, onFile, onCopy, onRemove }) {
  const input = useRef(null);
  const [over, setOver] = useState(false);
  const [copying, setCopying] = useState(false);
  const drop = (e) => {
    e.preventDefault();
    setOver(false);
    const file = [...e.dataTransfer.files].find((f) => f.type.startsWith('image/'));
    if (file) onFile(file);
  };

  return (
    <li
      className={`img-row${active ? ' is-target' : ''}${over ? ' is-over' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={drop}
    >
      <div className="img-row__thumb">{thumb ? <img src={thumb} alt="" loading="lazy" /> : <Icon name="box" size={22} />}</div>
      <div className="img-row__text">
        <strong>{title}</strong>
        <small>{subtitle}{badge && <span className="chip">{badge}</span>}</small>
        {error && <small className="form-error">{error}</small>}
        {active && !busy && <small className="img-row__hint">Pegá la imagen acá con <kbd>Ctrl</kbd>+<kbd>V</kbd> (o arrastrala)</small>}
        {copying && !busy && <CopyFrom onCopy={async (code) => { if (await onCopy(code)) setCopying(false); }} onClose={() => setCopying(false)} />}
      </div>
      <div className="img-row__actions">
        {busy ? <span className="img-row__busy">Subiendo…</span> : (
          <>
            <a className="btn btn--ghost btn--sm" href={google(queries.name)} target="_blank" rel="noreferrer" onClick={onPick} title={queries.name}><Icon name="search" size={15} /> Google</a>
            {queries.code && <a className="btn btn--ghost btn--sm" href={google(queries.code)} target="_blank" rel="noreferrer" onClick={onPick} title={queries.code}><Icon name="search" size={15} /> Por código</a>}
            <button className={`btn btn--sm ${active ? 'btn--accent' : 'btn--ghost'}`} onClick={onPick}>Pegar</button>
            <button className="btn btn--ghost btn--sm" onClick={() => input.current?.click()}>Subir</button>
            <button className={`btn btn--sm ${copying ? 'btn--accent' : 'btn--ghost'}`} onClick={() => setCopying((v) => !v)}>Copiar de…</button>
            {onRemove && <button className="img-row__remove" onClick={onRemove} aria-label="Quitar imagen"><Icon name="trash" size={16} /></button>}
          </>
        )}
        <input ref={input} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) onFile(f); }} />
      </div>
    </li>
  );
}

export default function ImagesPanel({ onUnauthorized }) {
  const [mode, setMode] = useState('types'); // types | parts
  const [draft, setDraft] = useState('');
  const [q, setQ] = useState('');
  const [missing, setMissing] = useState(true);
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [page, setPage] = useState(1);
  const [target, setTarget] = useState(null); // { kind, key } que recibe el próximo Ctrl+V
  const [status, setStatus] = useState({}); // key → { busy, error }

  const guard = useCallback(async (fn) => {
    try { return await fn(); } catch (err) { if (err.status === 401) onUnauthorized(); throw err; }
  }, [onUnauthorized]);

  const types = useAsync((opts) => (mode === 'types'
    ? guard(() => api.admin.imageTypes({ q, categoria: category, faltantes: missing ? 1 : 0, pagina: page }, opts))
    : Promise.resolve(null)), [mode, q, category, missing, page]);
  // t: evita la caché del navegador del catálogo público para ver la imagen recién subida.
  const parts = useAsync((opts) => (mode === 'parts' && (q || category)
    ? api.search({ q, categoria: category, porPagina: 20, pagina: page, t: Date.now() }, opts)
    : Promise.resolve(null)), [mode, q, category, page]);
  useEffect(() => {
    const list = types.data?.categories ?? parts.data?.categories;
    if (list?.length) setCategories(list);
  }, [types.data, parts.data]);

  const run = useCallback(async (kind, key, action) => {
    setStatus((s) => ({ ...s, [key]: { busy: true } }));
    try {
      const img = await guard(action);
      if (kind === 'type') {
        types.setData((d) => d && { ...d, items: d.items.map((r) => (r.description === key ? { ...r, image: img } : r)) });
      } else {
        parts.setData((d) => d && { ...d, items: d.items.map((p) => (p.code === key ? { ...p, thumb: img.thumb, image: img.url, imageKind: 'exacta' } : p)) });
      }
      setStatus((s) => ({ ...s, [key]: {} }));
      setTarget(null);
      return true;
    } catch (err) {
      setStatus((s) => ({ ...s, [key]: { error: err.message } }));
      return false;
    }
  }, [guard, types, parts]);
  const upload = useCallback((kind, key, file) => run(kind, key, () => api.admin.uploadImage(kind, key, file)), [run]);
  const copy = (kind, key) => (from) => run(kind, key, () => api.admin.copyImage(kind, key, from));

  const remove = async (kind, key) => {
    if (!window.confirm('¿Quitar esta imagen?')) return;
    try {
      await guard(() => api.admin.removeImage(kind, key));
      if (kind === 'type') types.setData((d) => d && { ...d, items: d.items.map((r) => (r.description === key ? { ...r, image: null } : r)) });
      else parts.reload();
    } catch (err) {
      setStatus((s) => ({ ...s, [key]: { error: err.message } }));
    }
  };

  // Ctrl+V en cualquier parte del panel: va a la fila marcada.
  useEffect(() => {
    if (!target) return undefined;
    const onPaste = (e) => {
      const file = imageFromClipboard(e);
      if (!file) return;
      e.preventDefault();
      upload(target.kind, target.key, file);
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [target, upload]);

  const submit = (e) => { e.preventDefault(); setPage(1); setQ(draft.trim()); };
  const switchMode = (m) => { setMode(m); setPage(1); setTarget(null); };
  const pick = (kind, key) => () => setTarget({ kind, key });
  const isTarget = (kind, key) => target?.kind === kind && target?.key === key;

  const data = mode === 'types' ? types.data : parts.data;
  const loading = mode === 'types' ? types.loading : parts.loading;
  const cov = types.data?.coverage;

  return (
    <>
      <div className="admin__head">
        <div><p className="eyebrow">Catálogo</p><h1>Imágenes</h1></div>
      </div>

      {types.data && !types.data.storage && (
        <p className="admin-demo"><strong>Falta configurar Cloudflare R2.</strong> Cargá R2_ACCESS_KEY_ID y R2_SECRET_ACCESS_KEY en el backend para poder subir imágenes.</p>
      )}

      {cov && (
        <div className="admin-stats">
          <div><span>Con imagen de tipo</span><strong>{nf.format(cov.withImage)}</strong></div>
          <div><span>Cobertura</span><strong>{Math.round((cov.withImage / Math.max(1, cov.total)) * 100)}%</strong></div>
          <div><span>Tipos con imagen</span><strong>{nf.format(cov.types)}</strong></div>
          <div><span>Fotos exactas</span><strong>{nf.format(cov.exact)}</strong></div>
        </div>
      )}

      <div className="admin-card">
        <div className="admin-card__bar img-bar">
          <div className="img-tabs">
            <button className={mode === 'types' ? 'is-active' : ''} onClick={() => switchMode('types')}>Por tipo de pieza</button>
            <button className={mode === 'parts' ? 'is-active' : ''} onClick={() => switchMode('parts')}>Por código</button>
          </div>
          <select className="img-select" value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} aria-label="Categoría">
            <option value="">Todas las categorías</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          {mode === 'types' && (
            <label className="img-check"><input type="checkbox" checked={missing} onChange={(e) => { setMissing(e.target.checked); setPage(1); }} /> Solo sin imagen</label>
          )}
          <form className="search search--sm" onSubmit={submit}>
            <Icon name="search" size={17} />
            <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={mode === 'types' ? 'Filtrar tipos (ej. filtro)' : 'Código o nombre'} />
          </form>
        </div>

        <p className="img-help">
          {mode === 'types'
            ? 'La imagen de un tipo se muestra como "ilustrativa" en todos sus repuestos. Están ordenados por cantidad: empezá por arriba.'
            : 'La foto exacta tiene prioridad sobre la del tipo. Buscá por código o nombre, o elegí una categoría.'}
          {' '}Tocá <strong>Google</strong> (nombre + marca) o <strong>Por código</strong> (código + nombre + marca), copiá la imagen (clic derecho → Copiar imagen), volvé y pegala con <kbd>Ctrl</kbd>+<kbd>V</kbd>.
          {' '}Con <strong>Copiar de…</strong> usás la misma imagen que ya tiene otro código.
        </p>

        {loading && <p className="admin-empty">Cargando…</p>}
        {!loading && mode === 'parts' && !q && !category && <p className="admin-empty">Buscá un repuesto por código o nombre, o elegí una categoría.</p>}
        {!loading && data && !data.items.length && <p className="admin-empty">Sin resultados.</p>}

        {!loading && data?.items.length > 0 && (
          <ul className="img-list">
            {mode === 'types'
              ? data.items.map((r) => (
                <Row
                  key={r.description}
                  thumb={r.image?.thumb}
                  title={r.name}
                  subtitle={`${nf.format(r.count)} repuestos · ${r.category} · ej. ${r.codes.join(', ')}`}
                  queries={{ name: `${r.name} IVECO`, code: `${r.codes[0]} ${r.name} IVECO` }}
                  active={isTarget('type', r.description)}
                  {...status[r.description]}
                  onPick={pick('type', r.description)}
                  onFile={(f) => upload('type', r.description, f)}
                  onCopy={copy('type', r.description)}
                  onRemove={r.image ? () => remove('type', r.description) : null}
                />
              ))
              : data.items.map((p) => (
                <Row
                  key={p.id}
                  thumb={p.thumb}
                  title={p.name}
                  subtitle={`${p.code} · ${p.category}`}
                  badge={p.imageKind === 'ilustrativa' ? 'ilustrativa' : p.imageKind === 'exacta' ? 'foto exacta' : ''}
                  queries={{ name: `${p.name} ${p.manufacturer || 'IVECO'}`, code: `${p.code} ${p.name} ${p.manufacturer || 'IVECO'}` }}
                  active={isTarget('part', p.code)}
                  {...status[p.code]}
                  onPick={pick('part', p.code)}
                  onFile={(f) => upload('part', p.code, f)}
                  onCopy={copy('part', p.code)}
                  onRemove={p.imageKind === 'exacta' ? () => remove('part', p.code) : null}
                />
              ))}
          </ul>
        )}

        {data?.pages > 1 && (
          <div className="img-pager">
            <button className="btn btn--ghost btn--sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Anterior</button>
            <span>Página {data.page} de {nf.format(data.pages)}</span>
            <button className="btn btn--ghost btn--sm" disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)}>Siguiente</button>
          </div>
        )}
      </div>
    </>
  );
}
