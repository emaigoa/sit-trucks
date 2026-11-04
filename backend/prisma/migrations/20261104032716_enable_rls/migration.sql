-- Supabase expone el schema public por su API REST (PostgREST) con la publishable key.
-- RLS activado sin políticas = la API pública no puede leer ni escribir nada.
-- El backend se conecta con el rol postgres (dueño de las tablas) y no se ve afectado.
ALTER TABLE "price_lists"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "parts"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "part_prices"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "nexpro_parts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "products"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "inquiries"    ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "_prisma_migrations" ENABLE ROW LEVEL SECURITY;
