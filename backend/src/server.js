import { createApp } from './app.js';
import { config } from './config.js';
import { catalogItems } from './services/catalogService.js';

createApp().listen(config.port, () => {
  console.log(`[api] escuchando en http://localhost:${config.port}`);
  // Precarga el catálogo (≈50k repuestos de la lista) para que la primera búsqueda no espere.
  catalogItems()
    .then((items) => console.log(`[catalogo] ${items.length} repuestos en memoria`))
    .catch((error) => console.error('[catalogo] no se pudo precargar:', error.message));
});
