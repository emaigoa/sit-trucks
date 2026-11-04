import fs from 'node:fs/promises';
import path from 'node:path';
import { prisma } from '../db.js';
import { config } from '../config.js';
import { all as curatedProducts } from './productService.js';

/**
 * Catálogo público = productos cargados en el admin + repuestos genuinos de la lista de precios IVECO.
 *
 * Los repuestos de la lista no se copian a la tabla products: se arman como ítems "virtuales"
 * (id `iveco-<código>`) a partir de la tabla parts. Si un producto del admin tiene el mismo código
 * (o partCode), se muestra ese, con su foto y stock. La lista no informa cantidades: todo lo que viene
 * en la lista se considera disponible (LIST_STOCK) y el precio no se publica, como el resto del sitio.
 *
 * Todo se cachea en memoria; los productos del admin se recargan tras cada cambio desde el admin.
 */
const PARTS_TTL = 30 * 60_000;
export const LIST_PREFIX = 'iveco-';
// Unidades "de referencia" para los repuestos de la lista: se muestran como "En stock" (no se publican cantidades).
const LIST_STOCK = 10;

/** Categoría por palabras clave de la denominación (la primera regla que coincide gana). */
const RULES = [
  // Ferretería: tornillos, arandelas, clips… van a "Varios" aunque mencionen otra pieza ("ANILLO DE RESORTE").
  ['Varios', /^(TORNILLO|TORN|ARANDELA|TUERCA|PERNO|ANILLO|CLIP|ABRAZADERA|PASADOR|ESPARRAGO|WASHER|SCREW|NUT|BOLT|STUD|CIRCLIP|SPACER|SHIM|SUPLEMENTO|ESPACIADOR|REMACHE|RIVET|PINZA|GRAPA|CHAVETA|SEGURO|DOWEL)\b/],
  ['Filtros', /\b(FILTRO|FILTER|CARTUC\w*|PREFILTRO)\b/],
  ['Iluminación', /\b(FARO\w*|OPTICA|PILOTO|LAMPARA|LAMP\w*|LIGHT\w*|LUZ|LUCES|INTERMITENTE|LINTERNA)\b/],
  ['Frenos', /\b(FRENO\w*|BRAKE\w*|PASTILLA\w*|TABLETA\w*|ZAPATA\w*|MORDAZA|CALIPER|ABS|TAMBOR)\b/],
  ['Refrigeración', /\b(RADIADOR\w*|RADIATOR|TERMOSTATO|THERMOSTAT|VENTILADOR|FAN|INTERCOOLER|REFRIG\w*|COOL\w*|BOMBA AGUA|WATER)\b/],
  ['Neumática', /\b(SECADOR|PULMON\w*|NEUMATIC\w*|COMPRESOR|COMPRESSOR|CALDERIN|AIR)\b/],
  ['Transmisión', /\b(EMBRAGUE|CLUTCH|CAMBIO\w*|GEAR\w*|PINON|SINCRO\w*|ARBOL|PALIER|DIFF\w*|DIFERENCIAL|CARDAN|PROP\w*|SHIFT|CORONA|CRUCETA|TRANSMIS\w*|AXLE|SEMIEJE|REDUCTOR)\b/],
  ['Suspensión', /\b(AMORTIGUADOR\w*|SHOCK|ELASTICO|BALLESTA|HOJA|SPRING|RESORTE|SWAY|STABILIZER|ESTABILIZ\w*|SILENTBLOC\w*|BUJE|BUSH\w*|TIRANTE|ROTULA|BRAZO|SUSPENS\w*|STEERING|DIRECCION)\b/],
  ['Eléctrico', /\b(CABLE\w*|WIRE\w*|SENSOR\w*|INTERRUPTOR|SWITCH|CONECTOR|CONNECTOR|ECU|RELE|RELAY|FUSIBLE|FUSE|ALTERNADOR|ARRANQUE|BATERIA|CENTRALITA|MAZO|CONMUT\w*|TERMINAL|BOTON|ELECTR\w*|SOCKET|CONTROL)\b/],
  ['Carrocería', /\b(CABIN\w*|CABINA|PUERTA|DOOR|ESPEJO|MIRROR|PARACHOQUES|BUMPER|DEFENSA|CRISTAL|REVEST\w*|FORRO|PANEL|BISAGRA|CERRADURA|ESTRIBO|GUARDABARRO\w*|MUDGUARD|REJILLA|EMBLEMA|CALCOMANIA|ASIENTO|SEAT|TRAMPILLA|BURLETE|ESTERA|LABEL|SIMBOLO|MOLDURA|COJIN|TAPIZ\w*|PARABRISAS|LIMPIA\w*)\b/],
  ['Motor', /\b(MOTOR|ENGINE|ENG|PISTON|EMBOLO|CULATA|INYECTOR\w*|INJECTOR|TURBO\w*|CIGUENAL|LEVA|BIELA|FUEL|COMBUSTIBLE|ESCAPE|EXHAUST|COLECTOR|OIL|ACEITE|CORREA|POLEA|TENSOR|BOMBA|CILINDRO|CYLIND\w*|CARTER|VALVULA|VALV|VALVE|GASKET|JUNTA)\b/],
];

