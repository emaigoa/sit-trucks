/**
 * Importa la lista de precios de IVECO (Excel de la terminal) a Postgres.
 *
 *   npm run db:import -w backend -- "../Lista de Precios 01.11.2026 Iveco.xlsx"
 *
 * - Hoja "LISTA BASE": upsert de repuestos por código de catálogo + historial de precio en la lista.
 *   Los repuestos que no vienen en la lista quedan con active = false (no se borran).
 * - Hoja "NEXPRO": upsert de alternativos NEXPRO con su equivalente genuino.
 * Volver a importar la misma lista (misma fecha de vigencia) es seguro: actualiza en lugar de duplicar.
 */
import path from 'node:path';
import ExcelJS from 'exceljs';
import { prisma } from '../src/db.js';

const CHUNK = 5000;

const file = process.argv[2];
if (!file) {
  console.error('Uso: npm run db:import -w backend -- <archivo.xlsx>');
  process.exit(1);
}

/** Valor "plano" de una celda de ExcelJS (texto enriquecido, fórmulas, hipervínculos…). */
function plain(value) {
  if (value == null) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'object') {
    if ('result' in value) return plain(value.result);
    if ('richText' in value) return value.richText.map((r) => r.text).join('');
    if ('text' in value) return plain(value.text);
  }
  return value;
}
const str = (v) => String(plain(v) ?? '').replace(/ /g, ' ').trim();
const num = (v) => {
  const n = Number(String(plain(v) ?? '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};
const fold = (s) => str(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const rowValues = (row) => row.values.slice(1); // ExcelJS indexa desde 1

function readBase(sheet) {
  let header = -1;
  let title = '';
  const rows = [];
  sheet.eachRow({ includeEmpty: false }, (row, n) => {
    const v = rowValues(row);
    if (header === -1) {
      if (/lista de precios/i.test(str(v[0]))) title = str(v[0]).split(' - ')[0];
      if (fold(v[0]) === 'catalogo') header = n;
      return;
    }
    const code = str(v[0]);
    if (!code) return;
    const price = num(v[2]);
    if (price == null) throw new Error(`Fila ${n}: precio inválido para ${code}`);
    const nexpro = str(v[11]);
    rows.push({
      code,
      description: str(v[5]).slice(0, 120),
      discountCode: str(v[4]).slice(0, 4),
      weightKg: num(v[6]) ?? 0,
      validFrom: plain(v[7]) instanceof Date ? plain(v[7]) : null,
      packQty: Math.trunc(num(v[8]) ?? 0),
      familyCode: str(v[9]).slice(0, 8),
      vatRate: num(v[10]) ?? 21,
      nexproCode: nexpro && nexpro !== '-' ? nexpro : null,
      priceUsd: price,
    });
  });
  if (header === -1) throw new Error('No encontré la fila de encabezados ("Catálogo") en LISTA BASE');
  return { title, rows };
}

function readNexpro(sheet) {
  const byCode = new Map();
  sheet.eachRow({ includeEmpty: false }, (row, n) => {
    if (n === 1) return; // encabezados
    const v = rowValues(row);
    const code = str(v[4]);
    if (!code) return;
    byCode.set(code, {
      code,
      genuineCode: str(v[0]).split(/\s/)[0] || null, // a veces viene "5801573146 (componente)"
      genuineName: str(v[1]).slice(0, 120) || null,
      description: str(v[5]).slice(0, 120),
      detail: str(v[6]).slice(0, 200),
      // Ojo: en el Excel los encabezados de estas dos columnas están invertidos respecto a los datos.
      discountCode: str(v[7]).slice(0, 4) || null,
      priceUsd: num(v[8]),
      familyCode: str(v[9]).slice(0, 8) || null,
      productFamily: str(v[10]).slice(0, 60) || null,
      application: str(v[11]),
    });
  });
  return [...byCode.values()];
}

const chunks = (items) => Array.from({ length: Math.ceil(items.length / CHUNK) }, (_, i) => items.slice(i * CHUNK, (i + 1) * CHUNK));
const col = (items, key) => items.map((r) => r[key]);

async function main() {
  const started = Date.now();
  console.log(`Leyendo ${file}…`);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(file);

  const baseSheet = workbook.worksheets.find((s) => fold(s.name) === 'lista base') ?? workbook.worksheets[0];
  const { title, rows } = readBase(baseSheet);
  const validFrom = rows.find((r) => r.validFrom)?.validFrom;
  if (!rows.length || !validFrom) throw new Error('La lista no tiene filas o fecha de vigencia');
  console.log(`LISTA BASE: ${rows.length} repuestos, vigencia ${validFrom.toISOString().slice(0, 10)}`);

  const nexproSheet = workbook.worksheets.find((s) => fold(s.name) === 'nexpro');
  const nexpro = nexproSheet ? readNexpro(nexproSheet) : [];
  console.log(`NEXPRO: ${nexpro.length} alternativos`);

  await prisma.$transaction(async (tx) => {
    const list = await tx.priceList.upsert({
      where: { validFrom },
      create: { name: title || 'Lista de precios', validFrom, sourceFile: path.basename(file), partCount: rows.length },
      update: { name: title || undefined, sourceFile: path.basename(file), partCount: rows.length, importedAt: new Date() },
    });

    for (const part of chunks(rows)) {
      await tx.$executeRaw`
        INSERT INTO parts (code, description, family_code, discount_code, pack_qty, weight_kg, vat_rate, price_usd, nexpro_code, active, updated_at)
        SELECT *, true, now() FROM unnest(
          ${col(part, 'code')}::text[], ${col(part, 'description')}::text[], ${col(part, 'familyCode')}::text[],
          ${col(part, 'discountCode')}::text[], ${col(part, 'packQty')}::int[], ${col(part, 'weightKg')}::numeric[],
          ${col(part, 'vatRate')}::numeric[], ${col(part, 'priceUsd')}::numeric[], ${col(part, 'nexproCode')}::text[])
        ON CONFLICT (code) DO UPDATE SET
          description = EXCLUDED.description, family_code = EXCLUDED.family_code, discount_code = EXCLUDED.discount_code,
          pack_qty = EXCLUDED.pack_qty, weight_kg = EXCLUDED.weight_kg, vat_rate = EXCLUDED.vat_rate,
          price_usd = EXCLUDED.price_usd, nexpro_code = EXCLUDED.nexpro_code, active = true, updated_at = now()`;

      await tx.$executeRaw`
        INSERT INTO part_prices (price_list_id, part_code, price_usd)
        SELECT ${list.id}, * FROM unnest(${col(part, 'code')}::text[], ${col(part, 'priceUsd')}::numeric[])
        ON CONFLICT (price_list_id, part_code) DO UPDATE SET price_usd = EXCLUDED.price_usd`;
    }

    // Solo la lista más reciente define qué está vigente (reimportar una vieja no desactiva nada).
    const latest = await tx.priceList.findFirst({ orderBy: { validFrom: 'desc' } });
    let inactive = 0;
    if (latest.id === list.id) {
      inactive = await tx.$executeRaw`
        UPDATE parts SET active = false, updated_at = now()
        WHERE active AND code NOT IN (SELECT part_code FROM part_prices WHERE price_list_id = ${list.id})`;
    }

    for (const part of chunks(nexpro)) {
      await tx.$executeRaw`
        INSERT INTO nexpro_parts (code, description, detail, price_usd, discount_code, genuine_code, genuine_name, family_code, product_family, application, updated_at)
        SELECT *, now() FROM unnest(
          ${col(part, 'code')}::text[], ${col(part, 'description')}::text[], ${col(part, 'detail')}::text[],
          ${col(part, 'priceUsd')}::numeric[], ${col(part, 'discountCode')}::text[], ${col(part, 'genuineCode')}::text[],
          ${col(part, 'genuineName')}::text[], ${col(part, 'familyCode')}::text[], ${col(part, 'productFamily')}::text[],
          ${col(part, 'application')}::text[])
        ON CONFLICT (code) DO UPDATE SET
          description = EXCLUDED.description, detail = EXCLUDED.detail, price_usd = EXCLUDED.price_usd,
          discount_code = EXCLUDED.discount_code, genuine_code = EXCLUDED.genuine_code, genuine_name = EXCLUDED.genuine_name,
          family_code = EXCLUDED.family_code, product_family = EXCLUDED.product_family, application = EXCLUDED.application,
          updated_at = now()`;
    }

    console.log(`Lista #${list.id} "${list.name}" guardada. Repuestos dados de baja: ${inactive}`);
  }, { timeout: 10 * 60_000, maxWait: 30_000 });

  console.log(`Listo en ${((Date.now() - started) / 1000).toFixed(1)} s`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
