-- CreateTable
CREATE TABLE "price_lists" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "valid_from" DATE NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "source_file" TEXT NOT NULL,
    "imported_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "part_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "price_lists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parts" (
    "code" VARCHAR(20) NOT NULL,
    "description" VARCHAR(120) NOT NULL,
    "family_code" VARCHAR(8) NOT NULL,
    "discount_code" VARCHAR(4) NOT NULL,
    "pack_qty" INTEGER NOT NULL DEFAULT 0,
    "weight_kg" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "vat_rate" DECIMAL(5,2) NOT NULL DEFAULT 21,
    "price_usd" DECIMAL(12,2) NOT NULL,
    "nexpro_code" VARCHAR(20),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parts_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "part_prices" (
    "price_list_id" INTEGER NOT NULL,
    "part_code" VARCHAR(20) NOT NULL,
    "price_usd" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "part_prices_pkey" PRIMARY KEY ("price_list_id","part_code")
);

-- CreateTable
CREATE TABLE "nexpro_parts" (
    "code" VARCHAR(20) NOT NULL,
    "description" VARCHAR(120) NOT NULL,
    "detail" VARCHAR(200) NOT NULL DEFAULT '',
    "price_usd" DECIMAL(12,2),
    "discount_code" VARCHAR(4),
    "genuine_code" VARCHAR(20),
    "genuine_name" VARCHAR(120),
    "family_code" VARCHAR(8),
    "product_family" VARCHAR(60),
    "application" TEXT NOT NULL DEFAULT '',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nexpro_parts_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "products" (
    "id" UUID NOT NULL,
    "code" VARCHAR(24) NOT NULL,
    "oem_code" VARCHAR(60) NOT NULL DEFAULT '',
    "part_code" VARCHAR(20),
    "name" VARCHAR(140) NOT NULL,
    "detail" VARCHAR(200) NOT NULL DEFAULT '',
    "description" VARCHAR(1000) NOT NULL DEFAULT '',
    "category" VARCHAR(40) NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "badge" VARCHAR(24) NOT NULL DEFAULT '',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "compatibility" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "image" VARCHAR(500) NOT NULL DEFAULT '',
    "thumb" VARCHAR(500) NOT NULL DEFAULT '',
    "manufacturer" VARCHAR(40) NOT NULL DEFAULT '',
    "origin" VARCHAR(20) NOT NULL DEFAULT 'Alternativo',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inquiries" (
    "id" UUID NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'nueva',
    "name" VARCHAR(80) NOT NULL,
    "contact" VARCHAR(120) NOT NULL,
    "message" VARCHAR(1500) NOT NULL DEFAULT '',
    "product_code" VARCHAR(24) NOT NULL DEFAULT '',
    "vehicle" JSONB NOT NULL DEFAULT '{}',
    "company" VARCHAR(100),
    "business_kind" VARCHAR(40),
    "city" VARCHAR(80),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inquiries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "price_lists_valid_from_key" ON "price_lists"("valid_from");

-- CreateIndex
CREATE INDEX "parts_family_code_idx" ON "parts"("family_code");

-- CreateIndex
CREATE INDEX "parts_nexpro_code_idx" ON "parts"("nexpro_code");

-- CreateIndex
CREATE INDEX "part_prices_part_code_idx" ON "part_prices"("part_code");

-- CreateIndex
CREATE INDEX "nexpro_parts_genuine_code_idx" ON "nexpro_parts"("genuine_code");

-- CreateIndex
CREATE UNIQUE INDEX "products_code_key" ON "products"("code");

-- CreateIndex
CREATE UNIQUE INDEX "products_part_code_key" ON "products"("part_code");

-- CreateIndex
CREATE INDEX "products_category_idx" ON "products"("category");

-- CreateIndex
CREATE INDEX "inquiries_created_at_idx" ON "inquiries"("created_at" DESC);

-- AddForeignKey
ALTER TABLE "part_prices" ADD CONSTRAINT "part_prices_price_list_id_fkey" FOREIGN KEY ("price_list_id") REFERENCES "price_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "part_prices" ADD CONSTRAINT "part_prices_part_code_fkey" FOREIGN KEY ("part_code") REFERENCES "parts"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_part_code_fkey" FOREIGN KEY ("part_code") REFERENCES "parts"("code") ON DELETE SET NULL ON UPDATE CASCADE;
