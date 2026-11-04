import React, { useCallback, useEffect, useRef, useState } from 'react';
import Icon from '../components/Icon.jsx';
import { api } from '../services/api.js';
import { useAsync } from '../hooks/useAsync.js';

/**
 * Imágenes de los repuestos de la lista IVECO.
 * - Por tipo de pieza: una imagen ilustrativa por denominación ("FILTRO COMBUSTIBLE") que se ve en
 *   todos los repuestos de ese tipo. Ordenado por cantidad: los primeros cubren la mayor parte del catálogo.
 *   "Códigos" despliega todos los códigos del tipo (de a 25) para cargar la foto exacta de cada uno.
 * - Por código: la foto exacta de un repuesto (tiene prioridad sobre la del tipo).
 * Flujo rápido: "Google" abre la búsqueda de imágenes → clic derecho "Copiar imagen" → volver y Ctrl+V.
 * "Copiar de…" usa la misma imagen que ya tiene otro código (no se sube de nuevo).
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

function Row({ thumb, title, subtitle, badge, queries, active, busy, error, onPick, onFile, onCopy, onRemove, extra }) {
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
        {extra && <div className="img-row__extra">{extra}</div>}
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

const asExact = (code, img) => (p) => (p.code === code ? { ...p, thumb: img.thumb, image: img.url, imageKind: 'exacta' } : p);

/** Fila de un código de la lista. `apply(img)` actualiza la lista que la contiene tras subir / copiar / quitar. */
function PartRow({ p, ctx, apply }) {
  const brand = p.manufacturer || 'IVECO';
  return (
    <Row
      thumb={p.thumb}
      title={p.name}
      subtitle={`${p.code} · ${p.category}`}
      badge={p.imageKind === 'ilustrativa' ? 'ilustrativa' : p.imageKind === 'exacta' ? 'foto exacta' : ''}
      queries={{ name: `${p.name} ${brand}`, code: `${p.code} ${p.name} ${brand}` }}
      active={ctx.isTarget('part', p.code)}
      {...ctx.status[p.code]}
      onPick={ctx.pick('part', p.code, apply)}
      onFile={(f) => ctx.upload('part', p.code, f, apply)}
      onCopy={(from) => ctx.copy('part', p.code, from, apply)}
      onRemove={p.imageKind === 'exacta' ? () => ctx.remove('part', p.code, apply) : null}
    />
  );
}

function Pager({ page, pages, onPage }) {
  if (!pages || pages <= 1) return null;
  return (
    <div className="img-pager">
      <button className="btn btn--ghost btn--sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>Anterior</button>
      <span>Página {page} de {nf.format(pages)}</span>
      <button className="btn btn--ghost btn--sm" disabled={page >= pages} onClick={() => onPage(page + 1)}>Siguiente</button>
    </div>
  );
}

