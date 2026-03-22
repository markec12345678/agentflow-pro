-- CreateTable
CREATE TABLE "conversation_threads" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "parentThreadId" TEXT,
    "messages" JSONB NOT NULL DEFAULT '[]',
    "title" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversation_threads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "conversation_threads_userId_idx" ON "conversation_threads"("userId");

-- CreateIndex
CREATE INDEX "conversation_threads_parentThreadId_idx" ON "conversation_threads"("parentThreadId");

-- AddForeignKey
ALTER TABLE "conversation_threads" ADD CONSTRAINT "conversation_threads_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_threads" ADD CONSTRAINT "conversation_threads_parentThreadId_fkey" FOREIGN KEY ("parentThreadId") REFERENCES "conversation_threads"("id") ON DELETE SET NULL ON UPDATE CASCADE;
