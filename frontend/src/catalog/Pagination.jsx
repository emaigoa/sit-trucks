import React from 'react';
import { Link, useRouter } from '../hooks/useRouter.jsx';
import { withParams } from '../utils/catalogUrl.js';

/** Páginas visibles: 1 … 4 5 [6] 7 8 … 14 */
function windowOf(page, pages) {
  const set = new Set([1, pages, page - 1, page, page + 1]);
  if (page <= 3) [2, 3, 4].forEach((p) => set.add(p));
  if (page >= pages - 2) [pages - 1, pages - 2, pages - 3].forEach((p) => set.add(p));
  const list = [...set].filter((p) => p >= 1 && p <= pages).sort((a, b) => a - b);
  return list.flatMap((p, i) => (i && p - list[i - 1] > 1 ? ['…', p] : [p]));
}

export default function Pagination({ page, pages }) {
  const { search } = useRouter();
  if (pages <= 1) return null;
  const to = (p) => withParams(search, { pagina: p === 1 ? '' : p });

  return (
    <nav className="pagination" aria-label="Páginas">
      {page > 1 && <Link className="pagination__step" to={to(page - 1)} rel="prev">‹ Anterior</Link>}
      <ol>
        {windowOf(page, pages).map((p, i) => (
          <li key={`${p}-${i}`}>
            {p === '…' ? <span className="pagination__gap">…</span> : (
              <Link to={to(p)} className={p === page ? 'is-current' : ''} aria-current={p === page ? 'page' : undefined}>{p}</Link>
            )}
          </li>
        ))}
      </ol>
      {page < pages && <Link className="pagination__step" to={to(page + 1)} rel="next">Siguiente ›</Link>}
    </nav>
  );
}
