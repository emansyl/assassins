-- Player seeds: admin-uploaded player data before game starts
-- Players sign up via email OTP; the handle_new_user() trigger
-- pulls name/photo/phone from this table into the real players row.

create table player_seeds (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  full_name text not null,
  photo_url text,
  phone text,              -- set when player links their phone during registration
  claimed boolean not null default false,
  claimed_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_player_seeds_email on player_seeds(lower(email));
create index idx_player_seeds_phone on player_seeds(phone) where phone is not null;

-- RLS: admin-only (all unauthenticated lookups go through server actions with service role)
alter table player_seeds enable row level security;

create policy "player_seeds_admin_all" on player_seeds
  for all using (is_game_master());

-- Make players.phone nullable (pre-seeded players don't have phones yet)
alter table players alter column phone drop not null;

-- Replace handle_new_user() to pull from player_seeds when available
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_seed record;
  v_email text;
  v_phone text;
begin
  v_email := coalesce(new.email, new.raw_user_meta_data ->> 'email', '');
  v_phone := coalesce(new.phone, '');

  -- Look up pre-seeded player data by email
  select * into v_seed
  from player_seeds
  where lower(email) = lower(v_email)
    and claimed = false;

  if v_seed is not null then
    -- Pre-seeded player: create players row with seed data
    insert into public.players (id, email, phone, full_name, photo_url)
    values (
      new.id,
      v_seed.email,
      coalesce(v_seed.phone, v_phone),
      v_seed.full_name,
      v_seed.photo_url
    );

    -- Mark seed as claimed
    update player_seeds
    set claimed = true, claimed_at = now()
    where id = v_seed.id;
  else
    -- Fallback: non-seeded user
    insert into public.players (id, email, phone, full_name)
    values (
      new.id,
      v_email,
      v_phone,
      coalesce(new.raw_user_meta_data ->> 'full_name', '')
    );
  end if;

  return new;
end;
$$;

-- Private headshots bucket (accessed via signed URLs or authenticated queries)
insert into storage.buckets (id, name, public)
values ('headshots', 'headshots', false);

-- Authenticated users can view headshots
create policy "headshots_authenticated_select" on storage.objects
  for select
  using (
    bucket_id = 'headshots'
    and auth.role() = 'authenticated'
  );
