-- AlterTable
ALTER TABLE "smart_alert_logs" ADD COLUMN "escalatedAt" TIMESTAMP(3), ADD COLUMN "escalatedTo" TEXT;

-- CreateTable
CREATE TABLE "alert_events" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL DEFAULT 'system_error',
    "entityId" TEXT NOT NULL DEFAULT 'global',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alert_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "alert_events_eventType_createdAt_idx" ON "alert_events"("eventType", "createdAt");
