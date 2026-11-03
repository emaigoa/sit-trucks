import React from 'react';

/**
 * Dibujos técnicos en línea para cada categoría. Reemplazan las fotos de stock:
 * son livianos, coherentes entre sí y se "dibujan" con stroke-dashoffset (ver catalog.css).
 */
const drawings = {
  Frenos: (
    <>
      <circle cx="60" cy="60" r="44" />
      <circle cx="60" cy="60" r="34" className="thin" />
      <circle cx="60" cy="60" r="14" />
      {Array.from({ length: 5 }, (_, i) => {
        const a = (i * 72 * Math.PI) / 180;
        return <circle key={i} cx={60 + 8 * Math.cos(a)} cy={60 + 8 * Math.sin(a)} r="2" className="thin" />;
      })}
      {Array.from({ length: 18 }, (_, i) => {
        const a = (i * 20 * Math.PI) / 180;
        return <line key={`v${i}`} x1={60 + 37 * Math.cos(a)} y1={60 + 37 * Math.sin(a)} x2={60 + 42 * Math.cos(a)} y2={60 + 42 * Math.sin(a)} className="thin" />;
      })}
      <path d="M92 28a44 44 0 0 1 10 22l-12 4a30 30 0 0 0-7-15z" className="accent" />
    </>
  ),
  Transmisión: (
    <>
      <circle cx="46" cy="58" r="26" />
      <circle cx="46" cy="58" r="8" />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i * 30 * Math.PI) / 180;
        return <line key={i} x1={46 + 26 * Math.cos(a)} y1={58 + 26 * Math.sin(a)} x2={46 + 32 * Math.cos(a)} y2={58 + 32 * Math.sin(a)} />;
      })}
      <circle cx="88" cy="38" r="15" className="accent" />
      <circle cx="88" cy="38" r="5" className="thin" />
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i * 45 * Math.PI) / 180;
        return <line key={`s${i}`} x1={88 + 15 * Math.cos(a)} y1={38 + 15 * Math.sin(a)} x2={88 + 20 * Math.cos(a)} y2={38 + 20 * Math.sin(a)} className="accent" />;
      })}
    </>
  ),
  Motor: (
    <>
      <rect x="22" y="30" width="76" height="60" rx="6" />
      {Array.from({ length: 9 }, (_, i) => <line key={i} x1={32 + i * 7} y1="38" x2={32 + i * 7} y2="82" className="thin" />)}
      <path d="M40 30v-8h40v8" />
      <circle cx="60" cy="18" r="4" className="accent" />
      <path d="M98 50h10v20H98" className="accent" />
    </>
  ),
  Suspensión: (
    <>
      <rect x="50" y="12" width="20" height="14" rx="3" />
      <rect x="54" y="26" width="12" height="40" className="thin" />
      <path d="M44 68c32 0 32 6 0 6s32 6 0 6 32 6 0 6" className="accent" />
      <rect x="48" y="66" width="24" height="30" rx="3" />
      <circle cx="60" cy="104" r="6" />
    </>
  ),
  Eléctrico: (
    <>
      <circle cx="60" cy="60" r="38" />
      <circle cx="60" cy="60" r="26" className="thin" />
      {Array.from({ length: 10 }, (_, i) => {
        const a = (i * 36 * Math.PI) / 180;
        return <line key={i} x1={60 + 26 * Math.cos(a)} y1={60 + 26 * Math.sin(a)} x2={60 + 38 * Math.cos(a)} y2={60 + 38 * Math.sin(a)} className="thin" />;
      })}
      <path d="M64 40 52 62h10l-6 18 14-24H60z" className="accent" />
    </>
  ),
  Refrigeración: (
    <>
      <circle cx="60" cy="60" r="40" />
      <circle cx="60" cy="60" r="7" />
      {Array.from({ length: 6 }, (_, i) => (
        <path key={i} d="M60 53c4-14 14-22 24-20-2 10-10 18-22 22" transform={`rotate(${i * 60} 60 60)`} className={i % 2 ? 'thin' : 'accent'} />
      ))}
    </>
  ),
};

export default function PartSchematic({ category, className = '' }) {
  return (
    <svg className={`schematic ${className}`} viewBox="0 0 120 120" aria-hidden="true">
      <g className="schematic__grid">
        {[20, 40, 60, 80, 100].map((v) => <React.Fragment key={v}><line x1={v} y1="0" x2={v} y2="120" /><line x1="0" y1={v} x2="120" y2={v} /></React.Fragment>)}
      </g>
      <g className="schematic__part">{drawings[category] || drawings.Motor}</g>
    </svg>
  );
}
