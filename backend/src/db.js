import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma/client.ts';

if (!process.env.DATABASE_URL) {
  throw new Error('[db] Falta DATABASE_URL (ver backend/.env.example).');
}

/** Cliente único de Prisma para toda la app. */
export const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
