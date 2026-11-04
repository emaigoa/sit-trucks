# Servicios Integrales Trucks

Sitio de repuestos **IVECO** — Tomás Falkner 6957, Mar del Plata.

```
frontend/   React + Vite (tienda + panel admin)
backend/    API Express + Prisma sobre Postgres (Supabase)
```

## Desarrollo

```bash
npm install
cp backend/.env.example backend/.env   # conexión a Postgres + Supabase Auth
cp frontend/.env.example frontend/.env.local
npm run dev                            # API :4000 + web :5173 (proxy /api)
```

- Tienda: http://localhost:5173
- Catálogo: http://localhost:5173/catalogo (filtros en la URL, ej. `/catalogo?marca=IVECO&modelo=Daily&orden=nuevos`)
- Producto: http://localhost:5173/producto/:id
- Admin: http://localhost:5173/admin (login con un usuario de Supabase Auth)

## Base de datos (Postgres en Supabase + Prisma)

Esquema en `backend/prisma/schema.prisma`. Variables en `backend/.env` (ver `.env.example`):
`DATABASE_URL` (transaction pooler, puerto 6543) para la app y `DIRECT_URL` (session pooler, 5432) para migraciones.

```bash
npm run db:deploy -w backend                     # aplica migraciones pendientes
npm run db:migrate -w backend -- --name <cambio> # crea una migración nueva (desarrollo)
npm run db:import -w backend -- "../Lista de Precios 01.11.2026 Iveco.xlsx"
```

El importador carga la hoja `LISTA BASE` (repuestos + historial de precio por lista) y `NEXPRO`
(alternativos con su código genuino). Reimportar es seguro; los repuestos que no vienen en la lista
más reciente quedan `active = false`. Los Excel no se versionan (`*.xlsx` en `.gitignore`).

Todas las tablas tienen RLS activado sin políticas: la API REST pública de Supabase no puede leerlas;
solo el backend (rol `postgres`) accede.

## Imágenes (Cloudflare R2)

Panel admin → **Imágenes**:
- **Por tipo de pieza:** una imagen ilustrativa por denominación de la lista (ej. "FILTRO COMBUSTIBLE"),
  que se muestra en todos sus repuestos con la etiqueta "Imagen ilustrativa". Ordenadas por cantidad:
  las 100 primeras cubren ~42 % del catálogo y las 300 primeras ~61 %.
- **Por código:** foto exacta de un repuesto (tiene prioridad sobre la del tipo).

"Google" abre la búsqueda de imágenes; se copia la imagen y se pega con Ctrl+V sobre la fila (también
se puede arrastrar o subir un archivo). Usar fotos propias o con permiso del proveedor.
El backend convierte cada imagen a WebP (1000 px y miniatura de 360 px) y la sube al bucket
`sit-trucks-img`; R2 no cobra egress. Variables: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`,
`R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_URL`.

## Producción

```bash
npm run build   # compila el front en frontend/dist
npm start       # el backend sirve la API y el front en el mismo puerto
```

## Demo en GitHub Pages

Cada push a `main` publica el prototipo con `.github/workflows/pages.yml`. Es un build **estático**
(`VITE_STATIC=1`): no hay servidor, el catálogo corre en el navegador con los datos de
`backend/data/*.json` y la misma lógica de búsqueda (`shared/catalog.js`). En ese modo:
- el panel admin (`/admin`) es una demo: entra con cualquier clave y los cambios viven en memoria (se ven en el catálogo hasta recargar);
- el formulario de contacto se reemplaza por un botón de WhatsApp.

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

Auth admin: header `Authorization: Bearer <access token de Supabase>`. El backend verifica el JWT
y, si `ADMIN_EMAILS` tiene valores, que el email esté en la lista. Los usuarios admin se crean a mano
en Supabase → Authentication → Users; el registro público está deshabilitado.

## Catálogo

El catálogo público combina los productos del admin (tabla `products`, con foto y stock) con los
repuestos activos de la lista de precios IVECO (tabla `parts`), que se muestran como "Original · IVECO",
disponibles y sin precio (id `iveco-<código>`). La categoría se asigna por palabras clave de la
denominación (`backend/src/services/catalogService.js`); lo que no encaja va a "Varios". Si un producto
del admin tiene el mismo código, se muestra el del admin. El catálogo se cachea en memoria (la lista se
refresca cada 30 min; tras importar una lista nueva conviene reiniciar el servicio).

## Dónde editar

- Datos del negocio (teléfono, WhatsApp, horarios, reseñas): `backend/data/business.json`
  - `brands`: marcas y modelos. Hoy hay una sola (IVECO): con una sola marca el sitio entra en modo monomarca
    (el buscador pide solo modelo y año, el catálogo filtra por modelo directo y la home muestra los modelos).
    `brands[].gallery`: fotos por modelo, usadas en el banner del catálogo, el slider y la sección Modelos
  - `dispatch.cutoffs`: hora de corte del despacho en el día (clave = día, 0 domingo … 6 sábado)
  - `payments`: medios de pago mostrados
  - `sellers`: vendedores de WhatsApp (con más de uno, la burbuja deja elegir)
- Compatibilidad de un repuesto: `"IVECO"` cubre toda la marca, `"IVECO Tector"` solo ese modelo
  - `brands[].image` / `credit`: foto de la marca (en `frontend/public/img/brands/`, versión `-sm.webp` para mobile) y su atribución Creative Commons, que se muestra sobre la foto
- Productos propios (con foto y stock): desde el panel admin. `backend/data/products.json` son datos de ejemplo solo para la demo estática de GitHub Pages.
  - **Datos de prueba**: 114 artículos IVECO tomados del catálogo público de Repuestos Grasso (nombre, código OEM, foto enlazada a su sitio). Stock, marca del repuesto y tipo son inventados para probar filtros y orden. Reemplazar antes de publicar.
  - Los precios **no se publican**: cada repuesto tiene un botón "Consultar precio" que abre WhatsApp con el mensaje armado (repuesto, código, OEM, camión del cliente y link a la ficha). El texto se arma en `buildMessage` (`frontend/src/utils/business.js`).
  - Campos: `manufacturer` (marca del repuesto), `origin` (`Original` | `Alternativo`), `thumb` (miniatura del listado)
- Colores y tipografías: `frontend/src/styles/tokens.css` (paleta azul/blanco tomada del logo)
- Logo: original en `assets/brand/logo-sit-original.png`; versiones web en `frontend/public/img/logo/`, favicon `frontend/public/favicon-48.png`
- Foto de la entrada (sección Ubicación): `frontend/public/img/local/entrada.webp` (original en `assets/brand/`)
- Secciones de la home: `frontend/src/sections/`
