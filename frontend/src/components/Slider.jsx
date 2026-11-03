import React, { Children, useCallback, useEffect, useRef, useState } from 'react';
import Icon from './Icon.jsx';

const prefersReduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * Slider de pantalla completa:
 * - autoplay con barra de progreso (se pausa con hover, foco, pestaña oculta o fuera de pantalla)
 * - arrastre con mouse / swipe en touch
 * - flechas del teclado y controles accesibles
 */
export default function Slider({ children, interval = 6500, label = 'Destacados', className = '' }) {
  const slides = Children.toArray(children);
  const count = slides.length;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [inView, setInView] = useState(true);
  const [drag, setDrag] = useState(0);
  const root = useRef(null);
  const start = useRef(null);

  const go = useCallback((i) => setIndex(((i % count) + count) % count), [count]);
  const next = useCallback(() => go(index + 1), [go, index]);
  const prev = useCallback(() => go(index - 1), [go, index]);

  const running = !paused && inView && !prefersReduced() && count > 1;

  useEffect(() => {
    if (!running) return undefined;
    const id = setTimeout(next, interval);
    return () => clearTimeout(id);
  }, [running, next, interval, index]);

  useEffect(() => {
    const node = root.current;
    if (!node || !('IntersectionObserver' in window)) return undefined;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.25 });
    io.observe(node);
    const onVis = () => setPaused(document.hidden);
    document.addEventListener('visibilitychange', onVis);
    return () => { io.disconnect(); document.removeEventListener('visibilitychange', onVis); };
  }, []);

  const onPointerDown = (e) => {
    if (e.button !== 0 || e.target.closest('a, button, select, input')) return;
    start.current = { x: e.clientX, y: e.clientY, w: root.current.offsetWidth };
    root.current.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e) => {
    if (!start.current) return;
    const dx = e.clientX - start.current.x;
    if (Math.abs(dx) > Math.abs(e.clientY - start.current.y)) setDrag(dx / start.current.w);
  };
  const onPointerUp = () => {
    if (!start.current) return;
    if (drag < -0.12) next();
    else if (drag > 0.12) prev();
    start.current = null;
    setDrag(0);
  };

  const onKey = (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
  };

  return (
    <div
      ref={root}
      className={`slider ${drag ? 'is-dragging' : ''} ${className}`}
      role="region"
      aria-roledescription="carrusel"
      aria-label={label}
      tabIndex={0}
      onKeyDown={onKey}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      style={{ '--interval': `${interval}ms` }}
    >
      <div className="slider__track" style={{ transform: `translateX(${(-index + drag) * 100}%)` }}>
        {slides.map((slide, i) => (
          <div key={i} className={`slider__slide ${i === index ? 'is-active' : ''}`} role="group" aria-roledescription="slide" aria-label={`${i + 1} de ${count}`} aria-hidden={i !== index} inert={i !== index ? '' : undefined}>
            {slide}
          </div>
        ))}
      </div>

      {count > 1 && (
        <div className="slider__controls container">
          <span className="slider__counter"><strong>{String(index + 1).padStart(2, '0')}</strong> / {String(count).padStart(2, '0')}</span>
          <div className="slider__dots">
            {slides.map((_, i) => (
              <button key={i} className={i === index ? 'is-active' : ''} onClick={() => go(i)} aria-label={`Ir al slide ${i + 1}`} aria-current={i === index}>
                <i className={i === index && running ? 'is-running' : ''} key={`${index}-${running}`} />
              </button>
            ))}
          </div>
          <div className="slider__arrows">
            <button onClick={prev} aria-label="Anterior"><Icon name="arrow" size={18} className="flip" /></button>
            <button onClick={next} aria-label="Siguiente"><Icon name="arrow" size={18} /></button>
          </div>
        </div>
      )}
    </div>
  );
}
