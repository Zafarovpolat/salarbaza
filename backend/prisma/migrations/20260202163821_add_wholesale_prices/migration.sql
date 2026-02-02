-- AlterTable
ALTER TABLE "products" ADD COLUMN     "wholesaleTemplateId" TEXT;

-- CreateTable
CREATE TABLE "wholesale_price_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wholesale_price_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wholesale_price_tiers" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "minQuantity" INTEGER NOT NULL,
    "discountPercent" INTEGER NOT NULL,

    CONSTRAINT "wholesale_price_tiers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "wholesale_price_tiers_templateId_minQuantity_key" ON "wholesale_price_tiers"("templateId", "minQuantity");

-- CreateIndex
CREATE INDEX "products_wholesaleTemplateId_idx" ON "products"("wholesaleTemplateId");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_wholesaleTemplateId_fkey" FOREIGN KEY ("wholesaleTemplateId") REFERENCES "wholesale_price_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wholesale_price_tiers" ADD CONSTRAINT "wholesale_price_tiers_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "wholesale_price_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
