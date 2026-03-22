-- CreateTable
CREATE TABLE "content_history" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "propertyId" TEXT,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "promptType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "content_history_userId_propertyId_type_idx" ON "content_history"("userId", "propertyId", "type");

-- AddForeignKey
ALTER TABLE "content_history" ADD CONSTRAINT "content_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
