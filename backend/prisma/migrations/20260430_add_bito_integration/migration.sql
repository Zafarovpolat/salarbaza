-- Bito ERP integration: additive-only migration.
-- Adds columns to existing tables and creates new tables for Bito sync.
-- Designed to be safe to run on a database where schema.prisma drift exists
-- (e.g. product_variants / promotions tables not yet created in production).

-- ---------- categories: link to Bito category ----------
ALTER TABLE "categories"
  ADD COLUMN IF NOT EXISTS "bitoCategoryId" TEXT,
  ADD COLUMN IF NOT EXISTS "bitoParentId"   TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "categories_bitoCategoryId_key"
  ON "categories"("bitoCategoryId");

-- ---------- products: link to Bito product ----------
ALTER TABLE "products"
  ADD COLUMN IF NOT EXISTS "bitoProductId" TEXT,
  ADD COLUMN IF NOT EXISTS "bitoSku"       TEXT,
  ADD COLUMN IF NOT EXISTS "bitoNumber"    TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "products_bitoProductId_key"
  ON "products"("bitoProductId");

-- ---------- product_colors: link to Bito product (1 color = 1 Bito SKU in variant A) ----------
ALTER TABLE "product_colors"
  ADD COLUMN IF NOT EXISTS "bitoProductId" TEXT,
  ADD COLUMN IF NOT EXISTS "bitoSku"       TEXT,
  ADD COLUMN IF NOT EXISTS "stockQuantity" INTEGER NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX IF NOT EXISTS "product_colors_bitoProductId_key"
  ON "product_colors"("bitoProductId");

-- ---------- bito_warehouses: 6 Bito warehouses ----------
CREATE TABLE IF NOT EXISTS "bito_warehouses" (
  "id"        TEXT NOT NULL,
  "bitoId"    TEXT NOT NULL,
  "name"      TEXT NOT NULL,
  "code"      TEXT,
  "isMain"    BOOLEAN NOT NULL DEFAULT false,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "isActive"  BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "bito_warehouses_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "bito_warehouses_bitoId_key"
  ON "bito_warehouses"("bitoId");

-- ---------- product_warehouse_stocks: per-warehouse stock per Bito product ----------
CREATE TABLE IF NOT EXISTS "product_warehouse_stocks" (
  "id"            TEXT NOT NULL,
  "productId"     TEXT NOT NULL,
  "colorId"       TEXT,
  "warehouseId"   TEXT NOT NULL,
  "bitoProductId" TEXT NOT NULL,
  "amount"        INTEGER NOT NULL DEFAULT 0,
  "booked"        INTEGER NOT NULL DEFAULT 0,
  "inTransit"     INTEGER NOT NULL DEFAULT 0,
  "inTrash"       INTEGER NOT NULL DEFAULT 0,
  "updatedAt"     TIMESTAMP(3) NOT NULL,
  CONSTRAINT "product_warehouse_stocks_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "product_warehouse_stocks_bitoProductId_warehouseId_key"
  ON "product_warehouse_stocks"("bitoProductId", "warehouseId");
CREATE INDEX IF NOT EXISTS "product_warehouse_stocks_productId_idx"
  ON "product_warehouse_stocks"("productId");
CREATE INDEX IF NOT EXISTS "product_warehouse_stocks_warehouseId_idx"
  ON "product_warehouse_stocks"("warehouseId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'product_warehouse_stocks_productId_fkey'
  ) THEN
    ALTER TABLE "product_warehouse_stocks"
      ADD CONSTRAINT "product_warehouse_stocks_productId_fkey"
      FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'product_warehouse_stocks_warehouseId_fkey'
  ) THEN
    ALTER TABLE "product_warehouse_stocks"
      ADD CONSTRAINT "product_warehouse_stocks_warehouseId_fkey"
      FOREIGN KEY ("warehouseId") REFERENCES "bito_warehouses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END$$;

-- ---------- bito_customers ----------
CREATE TABLE IF NOT EXISTS "bito_customers" (
  "id"              TEXT NOT NULL,
  "bitoId"          TEXT NOT NULL,
  "type"            TEXT,
  "name"            TEXT NOT NULL,
  "phone"           TEXT,
  "extraPhones"     JSONB,
  "cardNumber"      TEXT,
  "bitoCategoryId"  TEXT,
  "responsibleId"   TEXT,
  "totalSale"       INTEGER NOT NULL DEFAULT 0,
  "avgSale"         INTEGER NOT NULL DEFAULT 0,
  "point"           INTEGER NOT NULL DEFAULT 0,
  "balance"         INTEGER NOT NULL DEFAULT 0,
  "balanceCurrency" TEXT,
  "isActive"        BOOLEAN NOT NULL DEFAULT true,
  "rawData"         JSONB,
  "bitoCreatedAt"   TIMESTAMP(3),
  "bitoUpdatedAt"   TIMESTAMP(3),
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL,
  CONSTRAINT "bito_customers_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "bito_customers_bitoId_key" ON "bito_customers"("bitoId");
CREATE INDEX IF NOT EXISTS "bito_customers_phone_idx" ON "bito_customers"("phone");
CREATE INDEX IF NOT EXISTS "bito_customers_name_idx"  ON "bito_customers"("name");

-- ---------- bito_employees ----------
CREATE TABLE IF NOT EXISTS "bito_employees" (
  "id"            TEXT NOT NULL,
  "bitoId"        TEXT NOT NULL,
  "fullName"      TEXT NOT NULL,
  "phone"         TEXT,
  "number"        TEXT,
  "positionId"    TEXT,
  "positionName"  TEXT,
  "roleId"        TEXT,
  "roleName"      TEXT,
  "isActive"      BOOLEAN NOT NULL DEFAULT true,
  "rawData"       JSONB,
  "bitoCreatedAt" TIMESTAMP(3),
  "bitoUpdatedAt" TIMESTAMP(3),
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL,
  CONSTRAINT "bito_employees_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "bito_employees_bitoId_key" ON "bito_employees"("bitoId");

-- ---------- bito_sync_runs (audit log) ----------
CREATE TABLE IF NOT EXISTS "bito_sync_runs" (
  "id"         TEXT NOT NULL,
  "startedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "finishedAt" TIMESTAMP(3),
  "status"     TEXT NOT NULL,
  "dryRun"     BOOLEAN NOT NULL DEFAULT false,
  "stats"      JSONB,
  "errorLog"   TEXT,
  CONSTRAINT "bito_sync_runs_pkey" PRIMARY KEY ("id")
);
