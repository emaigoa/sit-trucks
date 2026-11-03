import React, { useEffect, useRef, useState } from 'react';
import Icon from './Icon.jsx';

/**
 * Carrusel horizontal basado en scroll nativo (scroll-snap):
 * funciona con touch y trackpad, y además se puede arrastrar con el mouse.
 */
export default function Carousel({ children, label, className = '' }) {
  const track = useRef(null);
  const drag = useRef(null);
  const [edges, setEdges] = useState({ start: true, end: false });
  const [progress, setProgress] = useState(0);

  const update = () => {
    const el = track.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setEdges({ start: el.scrollLeft < 4, end: el.scrollLeft > max - 4 });
    setProgress(max > 0 ? el.scrollLeft / max : 1);
  };

  useEffect(() => {
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [children]);

  const scrollBy = (dir) => {
    const el = track.current;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: 'smooth' });
  };

  const onPointerDown = (e) => {
    if (e.pointerType !== 'mouse') return;
    drag.current = { x: e.clientX, left: track.current.scrollLeft, moved: false };
    track.current.classList.add('is-grabbing');
  };
  const onPointerMove = (e) => {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.x;
    if (Math.abs(dx) > 5) drag.current.moved = true;
    track.current.scrollLeft = drag.current.left - dx;
  };
  const end = () => {
    if (!drag.current) return;
    track.current.classList.remove('is-grabbing');
    // Si hubo arrastre, se cancela el click que dispararía el soltar el mouse.
    if (drag.current.moved) track.current.addEventListener('click', (ev) => ev.stopPropagation(), { capture: true, once: true });
    drag.current = null;
  };

  return (
    <div className={`carousel ${className}`}>
      <div
        ref={track}
        className="carousel__track"
        role="region"
        aria-label={label}
        tabIndex={0}
        onScroll={update}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={end}
        onPointerLeave={end}
      >
        {children}
      </div>
      <div className="carousel__bar container">
        <span className="carousel__progress"><i style={{ transform: `scaleX(${Math.max(0.08, progress)})` }} /></span>
        <div className="slider__arrows">
          <button onClick={() => scrollBy(-1)} disabled={edges.start} aria-label="Anterior"><Icon name="arrow" size={18} className="flip" /></button>
          <button onClick={() => scrollBy(1)} disabled={edges.end} aria-label="Siguiente"><Icon name="arrow" size={18} /></button>
        </div>
      </div>
    </div>
  );
}
