import React from 'react';

/** Divide un texto en palabras que entran escalonadas (ver .split en animations.css). */
export default function SplitText({ text, start = 0, step = 70, className = '' }) {
  return (
    <span className={`split ${className}`} aria-label={text}>
      {text.split(' ').map((word, i) => (
        <React.Fragment key={`${word}-${i}`}>
          {i > 0 && ' '}
          <span className="split__mask" aria-hidden="true">
            <span className="split__word" style={{ '--i': start + i, '--step': `${step}ms` }}>{word}</span>
          </span>
        </React.Fragment>
      ))}
    </span>
  );
}
