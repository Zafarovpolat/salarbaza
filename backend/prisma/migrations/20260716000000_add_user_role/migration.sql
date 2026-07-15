-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- AlterTable
ALTER TABLE "users" ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'USER';

-- Bootstrap existing admins to ADMIN role
UPDATE "users" SET "role" = 'ADMIN'::"UserRole" WHERE "telegramId" IN (857268409, 7987200974);
