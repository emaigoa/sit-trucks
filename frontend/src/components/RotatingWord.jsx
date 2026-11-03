import React, { useEffect, useState } from 'react';

/** Alterna palabras con un giro vertical (ej. "IVECO" ↔ "Mercedes-Benz"). */
export default function RotatingWord({ words, interval = 2600 }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (words.length < 2 || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;
    const id = setInterval(() => setI((n) => (n + 1) % words.length), interval);
    return () => clearInterval(id);
  }, [words.length, interval]);

  return (
    <span className="rotating" aria-live="polite">
      <span className="rotating__word" key={words[i]}>{words[i]}</span>
    </span>
  );
}
