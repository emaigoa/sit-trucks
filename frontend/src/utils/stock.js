/** Traduce unidades en stock a un estado visual. No se muestran cantidades exactas al público. */
export function stockInfo(units) {
  if (!units) return { tone: 'out', level: 0.04, label: 'A pedido' };
  if (units <= 5) return { tone: 'low', level: 0.3, label: 'Últimas unidades' };
  if (units <= 15) return { tone: 'ok', level: 0.65, label: 'En stock' };
  return { tone: 'ok', level: 1, label: 'Stock alto' };
}
