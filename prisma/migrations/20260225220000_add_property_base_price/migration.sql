-- AlterTable
ALTER TABLE "properties" ADD COLUMN "basePrice" DOUBLE PRECISION,
ADD COLUMN "currency" TEXT DEFAULT 'EUR';
