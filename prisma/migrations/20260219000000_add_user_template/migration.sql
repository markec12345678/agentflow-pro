-- CreateTable
CREATE TABLE "user_templates" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "basePrompt" TEXT NOT NULL,
    "customVars" JSONB,
    "content" TEXT,
    "language" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_templates_userId_category_idx" ON "user_templates"("userId", "category");

-- AddForeignKey
ALTER TABLE "user_templates" ADD CONSTRAINT "user_templates_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
