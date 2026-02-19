-- CreateTable
CREATE TABLE "landing_pages" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT,
    "content" JSONB NOT NULL,
    "template" TEXT NOT NULL DEFAULT 'tourism-basic',
    "languages" TEXT[],
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "publishedUrl" TEXT,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "landing_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seo_metrics" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contentId" TEXT,
    "contentType" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "position" INTEGER,
    "searchVolume" INTEGER,
    "difficulty" INTEGER,
    "lastChecked" TIMESTAMP(3),

    CONSTRAINT "seo_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "translation_jobs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sourceContent" TEXT NOT NULL,
    "sourceLang" TEXT NOT NULL DEFAULT 'sl',
    "targetLangs" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'pending',
    "results" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "translation_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "landing_pages_slug_key" ON "landing_pages"("slug");

-- CreateIndex
CREATE INDEX "landing_pages_userId_isPublished_idx" ON "landing_pages"("userId", "isPublished");

-- CreateIndex
CREATE INDEX "seo_metrics_userId_contentType_keyword_idx" ON "seo_metrics"("userId", "contentType", "keyword");

-- CreateIndex
CREATE INDEX "translation_jobs_userId_status_idx" ON "translation_jobs"("userId", "status");

-- AddForeignKey
ALTER TABLE "landing_pages" ADD CONSTRAINT "landing_pages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seo_metrics" ADD CONSTRAINT "seo_metrics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "translation_jobs" ADD CONSTRAINT "translation_jobs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
