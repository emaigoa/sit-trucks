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

function fromPart(p) {
  return {
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

async function catalog() {
  const listed = await listItems();
  if (!curatedCache) curatedCache = curatedProducts().catch((e) => { curatedCache = null; throw e; });
  const curated = await curatedCache;
  if (!merged) {
    const taken = new Set(curated.flatMap((p) => [p.code, p.partCode].filter(Boolean).map((c) => c.toUpperCase())));
    const items = [...curated, ...listed.filter((p) => !taken.has(p.code.toUpperCase()))];
    merged = { items, byId: new Map(items.map((p) => [p.id, p])) };
  }
  return merged;
}

export async function catalogItems() {
  return (await catalog()).items;
}

/** Ficha por id (productos del admin y repuestos de la lista), sin consultar la base. */
export async function catalogItem(id) {
  return (await catalog()).byId.get(String(id)) ?? null;
}
