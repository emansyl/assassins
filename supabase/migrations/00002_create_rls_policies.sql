-- Enable RLS on all tables
alter table game_state enable row level security;
alter table players enable row level security;
alter table assignments enable row level security;
alter table kills enable row level security;
alter table messages enable row level security;

-- Helper: check if current user is the game master
create or replace function is_game_master()
returns boolean
language sql
security definer
stable
as $$
  select coalesce(
    (select email from auth.users where id = auth.uid()) = current_setting('app.settings.game_master_email', true),
    false
  );
$$;

-- ============ GAME STATE ============
-- Everyone can read game state
create policy "game_state_select" on game_state
  for select using (true);

-- Only admin can update game state
create policy "game_state_update" on game_state
  for update using (is_game_master());

-- ============ PLAYERS ============
-- Players can read their own full row
create policy "players_select_own" on players
  for select using (id = auth.uid());

-- Admin can read all players
create policy "players_select_admin" on players
  for select using (is_game_master());

-- Public leaderboard fields (everyone can see name, kill_count, status)
create policy "players_select_leaderboard" on players
  for select using (true);

-- Players can update their own profile (nickname, photo)
create policy "players_update_own" on players
  for update using (id = auth.uid())
  with check (id = auth.uid());

-- Admin can update any player
create policy "players_update_admin" on players
  for update using (is_game_master());

-- ============ ASSIGNMENTS ============
-- Players can only see their own active assignment (as assassin)
create policy "assignments_select_own" on assignments
  for select using (assassin_id = auth.uid() and status = 'active');

-- Admin can see all assignments
create policy "assignments_select_admin" on assignments
  for select using (is_game_master());

-- ============ KILLS ============
-- Everyone can read kills (public feed)
create policy "kills_select" on kills
  for select using (true);

-- Authenticated users can insert their own kills
create policy "kills_insert_own" on kills
  for insert with check (assassin_id = auth.uid());

-- Admin can insert/update kills
create policy "kills_insert_admin" on kills
  for insert with check (is_game_master());

create policy "kills_update_admin" on kills
  for update using (is_game_master());

-- ============ MESSAGES ============
-- Players can read broadcasts (recipient_id is null) and their own messages
create policy "messages_select_own" on messages
  for select using (
    recipient_id is null
    or recipient_id = auth.uid()
  );

-- Admin can read all messages
create policy "messages_select_admin" on messages
  for select using (is_game_master());

-- Admin can insert messages
create policy "messages_insert_admin" on messages
  for insert with check (is_game_master());

-- Players can update their own messages (mark as read)
create policy "messages_update_own" on messages
  for update using (recipient_id = auth.uid())
  with check (recipient_id = auth.uid());
