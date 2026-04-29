-- =============================================================
-- Demo users — for read-only demo accounts (e.g., professor)
-- =============================================================

-- Add the flag (defaults to false for all existing players)
alter table players
  add column is_demo boolean not null default false;

-- Update get_leaderboard to exclude demo users from rankings
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
  where is_demo = false
  order by kill_count desc, eliminated_at asc nulls first;
$$;

-- Update generate_assignments to exclude demo users from the chain
-- (defensive: they're 'opted_out' so wouldn't be picked anyway)
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

  -- Get all alive non-demo players in random order
  select array_agg(id order by random()) into v_players
  from players
  where status = 'alive' and is_demo = false;

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
