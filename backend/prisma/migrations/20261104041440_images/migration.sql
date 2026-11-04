-- CreateTable
CREATE TABLE "part_images" (
    "code" VARCHAR(20) NOT NULL,
    "url" VARCHAR(500) NOT NULL,
    "thumb" VARCHAR(500) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "part_images_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "type_images" (
    "description" VARCHAR(120) NOT NULL,
    "url" VARCHAR(500) NOT NULL,
    "thumb" VARCHAR(500) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "type_images_pkey" PRIMARY KEY ("description")
);

-- Igual que el resto: sin acceso desde la API pública de Supabase.
ALTER TABLE "part_images" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "type_images" ENABLE ROW LEVEL SECURITY;
