import { defineConfig } from 'prisma/config';

// Carga backend/.env si existe (en Render las variables vienen del entorno).
try { process.loadEnvFile(); } catch {}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  // El CLI (migraciones) usa la conexión directa / session pooler; la app usa DATABASE_URL.
  datasource: { url: process.env.DIRECT_URL || process.env.DATABASE_URL },
});
