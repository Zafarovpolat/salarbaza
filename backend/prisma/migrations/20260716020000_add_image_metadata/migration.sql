-- AlterTable
ALTER TABLE "product_images" ADD COLUMN "originalUrl" TEXT;
ALTER TABLE "product_images" ADD COLUMN "thumbnailUrl" TEXT;
ALTER TABLE "product_images" ADD COLUMN "mediumUrl" TEXT;
ALTER TABLE "product_images" ADD COLUMN "width" INTEGER;
ALTER TABLE "product_images" ADD COLUMN "height" INTEGER;
ALTER TABLE "product_images" ADD COLUMN "bytes" INTEGER;
ALTER TABLE "product_images" ADD COLUMN "format" TEXT;