const fold = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/[.\/,-]/g, ' ');
export const categoryFor = (description) => RULES.find(([, re]) => re.test(fold(description)))?.[0] ?? 'Varios';

/** "TUBULAD.ROSCADA" → "Tubulad. roscada" */
const sentence = (s) => {
  const t = s.replace(/\.(?=\S)/g, '. ').replace(/\s+/g, ' ').trim().toLowerCase();
  return t.charAt(0).toUpperCase() + t.slice(1);
};

/** Denominación original de la lista (clave de la imagen por tipo). Symbol: no sale en el JSON. */
export const RAW_DESC = Symbol('rawDescription');

function fromPart(p) {
  return {
    [RAW_DESC]: p.description,
    id: `${LIST_PREFIX}${p.code}`,
    code: p.code,
    oemCode: '',
    name: sentence(p.description),
    detail: p.nexproCode ? `Genuino IVECO · Alternativo NEXPRO ${p.nexproCode}` : 'Repuesto genuino IVECO',
    description: 'Repuesto genuino IVECO de la lista oficial de la terminal. Consultanos precio y compatibilidad con el modelo y año de tu unidad.',
    category: categoryFor(p.description),
    stock: LIST_STOCK,
    badge: '',
    featured: false,
    compatibility: ['IVECO'],
    image: '',
    thumb: '',
    manufacturer: 'IVECO',
    origin: 'Original',
    updatedAt: p.updatedAt,
    source: 'lista',
  };
}

/*
 * Para no gastar egress de Supabase, los ~50k repuestos se leen de la base lo menos posible:
 * - En el build se guarda un snapshot en disco (npm run db:snapshot) y el servidor arranca desde ahí.
 * - Cada PARTS_TTL solo se consulta la "versión" (fecha de la última importación, unos bytes);
 *   la lista completa se vuelve a bajar únicamente si cambió.
 * - Fichas, relacionados y búsquedas se resuelven en memoria: las vistas públicas no consultan la base.
 */
export const SNAPSHOT_FILE = path.join(config.dataDir, 'parts-snapshot.json');

/** Versión de la lista vigente: fecha de la última importación (consulta mínima). */
export async function listVersion() {
  const { _max } = await prisma.priceList.aggregate({ _max: { importedAt: true } });
  return _max.importedAt?.toISOString() ?? 'vacia';
}

/** Filas mínimas de la lista: [código, denominación, código NEXPRO]. */
export async function fetchListRows() {
  const rows = await prisma.part.findMany({ where: { active: true }, select: { code: true, description: true, nexproCode: true } });
  return rows.map((r) => [r.code, r.description, r.nexproCode]);
}

async function readSnapshot() {
  try { return JSON.parse(await fs.readFile(SNAPSHOT_FILE, 'utf8')); } catch { return null; }
}

const toItems = ({ version, rows }) => {
  const updatedAt = version === 'vacia' ? new Date(0).toISOString() : version;
  return rows.map(([code, description, nexproCode]) => fromPart({ code, description, nexproCode, updatedAt }));
};

let list = { version: null, items: [], checkedAt: 0 };
let imagesCache = null; // Promise<{ parts: Map<código, img>, types: Map<denominación, img> }>
let listLoading = null;
let curatedCache = null;
let merged = null; // { items, byId } — se rearma cuando cambia la lista o los productos del admin

async function refreshList() {
  const version = await listVersion();
  if (version !== list.version) {
    const snapshot = list.version === null ? await readSnapshot() : null;
    const source = snapshot?.version === version ? snapshot : { version, rows: await fetchListRows() };
    if (source !== snapshot) console.log(`[catalogo] lista ${version} descargada de la base (${source.rows.length} repuestos)`);
    list = { version, items: toItems(source), checkedAt: Date.now() };
    merged = null;
  } else {
    list.checkedAt = Date.now();
  }
}

