-- AlterTable
ALTER TABLE "reservations" ADD COLUMN IF NOT EXISTS "deposit" DOUBLE PRECISION;
ALTER TABLE "reservations" ADD COLUMN IF NOT EXISTS "touristTax" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "seasonRates" JSONB;

-- CreateTable
CREATE TABLE IF NOT EXISTS "payments" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "method" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "payments_reservationId_idx" ON "payments"("reservationId");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'payments_reservationId_fkey'
    ) THEN
        ALTER TABLE "payments" ADD CONSTRAINT "payments_reservationId_fkey"
            FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
