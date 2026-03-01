-- CreateTable
CREATE TABLE "inquiries" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'general',
    "status" TEXT NOT NULL DEFAULT 'new',
    "source" TEXT NOT NULL DEFAULT 'manual',
    "checkIn" TIMESTAMP(3),
    "checkOut" TIMESTAMP(3),
    "guestCount" INTEGER,
    "faqLogId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inquiries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "inquiries_faqLogId_key" ON "inquiries"("faqLogId");

-- CreateIndex
CREATE INDEX "inquiries_propertyId_status_idx" ON "inquiries"("propertyId", "status");

-- CreateIndex
CREATE INDEX "inquiries_propertyId_createdAt_idx" ON "inquiries"("propertyId", "createdAt");

-- AddForeignKey
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_faqLogId_fkey" FOREIGN KEY ("faqLogId") REFERENCES "faq_response_logs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
