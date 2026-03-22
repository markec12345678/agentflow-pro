-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'EDITOR', 'VIEWER');

-- AlterTable
ALTER TABLE "users" ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'VIEWER';
ALTER TABLE "users" ADD COLUMN "aiQuota" INTEGER NOT NULL DEFAULT 100;
ALTER TABLE "users" ADD COLUMN "activeTeamId" TEXT;
ALTER TABLE "users" ADD COLUMN "emailVerified" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN "image" TEXT;

ALTER TABLE "BlogPost" ADD COLUMN "imageUrl" TEXT;
ALTER TABLE "BlogPost" ADD COLUMN "pipelineStage" TEXT DEFAULT 'draft';
ALTER TABLE "BlogPost" ADD COLUMN "brief" TEXT;
ALTER TABLE "BlogPost" ADD COLUMN "reviewedAt" TIMESTAMP(3);
ALTER TABLE "BlogPost" ADD COLUMN "guardrailIssues" JSONB;
ALTER TABLE "BlogPost" ADD COLUMN "approvedBy" TEXT;
ALTER TABLE "BlogPost" ADD COLUMN "approvalStatus" TEXT DEFAULT 'pending';
ALTER TABLE "BlogPost" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "seo_metrics" ADD COLUMN "propertyId" TEXT;
ALTER TABLE "seo_metrics" ADD COLUMN "clicks" INTEGER;
ALTER TABLE "seo_metrics" ADD COLUMN "impressions" INTEGER;
ALTER TABLE "seo_metrics" ADD COLUMN "date" TIMESTAMP(3);
CREATE INDEX "seo_metrics_propertyId_date_idx" ON "seo_metrics"("propertyId", "date");
ALTER TABLE "seo_metrics" ADD CONSTRAINT "seo_metrics_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "page_designs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "blocks" JSONB NOT NULL,
    "rawHtml" TEXT,
    "rawCss" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "page_designs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "page_designs_userId_published_idx" ON "page_designs"("userId", "published");
CREATE INDEX "page_designs_version_idx" ON "page_designs"("version");

-- AddForeignKey
ALTER TABLE "page_designs" ADD CONSTRAINT "page_designs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
