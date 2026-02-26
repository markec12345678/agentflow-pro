-- CreateTable
CREATE TABLE "faq_response_logs" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "responseTimeMs" INTEGER NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "propertyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "faq_response_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "faq_response_logs_propertyId_createdAt_idx" ON "faq_response_logs"("propertyId", "createdAt");

-- AddForeignKey
ALTER TABLE "faq_response_logs" ADD CONSTRAINT "faq_response_logs_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE SET NULL ON UPDATE CASCADE;
