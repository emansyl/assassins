-- Fix is_game_master() — the previous version relied on a Postgres
-- runtime setting (app.settings.game_master_email) that was never configured,
-- so all admin mutations through RLS silently failed.
--
-- Replace with a direct email check. For a one-time game this is fine.

create or replace function is_game_master()
returns boolean
language sql
security definer
stable
as $$
  select coalesce(
    (select email from auth.users where id = auth.uid()) = 'esylvester@mba2027.hbs.edu',
    false
  );
$$;
