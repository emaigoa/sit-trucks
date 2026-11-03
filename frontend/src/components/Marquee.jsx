import React from 'react';

/** Cinta infinita. El contenido se duplica para que el loop no tenga cortes. */
export default function Marquee({ items, speed = 40, reverse = false, className = '', renderItem }) {
  const list = [...items, ...items];
  return (
    <div className={`marquee ${reverse ? 'marquee--reverse' : ''} ${className}`} style={{ '--duration': `${speed}s` }}>
      <div className="marquee__track">
        {list.map((item, i) => (
          <div className="marquee__item" key={i} aria-hidden={i >= items.length}>
            {renderItem ? renderItem(item, i) : item}
          </div>
        ))}
      </div>
    </div>
  );
}
