import crypto from 'node:crypto';
import { S3Client, PutObjectCommand, DeleteObjectsCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import { config } from '../config.js';
import { HttpError } from '../middleware/errors.js';

/**
 * Imágenes en Cloudflare R2 (API compatible con S3, sin costo de egress).
 * Cada imagen subida se normaliza a WebP en dos tamaños: `full` (ficha) y `thumb` (listados).
 */
const { r2 } = config;
const client = r2.accountId && r2.accessKeyId && r2.secretAccessKey
  ? new S3Client({
    region: 'auto',
    endpoint: `https://${r2.accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: r2.accessKeyId, secretAccessKey: r2.secretAccessKey },
  })
  : null;

export const storageReady = () => Boolean(client && r2.bucket && r2.publicUrl);

const SIZES = { full: { width: 1000, quality: 80 }, thumb: { width: 360, quality: 72 } };
const slug = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'img';
const publicUrl = (key) => `${r2.publicUrl.replace(/\/$/, '')}/${key}`;
const keyOf = (url) => (url?.startsWith(r2.publicUrl) ? url.slice(r2.publicUrl.replace(/\/$/, '').length + 1) : null);

async function send(command) {
  try {
    return await client.send(command);
  } catch (error) {
    console.error('[storage] R2:', error.name, error.message);
    throw new HttpError(502, `No se pudo guardar en Cloudflare R2 (${error.name || 'error'}). Revisá el token y el bucket.`);
  }
}

/** Sube una imagen (buffer de cualquier formato común) y devuelve { url, thumb }. */
export async function uploadImage(buffer, { folder, name }) {
  if (!storageReady()) throw new HttpError(503, 'Falta configurar Cloudflare R2 en el servidor (R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY)');
  if (!buffer?.length) throw new HttpError(422, 'No llegó ninguna imagen');

  let image;
  try {
    image = sharp(buffer, { limitInputPixels: 40e6 }).rotate(); // rotate: respeta la orientación EXIF
    await image.metadata();
  } catch {
    throw new HttpError(422, 'El archivo no es una imagen válida');
  }

  const id = `${slug(name)}-${crypto.randomBytes(4).toString('hex')}`; // nombre nuevo en cada subida: sin problemas de caché
  const out = {};
  for (const [size, { width, quality }] of Object.entries(SIZES)) {
    let body;
    try {
      body = await image.clone()
        .resize({ width, height: width, fit: 'inside', withoutEnlargement: true })
        .flatten({ background: '#ffffff' }) // PNG con transparencia → fondo blanco
        .webp({ quality })
        .toBuffer();
    } catch (error) {
      throw new HttpError(422, /pixel limit/i.test(error.message) ? 'La imagen es demasiado grande (máx. 40 megapíxeles)' : 'No se pudo procesar la imagen: probá con otra o en otro formato (JPG, PNG, WebP)');
    }
    const key = `${folder}/${id}-${size}.webp`;
    await send(new PutObjectCommand({
      Bucket: r2.bucket,
      Key: key,
      Body: body,
      ContentType: 'image/webp',
      CacheControl: 'public, max-age=31536000, immutable',
    }));
    out[size] = publicUrl(key);
  }
  return { url: out.full, thumb: out.thumb };
}

/** Borra imágenes anteriores del bucket (ignora URLs que no son del bucket). */
export async function deleteImages(...urls) {
  const keys = urls.map(keyOf).filter(Boolean);
  if (!keys.length || !storageReady()) return;
  try {
    await client.send(new DeleteObjectsCommand({ Bucket: r2.bucket, Delete: { Objects: keys.map((Key) => ({ Key })) } }));
  } catch (error) {
    console.error('[storage] no se pudieron borrar imágenes viejas:', error.message);
  }
}
