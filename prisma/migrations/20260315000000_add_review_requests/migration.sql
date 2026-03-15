-- CreateTable
CREATE TABLE "review_requests" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "guestEmail" TEXT NOT NULL,
    "guestPhone" TEXT,
    "guestName" TEXT NOT NULL,
    "reviewUrl" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'both',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "scheduledFor" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "review_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "review_requests_reservationId_idx" ON "review_requests"("reservationId");

-- CreateIndex
CREATE INDEX "review_requests_propertyId_idx" ON "review_requests"("propertyId");

-- CreateIndex
CREATE INDEX "review_requests_status_idx" ON "review_requests"("status");

-- CreateIndex
CREATE INDEX "review_requests_scheduledFor_idx" ON "review_requests"("scheduledFor");

-- AddProperty
ALTER TABLE "properties" ADD COLUMN "googlePlaceId" TEXT;
