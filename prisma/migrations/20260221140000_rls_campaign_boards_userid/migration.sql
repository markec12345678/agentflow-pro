-- Extend RLS policy to allow userId-based access (personal boards)
DROP POLICY IF EXISTS "campaign_boards_team_access" ON "campaign_boards";
CREATE POLICY "campaign_boards_team_access" ON "campaign_boards"
  FOR ALL
  USING (
    current_setting('app.user_id', true) IS NULL
    OR "userId" = current_setting('app.user_id', true)
    OR "teamId" IN (
      SELECT "teamId" FROM "team_members"
      WHERE "userId" = current_setting('app.user_id', true)
    )
  );
