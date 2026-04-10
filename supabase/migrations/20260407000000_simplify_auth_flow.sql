-- Simplify auth: drop player_seeds, pre-create auth.users via admin API.
-- handle_new_user() now reads name/photo from raw_user_meta_data only.

drop function if exists handle_new_user() cascade;

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.players (id, email, full_name, photo_url)
  values (
    new.id,
    coalesce(new.email, new.raw_user_meta_data ->> 'email', ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.raw_user_meta_data ->> 'photo_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

drop table if exists player_seeds cascade;
