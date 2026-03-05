-- CreateTable
CREATE TABLE "smart_alert_logs" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "smart_alert_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "smart_alert_logs_eventType_entityId_sentAt_idx" ON "smart_alert_logs"("eventType", "entityId", "sentAt");
