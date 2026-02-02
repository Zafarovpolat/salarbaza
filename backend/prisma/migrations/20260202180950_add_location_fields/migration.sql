-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "customerFirstName" TEXT,
ADD COLUMN     "customerLastName" TEXT,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION;
