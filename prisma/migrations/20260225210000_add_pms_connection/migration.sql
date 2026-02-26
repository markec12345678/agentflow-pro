-- CreateTable
CREATE TABLE "pms_connections" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'mews',
    "credentials" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pms_connections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pms_connections_propertyId_provider_key" ON "pms_connections"("propertyId", "provider");

-- CreateIndex
CREATE INDEX "pms_connections_propertyId_idx" ON "pms_connections"("propertyId");

-- AddForeignKey
ALTER TABLE "pms_connections" ADD CONSTRAINT "pms_connections_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
