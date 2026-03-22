-- Enable RLS on campaign_boards for team-based isolation
ALTER TABLE "campaign_boards" ENABLE ROW LEVEL SECURITY;

-- Policy: user can access campaign boards if they are a member of the team
-- When app.user_id is set (via SET LOCAL), enforce team membership
-- When not set, allow access (backward compat - app layer enforces)
CREATE POLICY "campaign_boards_team_access" ON "campaign_boards"
  FOR ALL
  USING (
    current_setting('app.user_id', true) IS NULL
    OR "teamId" IN (
      SELECT "teamId" FROM "team_members"
      WHERE "userId" = current_setting('app.user_id', true)
    )
  );
