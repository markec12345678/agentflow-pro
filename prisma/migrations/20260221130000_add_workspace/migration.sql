-- CreateTable (IF NOT EXISTS - workspace may exist from partial prior run)
CREATE TABLE IF NOT EXISTS "workspaces" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workspaces_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "workspaces_teamId_idx" ON "workspaces"("teamId");

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='campaign_boards' AND column_name='workspaceId') THEN
        ALTER TABLE "campaign_boards" ADD COLUMN "workspaceId" TEXT;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS "campaign_boards_workspaceId_idx" ON "campaign_boards"("workspaceId");

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'workspaces_teamId_fkey') THEN
        ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'campaign_boards_workspaceId_fkey') THEN
        ALTER TABLE "campaign_boards" ADD CONSTRAINT "campaign_boards_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
