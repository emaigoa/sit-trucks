import React from 'react';
import Icon from '../components/Icon.jsx';
import Marquee from '../components/Marquee.jsx';
import Reveal from '../components/Reveal.jsx';
import { useBusiness } from '../hooks/useBusiness.jsx';
import { useCountUp } from '../hooks/useCountUp.js';
import { useReveal } from '../hooks/useReveal.js';

function Score({ value, count }) {
  const [ref, visible] = useReveal();
  const shown = useCountUp(value, { start: visible, decimals: 1 });
  return (
    <div className="score" ref={ref}>
      <span className="score__value">{shown}</span>
      <span className={`score__stars ${visible ? 'is-visible' : ''}`}>{Array.from({ length: 5 }, (_, i) => <Icon key={i} name="star" size={22} />)}</span>
      <span className="score__meta">{count} reseñas en Google</span>
    </div>
  );
}

export default function Reviews() {
  const b = useBusiness();
  if (!b?.reviews?.length) return null;
  return (
    <section className="section reviews" id="resenas">
      <div className="container reviews__head">
        <Reveal>
          <p className="eyebrow"><span className="tick" /> 03 — Lo que dicen</p>
          <h2 className="section-title">La atención<br /><em>se nota.</em></h2>
        </Reveal>
        <Reveal delay={100}><Score value={b.rating.value} count={b.rating.count} /></Reveal>
      </div>
      <Marquee
        className="reviews__marquee"
        items={b.reviews}
        speed={55}
        renderItem={(r) => (
          <figure className="review">
            <span className="review__quote" aria-hidden="true">“</span>
            <blockquote>{r.text}</blockquote>
            <figcaption><span className="review__avatar">{r.author.charAt(0)}</span>{r.author}<span className="review__stars">{Array.from({ length: r.rating }, (_, i) => <Icon key={i} name="star" size={12} />)}</span></figcaption>
          </figure>
        )}
      />
      <div className="container reviews__foot">
        <a className="link-arrow" href={b.mapsUrl} target="_blank" rel="noreferrer">Ver todas en Google Maps <Icon name="arrowUpRight" size={16} /></a>
      </div>
    </section>
  );
}
