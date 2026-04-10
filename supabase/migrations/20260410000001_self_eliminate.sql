-- Allow 'self' as a confirmed_by type for voluntary dropouts
ALTER TABLE kills DROP CONSTRAINT IF EXISTS kills_confirmed_by_check;
ALTER TABLE kills ADD CONSTRAINT kills_confirmed_by_check
  CHECK (confirmed_by IN ('app', 'sms', 'admin', 'self', 'auto'));

-- RPC: self-eliminate (voluntary dropout, no kill credit)
CREATE OR REPLACE FUNCTION self_eliminate(p_player_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_target_id uuid;
  v_players_remaining int;
  v_player_status text;
BEGIN
  -- Verify caller is the player
  IF p_player_id != auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authorized');
  END IF;

  -- Verify player is alive
  SELECT status INTO v_player_status FROM players WHERE id = p_player_id;
  IF v_player_status != 'alive' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Player is not alive');
  END IF;

  -- Get this player's target before we deactivate
  SELECT target_id INTO v_target_id
  FROM assignments
  WHERE assassin_id = p_player_id AND status = 'active';

  -- Eliminate the player (no killer credit)
  UPDATE players
  SET status = 'eliminated', eliminated_at = now(), eliminated_by = NULL
  WHERE id = p_player_id;

  -- Insert kill record for the feed
  INSERT INTO kills (assassin_id, target_id, confirmed_at, confirmed_by, notes)
  VALUES (p_player_id, p_player_id, now(), 'self', NULL);

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
    'players_remaining', v_players_remaining,
    'game_over', v_players_remaining <= 1
  );
END;
$$;
