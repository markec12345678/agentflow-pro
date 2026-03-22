-- CreateTable
CREATE TABLE "page_builder_templates" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "components" JSONB NOT NULL DEFAULT '[]',
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "page_builder_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "page_builder_pages" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT,
    "components" JSONB NOT NULL DEFAULT '[]',
    "lastModified" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "page_builder_pages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "page_builder_templates_userId_idx" ON "page_builder_templates"("userId");

-- CreateIndex
CREATE INDEX "page_builder_templates_isPublic_idx" ON "page_builder_templates"("isPublic");

-- CreateIndex
CREATE INDEX "page_builder_pages_userId_idx" ON "page_builder_pages"("userId");
