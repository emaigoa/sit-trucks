import React from 'react';
import { useBusiness } from '../hooks/useBusiness.jsx';
import { useOpenStatus } from '../hooks/useOpenStatus.js';

export default function OpenBadge({ className = '' }) {
  const business = useBusiness();
  const status = useOpenStatus(business?.hours);
  if (!business) return null;
  const tone = status.open ? (status.closingSoon ? 'soon' : 'open') : 'closed';
  return (
    <span className={`open-badge open-badge--${tone} ${className}`} role="status">
      <span className="open-badge__dot" />
      {status.label}
    </span>
  );
}
