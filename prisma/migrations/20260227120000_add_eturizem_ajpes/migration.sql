-- AlterTable
ALTER TABLE "guests" ADD COLUMN "dateOfBirth" TIMESTAMP(3),
ADD COLUMN "countryCode" TEXT,
ADD COLUMN "documentType" TEXT,
ADD COLUMN "documentId" TEXT,
ADD COLUMN "gender" TEXT;

-- AlterTable
ALTER TABLE "properties" ADD COLUMN "rnoId" INTEGER;

-- AlterTable
ALTER TABLE "reservations" ADD COLUMN "eturizemSubmittedAt" TIMESTAMP(3),
ADD COLUMN "checkInToken" TEXT;

-- CreateTable
CREATE TABLE "ajpes_connections" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordEnc" TEXT NOT NULL,
    "rnoId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ajpes_connections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ajpes_connections_propertyId_key" ON "ajpes_connections"("propertyId");

-- CreateIndex
CREATE INDEX "ajpes_connections_propertyId_idx" ON "ajpes_connections"("propertyId");

-- CreateIndex
CREATE UNIQUE INDEX "reservations_checkInToken_key" ON "reservations"("checkInToken");

-- CreateIndex
CREATE INDEX "reservations_checkInToken_idx" ON "reservations"("checkInToken");

-- AddForeignKey
ALTER TABLE "ajpes_connections" ADD CONSTRAINT "ajpes_connections_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
