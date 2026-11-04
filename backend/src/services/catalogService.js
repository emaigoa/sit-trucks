import { prisma } from '../db.js';
import { all as curatedProducts } from './productService.js';

/**
 * Catálogo público = productos cargados en el admin + repuestos genuinos de la lista de precios IVECO.
 *
 * Los repuestos de la lista no se copian a la tabla products: se arman como ítems "virtuales"
 * (id `iveco-<código>`) a partir de la tabla parts. Si un producto del admin tiene el mismo código
 * (o partCode), se muestra ese, con su foto y stock. La lista no informa cantidades: todo lo que viene
 * en la lista se considera disponible (LIST_STOCK) y el precio no se publica, como el resto del sitio.
 *
 * Todo se cachea en memoria; los productos del admin se recargan tras cada cambio y la lista cada
 * PARTS_TTL (o al reiniciar el servidor después de una importación).
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
    updatedAt: p.updatedAt.toISOString(),
    source: 'lista',
  };
}

let partsCache = { at: 0, items: null, loading: null };
let curatedCache = null;

async function listItems() {
  const fresh = partsCache.items && Date.now() - partsCache.at < PARTS_TTL;
  if (fresh) return partsCache.items;
  if (!partsCache.loading) {
    partsCache.loading = prisma.part
      .findMany({ where: { active: true }, select: { code: true, description: true, nexproCode: true, updatedAt: true } })
      .then((rows) => {
        partsCache = { at: Date.now(), items: rows.map(fromPart), loading: null };
        return partsCache.items;
      })
      .catch((error) => {
        partsCache.loading = null;
        if (partsCache.items) return partsCache.items; // si falla, seguimos con la versión anterior
        throw error;
      });
  }
  // Mientras se refresca, se sirve la versión anterior si existe.
  return partsCache.items ?? partsCache.loading;
}

/** Llamar después de crear / editar / borrar productos desde el admin. */
export function invalidateCurated() {
  curatedCache = null;
}

export async function catalogItems() {
  const [curated, listed] = await Promise.all([curatedCache ?? (curatedCache = curatedProducts().catch((e) => { curatedCache = null; throw e; })), listItems()]);
  const taken = new Set(curated.flatMap((p) => [p.code, p.partCode].filter(Boolean).map((c) => c.toUpperCase())));
  return [...curated, ...listed.filter((p) => !taken.has(p.code.toUpperCase()))];
}

/** Repuesto de la lista por id virtual, o null. */
export async function listItem(id) {
  if (!id.startsWith(LIST_PREFIX)) return null;
  const code = id.slice(LIST_PREFIX.length);
  const part = await prisma.part.findFirst({ where: { code, active: true } });
  return part ? fromPart(part) : null;
}
