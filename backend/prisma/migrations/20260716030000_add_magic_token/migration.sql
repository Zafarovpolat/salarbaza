-- CreateTable
CREATE TABLE "admin_magic_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "telegramId" BIGINT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_magic_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admin_magic_tokens_token_key" ON "admin_magic_tokens"("token");
CREATE INDEX "admin_magic_tokens_telegramId_idx" ON "admin_magic_tokens"("telegramId");
CREATE INDEX "admin_magic_tokens_expiresAt_idx" ON "admin_magic_tokens"("expiresAt");
