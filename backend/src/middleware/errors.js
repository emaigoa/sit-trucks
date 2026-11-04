export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export function notFound(req, res) {
  res.status(404).json({ error: 'Recurso no encontrado' });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(error, req, res, next) {
  const status = error.status || error.statusCode || 500;
  const known = error instanceof HttpError;
  if (status >= 500) console.error(known ? `[${req.method} ${req.originalUrl}] ${error.message}` : error);
  // Los errores propios (HttpError) muestran su mensaje; los inesperados, uno genérico.
  const message = known || status < 500 ? error.message : 'Error interno';
  res.status(status).json({ error: status === 413 ? 'La imagen es demasiado pesada (máximo 12 MB)' : message, details: error.details });
}