async function listItems() {
  if (Date.now() - list.checkedAt >= PARTS_TTL && !listLoading) {
    listLoading = refreshList()
      .catch((error) => {
        if (list.version === null) throw error;
        console.error('[catalogo] no se pudo verificar la lista, sigo con la anterior:', error.message);
        list.checkedAt = Date.now();
      })
      .finally(() => { listLoading = null; });
  }
  // Mientras se verifica, se sirve la versión anterior si existe.
  if (list.version === null) await listLoading;
  return list.items;
}

/** Llamar después de crear / editar / borrar productos desde el admin. */
export function invalidateCurated() {
  curatedCache = null;
  merged = null;
}

/** Imágenes subidas desde el admin (pocas filas: se leen una vez por arranque). */
function images() {
  if (!imagesCache) {
    imagesCache = Promise.all([
      prisma.partImage.findMany({ select: { code: true, url: true, thumb: true } }),
      prisma.typeImage.findMany({ select: { description: true, url: true, thumb: true } }),
    ]).then(([parts, types]) => ({
      parts: new Map(parts.map((r) => [r.code, { url: r.url, thumb: r.thumb }])),
      types: new Map(types.map((r) => [r.description, { url: r.url, thumb: r.thumb }])),
    })).catch((e) => { imagesCache = null; throw e; });
  }
  return imagesCache;
}

/** Foto exacta del código o, si no hay, la ilustrativa de su tipo de pieza. */
function withImage(p, img) {
  const exact = img.parts.get(p.code);
  if (exact) return { ...p, image: exact.url, thumb: exact.thumb, imageKind: 'exacta' };
  const generic = img.types.get(p[RAW_DESC]);
  if (generic) return { ...p, image: generic.url, thumb: generic.thumb, imageKind: 'ilustrativa' };
  return p;
}

async function catalog() {
  const listed = await listItems();
  if (!curatedCache) curatedCache = curatedProducts().catch((e) => { curatedCache = null; throw e; });
  const [curated, img] = await Promise.all([curatedCache, images()]);
  if (!merged) {
    const taken = new Set(curated.flatMap((p) => [p.code, p.partCode].filter(Boolean).map((c) => c.toUpperCase())));
    const items = [...curated, ...listed.filter((p) => !taken.has(p.code.toUpperCase())).map((p) => withImage(p, img))];
    merged = { items, byId: new Map(items.map((p) => [p.id, p])) };
  }
  return merged;
}

/** Actualiza la caché tras subir o quitar una imagen (img = null para quitarla). */
export async function applyImage(kind, key, img) {
  const maps = await images();
  const map = kind === 'part' ? maps.parts : maps.types;
  if (img) map.set(key, img); else map.delete(key);
  merged = null;
}

export async function currentImage(kind, key) {
  const maps = await images();
  return (kind === 'part' ? maps.parts : maps.types).get(key) ?? null;
}

/** ¿Existe el código / la denominación en la lista vigente? */
export async function listHas(kind, key) {
  const items = await listItems();
  return kind === 'part' ? items.some((p) => p.code === key) : items.some((p) => p[RAW_DESC] === key);
}

/**
 * Tipos de pieza (denominaciones) con cuántos repuestos agrupan y su imagen ilustrativa.
 * Ordenados de más a menos repuestos: cargar los primeros cubre la mayor parte del catálogo.
 */
export async function typeStats({ q = '', missing = false, page = 1, perPage = 30 } = {}) {
  const [items, img] = await Promise.all([listItems(), images()]);
  const counts = new Map();
  for (const p of items) counts.set(p[RAW_DESC], (counts.get(p[RAW_DESC]) || 0) + 1);
  const total = items.length;
  const term = fold(String(q)).trim();
  let rows = [...counts].map(([description, count]) => ({ description, name: sentence(description), count, image: img.types.get(description) ?? null }));
  const covered = rows.reduce((sum, r) => sum + (r.image ? r.count : 0), 0);
  if (term) rows = rows.filter((r) => fold(r.description).includes(term));
  if (missing) rows = rows.filter((r) => !r.image);
  rows.sort((a, b) => b.count - a.count || a.description.localeCompare(b.description));
  const pages = Math.max(1, Math.ceil(rows.length / perPage));
  const current = Math.min(pages, Math.max(1, page));
  return {
    items: rows.slice((current - 1) * perPage, current * perPage),
    total: rows.length,
    page: current,
    pages,
    coverage: { withImage: covered, total, exact: img.parts.size, types: img.types.size },
  };
}

export async function catalogItems() {
  return (await catalog()).items;
}

/** Ficha por id (productos del admin y repuestos de la lista), sin consultar la base. */
export async function catalogItem(id) {
  return (await catalog()).byId.get(String(id)) ?? null;
}
