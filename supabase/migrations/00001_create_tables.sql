-- Game state (singleton row)
create table game_state (
  id int primary key default 1 check (id = 1),
  status text not null default 'pending' check (status in ('pending', 'active', 'paused', 'ended')),
  started_at timestamptz,
  current_round int not null default 1,
  players_remaining int not null default 0,
  deadline timestamptz
);

-- Insert the singleton row
insert into game_state (id) values (1);

-- Players table
create table players (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  phone text not null,
  full_name text not null,
  nickname text,
  photo_url text,
  status text not null default 'alive' check (status in ('alive', 'eliminated', 'opted_out')),
  kill_count int not null default 0,
  eliminated_at timestamptz,
  eliminated_by uuid references players(id),
  created_at timestamptz not null default now()
);

-- Assignments table (who is hunting whom)
create table assignments (
  id uuid primary key default gen_random_uuid(),
  assassin_id uuid not null references players(id),
  target_id uuid not null references players(id),
  status text not null default 'active' check (status in ('active', 'completed', 'reassigned')),
  assigned_at timestamptz not null default now(),
  completed_at timestamptz
);

create index idx_assignments_assassin_active on assignments(assassin_id) where status = 'active';
create index idx_assignments_target_active on assignments(target_id) where status = 'active';

-- Kills table (confirmed eliminations)
create table kills (
  id uuid primary key default gen_random_uuid(),
  assassin_id uuid not null references players(id),
  target_id uuid not null references players(id),
  confirmed_at timestamptz not null default now(),
  confirmed_by text not null default 'app' check (confirmed_by in ('app', 'sms', 'admin')),
  selfie_url text,
  notes text
);

create index idx_kills_confirmed_at on kills(confirmed_at desc);

-- Messages table
create table messages (
  id uuid primary key default gen_random_uuid(),
  sender text not null default 'SYSTEM',
  recipient_id uuid references players(id),
  subject text,
  body text not null,
  channel text not null default 'app' check (channel in ('app', 'sms', 'email', 'all')),
  sent_at timestamptz not null default now(),
  read_at timestamptz
);

create index idx_messages_recipient on messages(recipient_id, sent_at desc);

-- Trigger: auto-create player profile when a new auth user is created
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.players (id, email, phone, full_name)
  values (
    new.id,
    coalesce(new.email, new.raw_user_meta_data ->> 'email', ''),
    coalesce(new.phone, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
