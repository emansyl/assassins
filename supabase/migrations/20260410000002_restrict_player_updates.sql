-- Remove the policy that let players update their own row.
-- All legitimate updates go through security definer RPCs or the admin client.
DROP POLICY IF EXISTS "players_update_own" ON players;

-- Remove the policy that let players insert into kills directly.
-- All kill inserts go through confirm_kill RPC (security definer).
DROP POLICY IF EXISTS "kills_insert_own" ON kills;
