# Servicios Integrales Trucks

Sitio de repuestos para camiones — Tomás Falkner 6957, Mar del Plata.

```
frontend/   React + Vite (tienda + panel admin)
backend/    API Express con persistencia en JSON
```

## Desarrollo

```bash
npm install
cp backend/.env.example backend/.env   # y cambiá ADMIN_TOKEN
npm run dev                            # API :4000 + web :5173 (proxy /api)
```

- Tienda: http://localhost:5173
- Catálogo: http://localhost:5173/catalogo (filtros en la URL, ej. `/catalogo?marca=IVECO&modelo=Daily&orden=nuevos`)
- Producto: http://localhost:5173/producto/:id
- Admin: http://localhost:5173/admin (pide el `ADMIN_TOKEN`)

## Producción

```bash
npm run build   # compila el front en frontend/dist
npm start       # el backend sirve la API y el front en el mismo puerto
```

## Demo en GitHub Pages

Cada push a `main` publica el prototipo con `.github/workflows/pages.yml`. Es un build **estático**
(`VITE_STATIC=1`): no hay servidor, el catálogo corre en el navegador con los datos de
`backend/data/*.json` y la misma lógica de búsqueda (`shared/catalog.js`). En ese modo el panel admin
y el formulario de consultas están desactivados (las consultas van por WhatsApp).

Para el sitio real con admin y consultas, desplegar el backend (`npm run build && npm start`) en un
hosting de Node (Render, Railway, VPS…).

## API

| Método | Ruta | Auth | Descripción |
| --- | --- | --- | --- |
| GET | `/api/business` | — | Datos del negocio, horarios, reseñas |
| GET | `/api/products` | — | Listado completo (lo usa el admin) |
| GET | `/api/products/search` | — | Catálogo: `q, categoria, marca, modelo, fabricante, tipo, hoy=1, orden (relevancia·nuevos·nombre), pagina, porPagina` → items + facetas + paginación |
| GET | `/api/products/:id` | — | Detalle + relacionados |
| POST | `/api/products` | admin | Crear repuesto |
| PATCH | `/api/products/:id` | admin | Editar repuesto |
| DELETE | `/api/products/:id` | admin | Eliminar repuesto |
| GET | `/api/products/stats` | admin | Totales de stock |
| POST | `/api/inquiries` | — | Consulta desde el formulario (rate limit 5 / 10 min) |
| GET / PATCH | `/api/inquiries[/:id]` | admin | Listar / cambiar estado |

Auth admin: header `Authorization: Bearer <ADMIN_TOKEN>`.

## Dónde editar

- Datos del negocio (teléfono, WhatsApp, horarios, reseñas): `backend/data/business.json`
  - `brands`: marcas y modelos del buscador por camión y del slider
  - `dispatch.cutoffs`: hora de corte del despacho en el día (clave = día, 0 domingo … 6 sábado)
  - `payments`: medios de pago mostrados
  - `sellers`: vendedores de WhatsApp (con más de uno, la burbuja deja elegir)
- Compatibilidad de un repuesto: `"IVECO"` cubre toda la marca, `"IVECO Tector"` solo ese modelo
  - `brands[].image` / `credit`: foto de la marca (en `frontend/public/img/brands/`, versión `-sm.webp` para mobile) y su atribución Creative Commons, que se muestra sobre la foto
- Catálogo inicial: `backend/data/products.json` (o desde el panel admin)
  - **Datos de prueba**: ~320 artículos tomados del catálogo público de Repuestos Grasso (nombre, código OEM, foto enlazada a su sitio). Stock, marca del repuesto y tipo son inventados para probar filtros y orden. Reemplazar antes de publicar.
  - Los precios **no se publican**: cada repuesto tiene un botón "Consultar precio" que abre WhatsApp con el mensaje armado (repuesto, código, OEM, camión del cliente y link a la ficha). El texto se arma en `buildMessage` (`frontend/src/utils/business.js`).
  - Campos: `manufacturer` (marca del repuesto), `origin` (`Original` | `Alternativo`), `thumb` (miniatura del listado)
- Colores y tipografías: `frontend/src/styles/tokens.css`
- Secciones de la home: `frontend/src/sections/`
