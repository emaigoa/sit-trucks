/** Misma regla que el backend: "IVECO" cubre toda la marca, "IVECO Tector" solo ese modelo. */
export function fitsVehicle(product, vehicle) {
  if (!vehicle?.brand) return true;
  const b = vehicle.brand.toLowerCase();
  const full = vehicle.model ? `${b} ${vehicle.model.toLowerCase()}` : null;
  return (product.compatibility || []).some((entry) => {
    const e = entry.toLowerCase();
    if (e === b) return true;
    return full ? e === full : e.startsWith(`${b} `);
  });
}

export const vehicleLabel = (v) => [v?.brand, v?.model, v?.year].filter(Boolean).join(' ');

export function yearOptions(from = 1990) {
  const now = new Date().getFullYear() + 1;
  return Array.from({ length: now - from + 1 }, (_, i) => String(now - i));
}