/** Desplegable de un tipo de pieza: todos sus códigos, de a 25, para cargar la foto exacta de cada uno. */
function TypeCodes({ description, ctx }) {
  const [page, setPage] = useState(1);
  const codes = useAsync((opts) => ctx.guard(() => api.admin.typeCodes(description, page, opts)), [description, page]);
  const apply = (code) => (img) => {
    if (img) codes.setData((d) => d && { ...d, items: d.items.map(asExact(code, img)) });
    else codes.reload();
  };
  return (
    <div className="img-codes">
      {codes.loading && <p className="admin-empty">Cargando códigos…</p>}
      {codes.error && <p className="form-error">{codes.error.message}</p>}
      {!codes.loading && codes.data && (
        <>
          <ul className="img-list">
            {codes.data.items.map((p) => <PartRow key={p.code} p={p} ctx={ctx} apply={apply(p.code)} />)}
          </ul>
          <Pager page={codes.data.page} pages={codes.data.pages} onPage={setPage} />
        </>
      )}
    </div>
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
  const [open, setOpen] = useState(null); // tipo de pieza desplegado
  const [target, setTarget] = useState(null); // { kind, key, apply } que recibe el próximo Ctrl+V
  const [status, setStatus] = useState({}); // key → { busy, error }

  const guard = useCallback(async (fn) => {
    try { return await fn(); } catch (err) { if (err.status === 401) onUnauthorized(); throw err; }
  }, [onUnauthorized]);

  const types = useAsync((opts) => (mode === 'types'
    ? guard(() => api.admin.imageTypes({ q, categoria: category, faltantes: missing ? 1 : 0, pagina: page }, opts))
    : Promise.resolve(null)), [mode, q, category, missing, page]);
  // t: evita la caché del navegador del catálogo público para ver la imagen recién subida.
  const parts = useAsync((opts) => (mode === 'parts' && (q || category)
    ? api.search({ q, categoria: category, porPagina: 25, pagina: page, t: Date.now() }, opts)
    : Promise.resolve(null)), [mode, q, category, page]);
  useEffect(() => {
    const list = types.data?.categories ?? parts.data?.categories;
    if (list?.length) setCategories(list);
  }, [types.data, parts.data]);

  const run = useCallback(async (key, action, apply) => {
    setStatus((s) => ({ ...s, [key]: { busy: true } }));
    try {
      const img = await guard(action);
      apply?.(img);
      setStatus((s) => ({ ...s, [key]: {} }));
      setTarget(null);
      return true;
    } catch (err) {
      setStatus((s) => ({ ...s, [key]: { error: err.message } }));
      return false;
    }
  }, [guard]);

  const ctx = {
    guard,
    status,
    isTarget: (kind, key) => target?.kind === kind && target?.key === key,
    pick: (kind, key, apply) => () => setTarget({ kind, key, apply }),
    upload: (kind, key, file, apply) => run(key, () => api.admin.uploadImage(kind, key, file), apply),
    copy: (kind, key, from, apply) => run(key, () => api.admin.copyImage(kind, key, from), apply),
    remove: async (kind, key, apply) => {
      if (!window.confirm('¿Quitar esta imagen?')) return;
      await run(key, async () => { await api.admin.removeImage(kind, key); return null; }, apply);
    },
  };

  // Ctrl+V en cualquier parte del panel: va a la fila marcada.
  useEffect(() => {
    if (!target) return undefined;
    const onPaste = (e) => {
      const file = imageFromClipboard(e);
      if (!file) return;
      e.preventDefault();
      run(target.key, () => api.admin.uploadImage(target.kind, target.key, file), target.apply);
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [target, run]);

  const applyType = (description) => (img) => types.setData((d) => d && { ...d, items: d.items.map((r) => (r.description === description ? { ...r, image: img } : r)) });
  const applyPart = (code) => (img) => (img ? parts.setData((d) => d && { ...d, items: d.items.map(asExact(code, img)) }) : parts.reload());

  const reset = () => { setPage(1); setOpen(null); };
  const submit = (e) => { e.preventDefault(); reset(); setQ(draft.trim()); };
  const switchMode = (m) => { setMode(m); reset(); setTarget(null); };
  const goPage = (n) => { setPage(n); setOpen(null); };

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
          <select className="img-select" value={category} onChange={(e) => { setCategory(e.target.value); reset(); }} aria-label="Categoría">
            <option value="">Todas las categorías</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          {mode === 'types' && (
            <label className="img-check"><input type="checkbox" checked={missing} onChange={(e) => { setMissing(e.target.checked); reset(); }} /> Solo sin imagen</label>
          )}
          <form className="search search--sm" onSubmit={submit}>
            <Icon name="search" size={17} />
            <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={mode === 'types' ? 'Tipo o código (ej. filtro)' : 'Código o nombre'} />
          </form>
        </div>

        <p className="img-help">
          {mode === 'types'
            ? 'La imagen de un tipo se muestra como "ilustrativa" en todos sus repuestos. Con "Códigos" desplegás todos los códigos de ese tipo para cargar la foto exacta de cada uno.'
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
              ? data.items.map((r) => {
                const apply = applyType(r.description);
                const isOpen = open === r.description;
                return (
                  <React.Fragment key={r.description}>
                    <Row
                      thumb={r.image?.thumb}
                      title={r.name}
                      subtitle={`${nf.format(r.count)} repuestos · ${r.category} · ej. ${r.codes.join(', ')}`}
                      queries={{ name: `${r.name} IVECO`, code: `${r.codes[0]} ${r.name} IVECO` }}
                      active={ctx.isTarget('type', r.description)}
                      {...status[r.description]}
                      onPick={ctx.pick('type', r.description, apply)}
                      onFile={(f) => ctx.upload('type', r.description, f, apply)}
                      onCopy={(from) => ctx.copy('type', r.description, from, apply)}
                      onRemove={r.image ? () => ctx.remove('type', r.description, apply) : null}
                      extra={(
                        <button className={`btn btn--sm ${isOpen ? 'btn--accent' : 'btn--ghost'}`} onClick={() => setOpen(isOpen ? null : r.description)} aria-expanded={isOpen}>
                          Códigos ({nf.format(r.count)}) {isOpen ? '▴' : '▾'}
                        </button>
                      )}
                    />
                    {isOpen && <li className="img-codes-wrap"><TypeCodes description={r.description} ctx={ctx} /></li>}
                  </React.Fragment>
                );
              })
              : data.items.map((p) => <PartRow key={p.id} p={p} ctx={ctx} apply={applyPart(p.code)} />)}
          </ul>
        )}

        {!loading && data && <Pager page={data.page} pages={data.pages} onPage={goPage} />}
      </div>
    </>
  );
}
