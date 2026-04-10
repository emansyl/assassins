-- RPC to fully reset the game back to initial state
-- Clears all kills, assignments, resets all players, and resets game_state
create or replace function reset_game()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_player_count int;
begin
  -- Only game master can reset
  if not is_game_master() then
    return jsonb_build_object('success', false, 'error', 'Not authorized');
  end if;

  -- Delete all kills
  delete from kills where true;

  -- Delete all assignments
  delete from assignments where true;

  -- Reset all players to initial state
  update players set
    status = 'alive',
    kill_count = 0,
    eliminated_at = null,
    eliminated_by = null,
    onboarding_complete = false,
    rules_accepted_at = null,
    spoon_collected = false
  where true;

  -- Count players
  select count(*) into v_player_count from players;

  -- Reset game state
  update game_state set
    status = 'pending',
    started_at = null,
    current_round = 1,
    players_remaining = v_player_count,
    deadline = null
  where id = 1;

  return jsonb_build_object('success', true, 'players_reset', v_player_count);
end;
$$;
