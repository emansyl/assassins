-- ============================================================
-- confirm_kill: Atomic kill confirmation + chain reassignment
-- ============================================================
create or replace function confirm_kill(
  p_assassin_id uuid,
  p_target_id uuid,
  p_selfie_url text default null,
  p_confirmed_by text default 'app',
  p_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_assignment_id uuid;
  v_targets_target_id uuid;
  v_kill_id uuid;
  v_new_assignment_id uuid;
  v_game_status text;
  v_players_remaining int;
begin
  -- 1. Validate game is active
  select status into v_game_status from game_state where id = 1;
  if v_game_status != 'active' then
    return jsonb_build_object('success', false, 'error', 'Game is not active');
  end if;

  -- 2. Validate the assignment exists and is active
  select id into v_assignment_id
  from assignments
  where assassin_id = p_assassin_id
    and target_id = p_target_id
    and status = 'active';

  if v_assignment_id is null then
    return jsonb_build_object('success', false, 'error', 'No active assignment found for this assassin/target pair');
  end if;

  -- 3. Insert the kill record
  insert into kills (assassin_id, target_id, confirmed_at, confirmed_by, selfie_url, notes)
  values (p_assassin_id, p_target_id, now(), p_confirmed_by, p_selfie_url, p_notes)
  returning id into v_kill_id;

  -- 4. Mark the assignment as completed
  update assignments
  set status = 'completed', completed_at = now()
  where id = v_assignment_id;

  -- 5. Eliminate the target
  update players
  set status = 'eliminated', eliminated_at = now(), eliminated_by = p_assassin_id
  where id = p_target_id;

  -- 6. Increment assassin's kill count
  update players
  set kill_count = kill_count + 1
  where id = p_assassin_id;

  -- 7. Reassign the chain: find who the eliminated target was hunting
  select target_id into v_targets_target_id
  from assignments
  where assassin_id = p_target_id and status = 'active';

  if v_targets_target_id is not null then
    -- Deactivate the eliminated player's assignment
    update assignments
    set status = 'reassigned'
    where assassin_id = p_target_id and status = 'active';

    -- Only create new assignment if not self-targeting (last 2 players scenario)
    if v_targets_target_id != p_assassin_id then
      insert into assignments (assassin_id, target_id, status, assigned_at)
      values (p_assassin_id, v_targets_target_id, 'active', now())
      returning id into v_new_assignment_id;
    end if;
  end if;

  -- 8. Update game state
  select count(*) into v_players_remaining
  from players where status = 'alive';

  update game_state
  set players_remaining = v_players_remaining
  where id = 1;

  -- 9. Check for winner
  if v_players_remaining <= 1 then
    update game_state
    set status = 'ended'
    where id = 1;
  end if;

  return jsonb_build_object(
    'success', true,
    'kill_id', v_kill_id,
    'new_assignment_id', v_new_assignment_id,
    'players_remaining', v_players_remaining,
    'game_over', v_players_remaining <= 1
  );
end;
$$;


-- ============================================================
-- generate_assignments: Create circular assignment chain
-- ============================================================
create or replace function generate_assignments()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_players uuid[];
  v_count int;
  i int;
begin
  -- Deactivate any existing active assignments
  update assignments set status = 'reassigned' where status = 'active';

  -- Get all alive players in random order
  select array_agg(id order by random()) into v_players
  from players
  where status = 'alive';

  v_count := coalesce(array_length(v_players, 1), 0);

  if v_count < 2 then
    return jsonb_build_object('success', false, 'error', 'Need at least 2 active players');
  end if;

  -- Create circular chain: player[i] targets player[i+1], last targets first
  for i in 1..v_count loop
    insert into assignments (assassin_id, target_id, status, assigned_at)
    values (
      v_players[i],
      v_players[case when i = v_count then 1 else i + 1 end],
      'active',
      now()
    );
  end loop;

  -- Update game state
  update game_state
  set players_remaining = v_count,
      current_round = coalesce(current_round, 0) + 1
  where id = 1;

  return jsonb_build_object('success', true, 'assignments_created', v_count);
end;
$$;


-- ============================================================
-- get_leaderboard: Public leaderboard data
-- ============================================================
create or replace function get_leaderboard()
returns table (
  player_id uuid,
  full_name text,
  nickname text,
  photo_url text,
  kill_count int,
  status text,
  eliminated_at timestamptz
)
language sql
security definer
stable
set search_path = public
as $$
  select id, full_name, nickname, photo_url, kill_count, status::text, eliminated_at
  from players
  order by kill_count desc, eliminated_at asc nulls first;
$$;


-- ============================================================
-- enforce_deadline: Auto-eliminate players who haven't killed
-- since their current assignment was issued
-- ============================================================
create or replace function enforce_deadline()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inactive_players uuid[];
  v_player_id uuid;
  v_target_id uuid;
  v_targets_target_id uuid;
  v_eliminated_count int := 0;
  v_players_remaining int;
begin
  -- Find active players whose current assignment has no completed kill
  -- (i.e., they haven't eliminated anyone since being assigned their current target)
  select array_agg(a.assassin_id) into v_inactive_players
  from assignments a
  join players p on p.id = a.assassin_id
  where a.status = 'active'
    and p.status = 'alive'
    and not exists (
      select 1 from kills k
      where k.assassin_id = a.assassin_id
        and k.confirmed_at >= a.assigned_at
    );

  if v_inactive_players is null or array_length(v_inactive_players, 1) is null then
    return jsonb_build_object('success', true, 'eliminated_count', 0, 'message', 'No inactive players found');
  end if;

  -- Eliminate each inactive player and reassign their chain
  foreach v_player_id in array v_inactive_players loop
    -- Get this player's target
    select target_id into v_target_id
    from assignments
    where assassin_id = v_player_id and status = 'active';

    -- Eliminate the player
    update players
    set status = 'eliminated', eliminated_at = now()
    where id = v_player_id;

    -- Mark their assignment as reassigned
    update assignments
    set status = 'reassigned'
    where assassin_id = v_player_id and status = 'active';

    -- Find who was hunting this player and reassign them to this player's target
    if v_target_id is not null then
      -- Find the player hunting the eliminated player
      update assignments
      set target_id = v_target_id
      where target_id = v_player_id and status = 'active';
    end if;

    v_eliminated_count := v_eliminated_count + 1;
  end loop;

  -- Update game state
  select count(*) into v_players_remaining
  from players where status = 'alive';

  update game_state
  set players_remaining = v_players_remaining
  where id = 1;

  if v_players_remaining <= 1 then
    update game_state set status = 'ended' where id = 1;
  end if;

  return jsonb_build_object(
    'success', true,
    'eliminated_count', v_eliminated_count,
    'players_remaining', v_players_remaining,
    'game_over', v_players_remaining <= 1
  );
end;
$$;
