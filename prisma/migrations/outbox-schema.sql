/**
 * Database Schema Extensions for Outbox Pattern
 * 
 * Dodaj v prisma/schema.prisma
 */

// ============================================================================
// Outbox Model (dodaj v obstoječi schema.prisma)
// ============================================================================

/*
model Outbox {
  id          String   @id @default(cuid())
  eventType   String
  payload     Json
  metadata    Json?
  status      String   @default("pending") // pending | processing | processed | failed
  attempts    Int      @default(0)
  maxAttempts Int      @default(3)
  errorMessage String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  processedAt DateTime?
  nextRetryAt DateTime?
  
  @@index([status, createdAt])
  @@index([status, nextRetryAt])
  @@index([eventType, status])
}
*/

// ============================================================================
// Migration SQL (če rabiš manual migration)
// ============================================================================

/*
-- Create outbox table
CREATE TABLE "Outbox" (
  "id" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "metadata" JSONB,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "maxAttempts" INTEGER NOT NULL DEFAULT 3,
  "errorMessage" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "processedAt" TIMESTAMP(3),
  "nextRetryAt" TIMESTAMP(3),
  
  CONSTRAINT "Outbox_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE INDEX "Outbox_status_createdAt_idx" ON "Outbox"("status", "createdAt");
CREATE INDEX "Outbox_status_nextRetryAt_idx" ON "Outbox"("status", "nextRetryAt");
CREATE INDEX "Outbox_eventType_status_idx" ON "Outbox"("eventType", "status");
*/
