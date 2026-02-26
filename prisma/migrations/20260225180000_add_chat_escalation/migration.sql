-- CreateTable
CREATE TABLE "chat_escalations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "threadId" TEXT,
    "lastMessagePreview" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_escalations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "chat_escalations_userId_idx" ON "chat_escalations"("userId");

-- CreateIndex
CREATE INDEX "chat_escalations_threadId_idx" ON "chat_escalations"("threadId");

-- CreateIndex
CREATE INDEX "chat_escalations_status_idx" ON "chat_escalations"("status");

-- AddForeignKey
ALTER TABLE "chat_escalations" ADD CONSTRAINT "chat_escalations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_escalations" ADD CONSTRAINT "chat_escalations_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "conversation_threads"("id") ON DELETE SET NULL ON UPDATE CASCADE;
