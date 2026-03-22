-- CreateTable
CREATE TABLE "amenities" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "amenities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_policies" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "policyType" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "property_policies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "amenities_propertyId_idx" ON "amenities"("propertyId");

-- CreateIndex
CREATE INDEX "property_policies_propertyId_idx" ON "property_policies"("propertyId");

-- AddForeignKey
ALTER TABLE "amenities" ADD CONSTRAINT "amenities_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_policies" ADD CONSTRAINT "property_policies_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
