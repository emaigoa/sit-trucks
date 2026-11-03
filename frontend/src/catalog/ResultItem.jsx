import React from 'react';
import AskButton from './AskButton.jsx';
import ProductImage from './ProductImage.jsx';
import Icon from '../components/Icon.jsx';
import { Link } from '../hooks/useRouter.jsx';

/** Un resultado del catálogo. Toda la tarjeta es clickeable (link estirado sobre el título). */
export default function ResultItem({ product, dispatch, view = 'list', index = 0 }) {
  const inStock = product.stock > 0;
  const low = inStock && product.stock <= 5;
  const models = [...new Set(product.compatibility || [])];

  return (
    <article className={`result result--${view}`} style={{ '--i': index }}>
      <div className="result__media"><ProductImage product={product} /></div>
      <div className="result__body">
        {product.featured && <span className="result__badge">Destacado</span>}
        <h2 className="result__title"><Link to={`/producto/${product.id}`}>{product.name}</Link></h2>
        <p className="result__brand">
          {product.manufacturer && <>Marca <strong>{product.manufacturer}</strong> · </>}{product.origin || 'Alternativo'}
        </p>
        {inStock ? (
          <p className="result__ship is-ok">
            <Icon name="send" size={14} /> {dispatch?.today ? <><strong>Despacho hoy</strong> <span>pidiendo antes de las {dispatch.cutoff}</span></> : <strong>Despacho {dispatch?.short || 'en el día'}</strong>}
          </p>
        ) : (
          <p className="result__ship"><Icon name="clock" size={14} /> A pedido · consultá la demora</p>
        )}
        {low && <p className="result__low">¡Últimas unidades!</p>}
        {view === 'list' && models.length > 0 && (
          <p className="result__fits">Compatible con {models.slice(0, 4).join(', ')}{models.length > 4 && ` y ${models.length - 4} más`}</p>
        )}
        <p className="result__code">{product.code}{product.oemCode && <> · OEM {product.oemCode}</>}</p>
      </div>
      <div className="result__ask">
        <AskButton product={product} />
      </div>
    </article>
  );
}
