-- AlterTable
ALTER TABLE "User" ADD COLUMN "activeTeamId" TEXT;

-- AlterTable
ALTER TABLE "CampaignBoard" ADD COLUMN "teamId" TEXT;

-- CreateIndex
CREATE INDEX "CampaignBoard_teamId_idx" ON "CampaignBoard"("teamId");

-- AddForeignKey
ALTER TABLE "CampaignBoard" ADD CONSTRAINT "CampaignBoard_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
