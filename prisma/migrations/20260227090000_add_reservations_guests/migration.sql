-- CreateTable (guests must exist before reservations)
CREATE TABLE IF NOT EXISTS "guests" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "reservations" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "guestId" TEXT,
    "roomId" TEXT,
    "checkIn" TIMESTAMP(3) NOT NULL,
    "checkOut" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'confirmed',
    "channel" TEXT,
    "totalPrice" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reservations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "blocked_dates" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "roomId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blocked_dates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "guest_communications" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "guestId" TEXT,
    "type" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "subject" TEXT,
    "content" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "variables" JSONB,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guest_communications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "guests_propertyId_idx" ON "guests"("propertyId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "reservations_propertyId_checkIn_idx" ON "reservations"("propertyId", "checkIn");
CREATE INDEX IF NOT EXISTS "reservations_status_idx" ON "reservations"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "blocked_dates_propertyId_date_idx" ON "blocked_dates"("propertyId", "date");
CREATE INDEX IF NOT EXISTS "blocked_dates_roomId_date_idx" ON "blocked_dates"("roomId", "date");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "guest_communications_propertyId_type_status_idx" ON "guest_communications"("propertyId", "type", "status");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'guests_propertyId_fkey') THEN
        ALTER TABLE "guests" ADD CONSTRAINT "guests_propertyId_fkey"
            FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reservations_propertyId_fkey') THEN
        ALTER TABLE "reservations" ADD CONSTRAINT "reservations_propertyId_fkey"
            FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reservations_guestId_fkey') THEN
        ALTER TABLE "reservations" ADD CONSTRAINT "reservations_guestId_fkey"
            FOREIGN KEY ("guestId") REFERENCES "guests"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'blocked_dates_propertyId_fkey') THEN
        ALTER TABLE "blocked_dates" ADD CONSTRAINT "blocked_dates_propertyId_fkey"
            FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'guest_communications_propertyId_fkey') THEN
        ALTER TABLE "guest_communications" ADD CONSTRAINT "guest_communications_propertyId_fkey"
            FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'guest_communications_guestId_fkey') THEN
        ALTER TABLE "guest_communications" ADD CONSTRAINT "guest_communications_guestId_fkey"
            FOREIGN KEY ("guestId") REFERENCES "guests"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
