import React, { useEffect, useRef } from 'react';

/**
 * Plano técnico de una maza/disco que se dibuja al cargar y gira lento.
 * Se desplaza levemente con el puntero (parallax) para dar profundidad.
 */
export default function HeroVisual() {
  const ref = useRef(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    let frame = 0;
    const onMove = (e) => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const x = e.clientX / window.innerWidth - 0.5;
        const y = e.clientY / window.innerHeight - 0.5;
        node.style.setProperty('--px', `${x * -18}px`);
        node.style.setProperty('--py', `${y * -18}px`);
      });
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => { window.removeEventListener('pointermove', onMove); cancelAnimationFrame(frame); };
  }, []);

  const bolts = Array.from({ length: 10 }, (_, i) => (i * 36 * Math.PI) / 180);
  const vents = Array.from({ length: 36 }, (_, i) => (i * 10 * Math.PI) / 180);

  return (
    <div className="hero-visual" ref={ref} aria-hidden="true">
      <svg viewBox="0 0 600 600" className="hero-visual__svg">
        <g className="hv-rings">
          <circle cx="300" cy="300" r="282" className="hv-dash" />
          <circle cx="300" cy="300" r="250" className="hv-line hv-d1" />
        </g>
        <g className="hv-rotor">
          <circle cx="300" cy="300" r="220" className="hv-line hv-strong hv-d2" />
          <circle cx="300" cy="300" r="168" className="hv-line hv-d3" />
          {vents.map((a, i) => (
            <line key={i} x1={300 + 176 * Math.cos(a)} y1={300 + 176 * Math.sin(a)} x2={300 + 212 * Math.cos(a + 0.12)} y2={300 + 212 * Math.sin(a + 0.12)} className="hv-line hv-thin hv-d4" />
          ))}
          <circle cx="300" cy="300" r="104" className="hv-line hv-strong hv-d3" />
          {bolts.map((a, i) => <circle key={i} cx={300 + 78 * Math.cos(a)} cy={300 + 78 * Math.sin(a)} r="9" className="hv-line hv-d5" />)}
          <circle cx="300" cy="300" r="40" className="hv-accent hv-d5" />
        </g>
        <path d="M455 120a220 220 0 0 1 62 92l-58 24a158 158 0 0 0-46-66z" className="hv-caliper" />
        <g className="hv-callouts">
          <path d="M300 80V30h170" className="hv-line hv-thin hv-d6" />
          <text x="478" y="34">Ø 440</text>
          <path d="M378 300h110l40 60" className="hv-line hv-thin hv-d6" />
          <text x="430" y="384">10 × M22</text>
          <path d="M110 470l-60 60H20" className="hv-line hv-thin hv-d6" />
          <text x="20" y="552">SIT-2048</text>
        </g>
      </svg>
    </div>
  );
}
