-- Track wrong kill-verification guesses per assignment.
-- 3 wrong guesses = auto-elimination (no kill credit).

ALTER TABLE assignments ADD COLUMN wrong_guesses int NOT NULL DEFAULT 0;

-- RPC: increment wrong_guesses on a player's active assignment.
-- Returns the new count. Security definer bypasses RLS.
CREATE OR REPLACE FUNCTION increment_wrong_guesses(p_assignment_id uuid)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_count int;
BEGIN
  UPDATE assignments
  SET wrong_guesses = wrong_guesses + 1
  WHERE id = p_assignment_id AND status = 'active'
  RETURNING wrong_guesses INTO v_new_count;

  RETURN coalesce(v_new_count, 0);
END;
$$;

-- RPC: auto-eliminate a player who failed verification 3 times.
-- Splices them out of the chain with no kill credit.
CREATE OR REPLACE FUNCTION auto_eliminate_failed_assassin(p_player_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_target_id uuid;
  v_hunter_assignment_id uuid;
  v_players_remaining int;
BEGIN
  -- Get this player's target
  SELECT target_id INTO v_target_id
  FROM assignments
  WHERE assassin_id = p_player_id AND status = 'active';

  -- Eliminate the player (no killer credit)
  UPDATE players
  SET status = 'eliminated', eliminated_at = now(), eliminated_by = NULL
  WHERE id = p_player_id;

  -- Deactivate their assignment
  UPDATE assignments
  SET status = 'reassigned'
  WHERE assassin_id = p_player_id AND status = 'active';

  -- Reassign: whoever was hunting this player now hunts this player's target
  IF v_target_id IS NOT NULL THEN
    UPDATE assignments
    SET target_id = v_target_id
    WHERE target_id = p_player_id AND status = 'active';
  END IF;

  -- Update game state
  SELECT count(*) INTO v_players_remaining
  FROM players WHERE status = 'alive';

  UPDATE game_state
  SET players_remaining = v_players_remaining
  WHERE id = 1;

  IF v_players_remaining <= 1 THEN
    UPDATE game_state SET status = 'ended' WHERE id = 1;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'eliminated', p_player_id,
    'players_remaining', v_players_remaining,
    'game_over', v_players_remaining <= 1
  );
END;
$$;
