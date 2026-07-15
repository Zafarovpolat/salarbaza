-- CreateEnum
CREATE TYPE "AnalyticsEventType" AS ENUM ('product_view', 'category_view', 'search', 'search_no_results', 'add_to_cart', 'remove_from_cart', 'checkout_started', 'order_created', 'order_cancelled');

-- CreateTable
CREATE TABLE "analytics_events" (
    "id" TEXT NOT NULL,
    "event" "AnalyticsEventType" NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT,
    "productId" TEXT,
    "categoryId" TEXT,
    "orderId" TEXT,
    "source" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "analytics_events_event_idx" ON "analytics_events"("event");
CREATE INDEX "analytics_events_sessionId_idx" ON "analytics_events"("sessionId");
CREATE INDEX "analytics_events_productId_idx" ON "analytics_events"("productId");
CREATE INDEX "analytics_events_categoryId_idx" ON "analytics_events"("categoryId");
CREATE INDEX "analytics_events_createdAt_idx" ON "analytics_events"("createdAt");
