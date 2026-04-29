# HBS Section E Assassins

A web-based "Assassins" game (a.k.a. Spoon Wars) built for Harvard Business School Section E. Players are assigned a target operative and must "eliminate" them by tagging them with a spoon in real life. When you eliminate your target, you inherit their target — the chain stays a single closed loop until one operative remains.

Built as a one-off project for ~90 players over a 2-week game. The codebase is intentionally pragmatic: small dependency footprint, atomic database operations, and a terminal/hacker aesthetic.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Setup](#setup)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Seeding Players](#seeding-players)
- [Game Flow](#game-flow)
- [Admin Operations](#admin-operations)
- [Demo Mode](#demo-mode)
- [Security Model](#security-model)
- [Deployment](#deployment)
- [Database Schema](#database-schema)

---

## Features

### Player-facing

- **OTP login** — passwordless email login, restricted to pre-seeded HBS emails
- **Target dossier** — see your current target's photo and name, blurred behind a tap-to-reveal so passersby can't peek over your shoulder
- **Kill confirmation quiz** — confirming a kill requires answering who *your target's target* is, multiple-choice with 4 decoys. 3 wrong guesses = auto-elimination. Prevents fake kills.
- **Spoon-collected gating** — you can only eliminate targets who have collected their physical spoon
- **Self-elimination** — players can voluntarily drop out from their profile page; chain splices automatically
- **Kill feed** — real-time feed of all eliminations with auto-generated funny death messages (different pools for kills, self-eliminations, and auto-eliminations)
- **Leaderboard** — two views: **KILLS** (direct eliminations) and **NOTORIETY** (cumulative — your kills plus all kills made by people you eliminated, recursively)
- **Profile dossier** — your headshot, kill count, threat level (escalates with kills), elimination log
- **PWA** — installable to home screen, custom icon, standalone display mode
- **Inline iOS install prompt** — Android gets the native `beforeinstallprompt` flow; iOS gets a one-time tutorial

### Admin (game master)

- **Game state controls** — start / pause / end the game
- **Shuffle Targets** — manually reshuffle every alive player into a fresh random circular chain
- **Player management** — manually eliminate or revive any player; toggle their spoon-collected flag
- **Kill override** — force-confirm a kill on behalf of a player (useful when their phone dies mid-game)
- **Broadcast composer** — send messages to all players or a specific player
- **Mission deadline** — set a kill deadline; "ENFORCE DEADLINE" auto-eliminates any player who hasn't acted by then
- **Reset Game** — full wipe of kills/assignments back to a clean state for a new game

### Demo mode (for reviewers/professors)

- **Pre-seeded demo accounts** — a script seeds a non-HBS email (e.g., a professor) with a special `is_demo` flag, onboarding pre-completed
- **Read-only admin view** — demo users can browse the admin console, but every button is disabled via `<fieldset disabled>`
- **Sample player dashboard** — demo users see a realistic mock dashboard with the game master as their fake target and 4 deterministic real-player decoys for the quiz; clicks show explanatory alerts instead of writing to the DB
- **Welcome modal** — first-visit overview explaining what they're looking at
- **Inline labels** — small `[ DEMO LABEL ]` callouts above each section explaining purpose
- **Interactive "How It Works" page** — `/demo/how-it-works` shows real player photos arranged in a circular chain. Click "SIMULATE KILL" to animate elimination + chain re-stitching. Includes a final "winner" state when only one operative remains, plus live game stats pulled from the DB.

---

## Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org) (App Router, React Server Components, Server Actions)
- **Database & Auth:** [Supabase](https://supabase.com) (Postgres + Row Level Security + Auth + Storage)
- **Frontend:** React 19, TypeScript 5, [Tailwind v4](https://tailwindcss.com)
- **Runtime:** [Bun](https://bun.com) (dev / install / scripts)
- **Spreadsheet parsing:** `xlsx` (for player seeding from .xlsx rosters)
- **Deployment:** Vercel
- **PWA:** Hand-rolled (manifest.json + minimal service worker)

No state management library, no UI component library, no animation library — everything is pure React + Tailwind utility classes.

---

## Architecture

### Auth flow

1. Player enters email → server action `canEmailLogin()` checks if it's a valid HBS domain OR a pre-seeded demo user
2. Supabase OTP email sent with `shouldCreateUser: false` (prevents drive-by signups)
3. Player enters 6-digit code → cookie-based session established
4. Middleware (`src/lib/supabase/middleware.ts`) refreshes JWT on every request via `getClaims()` (faster than `getUser()` — local JWKS validation, no network roundtrip)

### Trust boundaries

- **Anon client** (`src/lib/supabase/client.ts`) — runs in the browser, bound by RLS policies. Players cannot directly write to `players`, `kills`, or `assignments` tables (those policies are explicitly dropped — see [`supabase/migrations/20260410000002_restrict_player_updates.sql`](supabase/migrations/20260410000002_restrict_player_updates.sql)).
- **Server client** (`src/lib/supabase/server.ts`) — runs in Server Components / Server Actions, uses the user's cookie session. Same RLS as anon.
- **Admin client** (`src/lib/supabase/admin.ts`) — uses the service role key, bypasses all RLS. Only ever called from server-side code (Server Actions, Server Components, scripts).

### Atomic game operations (Postgres RPCs)

All multi-step game state changes are wrapped in `security definer` Postgres functions so they execute atomically:

- **`generate_assignments()`** — wipes the active chain and builds a fresh random circular chain of alive non-demo players
- **`confirm_kill()`** — marks the assignment completed, eliminates the target, increments the assassin's kill count, splices the chain (assassin inherits target's target), updates game state — all in one transaction
- **`self_eliminate()`** — voluntary dropout; same chain splice as above, no kill credit, inserts a `confirmed_by = 'self'` record for the feed
- **`auto_eliminate_failed_assassin()`** — triggered after 3 wrong verification guesses
- **`enforce_deadline()`** — admin button; eliminates anyone who hasn't acted before the deadline
- **`reset_game()`** — full wipe back to pending state

### React Server Component data flow

Every page is a Server Component that fetches its data in parallel with `Promise.all`. Client Components are used only for interactivity (e.g., kill confirmation quiz, blur-reveal toggles, admin buttons). After every mutation, server actions call `revalidatePath()` to re-render.

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/                   # callback route for OTP redirect
│   ├── (protected)/              # routes requiring login
│   │   ├── dashboard/            # main player view (target dossier + kill confirmation)
│   │   ├── leaderboard/          # KILLS + NOTORIETY tabs
│   │   ├── feed/                 # kill feed with funny messages
│   │   ├── profile/              # operative dossier + self-eliminate
│   │   ├── messages/             # broadcast inbox
│   │   ├── onboarding/           # rules + spoon collection
│   │   ├── rules/                # static rules page
│   │   └── demo/how-it-works/    # interactive chain visualization (demo users only)
│   ├── admin/                    # game master / demo console
│   ├── login-actions.ts          # canEmailLogin server action
│   ├── layout.tsx                # PWA manifest, viewport, SW registration
│   └── page.tsx                  # login form
├── components/
│   ├── admin/                    # GameControls, PlayerManagement, KillOverride, BroadcastComposer, AssignmentChain
│   ├── auth/                     # LoginForm, OtpVerification
│   ├── dashboard/                # TargetDossier, KillConfirmation, EliminatedScreen, PlayerStatsBar
│   ├── demo/                     # DemoBanner, DemoLabel, WelcomeModal, DemoDashboard, ChainVisualization, DemoStats
│   ├── leaderboard/              # RankingsTable, NotorietyTable, LeaderboardTabs
│   ├── messages/                 # MessageList
│   ├── onboarding/               # OnboardingFlow
│   ├── profile/                  # SelfEliminateButton
│   └── ui/                       # TerminalCard, TerminalButton, TerminalBadge, TerminalInput, BottomNav, InstallPrompt, etc.
├── lib/
│   ├── supabase/                 # client, server, admin, middleware
│   ├── notoriety.ts              # BFS for cumulative kill counts
│   ├── leaderboard-data.ts       # aggregation helpers
│   ├── kill-messages.ts          # funny death message pools
│   └── constants.ts              # HBS email domain allowlist
└── types/                        # Player, GameState, Assignment, Kill, Message types

supabase/
└── migrations/                   # SQL migrations (run in order)

scripts/
├── seed-players.ts               # bulk seed real players from an .xlsx roster
└── seed-demo-user.ts             # seed a single demo user (e.g., professor)

public/
├── manifest.json                 # PWA manifest
├── sw.js                         # minimal service worker (install + activate only)
└── icon.svg, icons/              # app icons
```

---

## Setup

### Prerequisites

- [Bun](https://bun.com) (v1.0 or later)
- A [Supabase](https://supabase.com) project (free tier is fine)
- Node.js 20+ (for `next build` runtime — Bun handles dev)

### Install

```bash
git clone <your-repo-url>
cd assassins
bun install
```

### Run locally

```bash
bun dev
```

Open <http://localhost:3000>. You'll see the login screen — but you can't log in yet until you've set up the database and seeded yourself as a player.

---

## Environment Variables

Create `.env.local` in the project root:

```bash
# Supabase project credentials (from Dashboard → Project Settings → API)
NEXT_PUBLIC_SUPABASE_URL=https://<your-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service role key — keep secret>

# The email of the game master (gets full admin access)
GAME_MASTER_EMAIL=you@mba2027.hbs.edu
```

Set the same variables in Vercel for production.

---

## Database Setup

### Apply migrations

Migrations live in `supabase/migrations/` and must be applied in order. The simplest way:

1. Open **Supabase Dashboard → SQL Editor**
2. For each `.sql` file in `supabase/migrations/` (in order), paste contents → Run

If you have the Supabase CLI set up:

```bash
supabase link --project-ref <your-ref>
supabase db push
```

### Migration overview

| File | Purpose |
|------|---------|
| `00001_create_tables.sql` | `players`, `assignments`, `kills`, `messages`, `game_state` tables |
| `00002_create_rls_policies.sql` | Row Level Security policies + `is_game_master()` helper |
| `00003_create_functions.sql` | `confirm_kill`, `generate_assignments`, `get_leaderboard`, `enforce_deadline` RPCs |
| `00004_create_storage.sql` | `headshots` storage bucket |
| `00005_player_seeds_and_auth_flow.sql` | Trigger that auto-creates a `players` row when a new auth user is created |
| `00006_make_headshots_private.sql` | Switches headshot bucket to private (signed URLs only) |
| `20260407000000_simplify_auth_flow.sql` | Refactor of player creation trigger |
| `20260408000000_fix_game_master_rls.sql` | Hardcodes game master email in RLS helper |
| `20260408000001_wrong_guesses.sql` | Adds `wrong_guesses` column to assignments + `increment_wrong_guesses` RPC |
| `20260408000002_onboarding.sql` | Adds `onboarding_complete`, `rules_accepted_at`, `spoon_collected` columns |
| `20260410000000_reset_game.sql` | `reset_game()` RPC |
| `20260410000001_self_eliminate.sql` | `self_eliminate()` RPC; adds `'self'` and `'auto'` to `confirmed_by` enum |
| `20260410000002_restrict_player_updates.sql` | Drops player write policies — all writes go through RPCs |
| `20260420000000_demo_users.sql` | Adds `is_demo` flag; updates `get_leaderboard` and `generate_assignments` to exclude demo users |

---

## Seeding Players

### Real players (bulk, from an .xlsx roster)

```bash
bun --env-file=.env.local scripts/seed-players.ts path/to/roster.xlsx
```

Expected columns in the spreadsheet (case-insensitive partial match):
- `Name` — accepts "First Last" or "Last, First"
- `Email` — must be an HBS domain (`@mba2026.hbs.edu` through `@mba2031.hbs.edu` — see [`src/lib/constants.ts`](src/lib/constants.ts))
- `Headshot Filename` — relative to the spreadsheet's directory

The script:
1. Uploads each headshot to the `headshots` Supabase Storage bucket
2. Creates the auth user (or updates if they already exist)
3. Inserts/updates the `players` row with `full_name` and `photo_url`

### Demo user (single, for a reviewer)

```bash
# Without photo
bun --env-file=.env.local scripts/seed-demo-user.ts professor@school.edu "Professor Smith"

# With photo
bun --env-file=.env.local scripts/seed-demo-user.ts professor@school.edu "Professor Smith" ./professor.jpg
```

Sets `is_demo = true`, `status = 'opted_out'` (so they're invisible to chain generation), `onboarding_complete = true` (so they can log in and immediately see the demo experience).

---

## Game Flow

### Player journey

1. **Login** — enter email → receive 6-digit OTP → enter code
2. **Onboarding** (first login only) — read rules → accept → confirm spoon collection
3. **Dashboard** — see your target's blurred photo. Once they've collected their spoon, you can attempt to eliminate them.
4. **Kill confirmation** — tap "Confirm Elimination" → answer "Who is my target's target?" via multiple choice. Correct = kill confirmed, you inherit their target. Wrong = lose 1 of 3 attempts; 3 wrong = auto-eliminated.
5. **Continue** — keep hunting until you're eliminated or the game ends. Your stats accumulate on the leaderboard.

### Admin journey

1. Seed all players via `seed-players.ts`
2. Open `/admin` → **Generate Assignment Chain** (creates the initial circular chain)
3. **Start Game** — flips game state to `active`, enabling kill confirmations
4. Monitor via stats, broadcast messages, manage edge cases (revive accidentally-eliminated players, override stuck kills, etc.)
5. **End Game** when the game concludes (or it auto-ends when one player remains)

---

## Admin Operations

### Common tasks

**Reshuffle all targets mid-game** (e.g., to speed things up):
- Admin → Target Assignments → **SHUFFLE TARGETS** (double-confirm)

**Manually eliminate a player** (e.g., they reported they want out):
- Admin → Player Management → search → **ELIM** button

**Force-confirm a kill** (player's phone died, etc.):
- Admin → Quick Kill Confirm → search assassin → confirm

**Broadcast an announcement**:
- Admin → Broadcast Transmission → write subject + body → send

**Verify chain integrity** (run in SQL Editor):

```sql
-- Confirm chain is a single closed loop
WITH RECURSIVE start_player AS (
  SELECT assassin_id FROM assignments WHERE status = 'active' LIMIT 1
), chain AS (
  SELECT a.assassin_id, a.target_id, 1 AS depth
  FROM assignments a JOIN start_player sp ON a.assassin_id = sp.assassin_id
  WHERE a.status = 'active'
  UNION ALL
  SELECT a.assassin_id, a.target_id, c.depth + 1
  FROM assignments a JOIN chain c ON a.assassin_id = c.target_id
  JOIN start_player sp ON a.assassin_id != sp.assassin_id
  WHERE a.status = 'active' AND c.depth < 200
)
SELECT
  (SELECT count(*) FROM chain) = (SELECT count(*) FROM players WHERE status = 'alive' AND is_demo = false) AS is_valid_loop,
  (SELECT target_id FROM chain ORDER BY depth DESC LIMIT 1) = (SELECT assassin_id FROM start_player) AS closes_loop;
```

**Find players who haven't logged in or onboarded**:

```sql
SELECT au.email, p.full_name, au.last_sign_in_at, p.onboarding_complete
FROM auth.users au
LEFT JOIN players p ON p.id = au.id
WHERE p.onboarding_complete IS DISTINCT FROM true
ORDER BY au.last_sign_in_at NULLS FIRST;
```

**Find players who haven't picked up their spoons**:

```sql
SELECT email, full_name FROM players
WHERE spoon_collected = false AND status = 'alive' AND is_demo = false;
```

---

## Demo Mode

Designed for reviewers (e.g., professors evaluating the project) to explore the app without disturbing the live game.

### Setup

1. Apply migration `20260420000000_demo_users.sql` (adds `is_demo` flag)
2. Seed the reviewer:
   ```bash
   bun --env-file=.env.local scripts/seed-demo-user.ts reviewer@example.edu "Reviewer Name" ./photo.jpg
   ```
3. Send them the URL — they enter their email → OTP → land on the demo experience

### What demo users see

| Page | Behavior |
|------|----------|
| `/dashboard` | Mock dashboard. Game master is shown as the fake target. 4 quiz options are real players (deterministic order so it's stable across visits). All actions show explanatory alerts — no DB writes. |
| `/leaderboard` | Real game data. Demo user not listed (filtered out by `get_leaderboard`). |
| `/feed` | Real kill feed. |
| `/profile` | Demo user's dossier (their photo + name appear). |
| `/admin` | Real admin console, but every button is disabled via `<fieldset disabled>`. Inline `[DEMO LABEL]` callouts above each section explain what it does. Stats counts exclude demo users. |
| `/demo/how-it-works` | Interactive chain visualization. 8 player nodes (including the demo user themselves) arranged in a circle. "SIMULATE KILL" animates an elimination and chain re-stitch. Final state celebrates the last operative standing. Includes live game stats pulled from the DB. |

### Removing a demo user

```sql
DELETE FROM auth.users WHERE email = 'reviewer@example.edu';
-- players row cascades automatically
```

---

## Security Model

### What players can do

- Read their own `players` row (via `players_select_own`)
- Read all other `players` rows (via `players_select_leaderboard` — needed for the leaderboard, multiple-choice quiz)
- Read their own active `assignment` (via `assignments_select_own`)
- Read all `kills` (public for the kill feed)

### What players cannot do

- Write to `players` directly — no UPDATE policy exists
- Write to `assignments` directly — no INSERT/UPDATE/DELETE policies
- Write to `kills` directly — no INSERT policy
- Read other players' assignments (so you can't extract the full chain)

### How writes happen

All writes go through `security definer` RPCs:
- `confirm_kill` — validates the calling user IS the assassin, then atomically updates kills + assignments + players + game_state
- `self_eliminate` — validates the calling user matches the player ID parameter
- `generate_assignments`, `enforce_deadline`, `reset_game` — admin-only via `is_game_master()` check

### Game master

Hardcoded by email in [`supabase/migrations/20260408000000_fix_game_master_rls.sql`](supabase/migrations/20260408000000_fix_game_master_rls.sql). Update the migration if you change game masters.

---

## Deployment

### Vercel

1. Push to GitHub
2. Import the repo at <https://vercel.com/new>
3. Add environment variables (see [Environment Variables](#environment-variables))
4. Deploy

The app is a standard Next.js project — works out-of-the-box on Vercel's free tier.

### Custom domain + PWA

If you want users to install the app to their home screen, deploy to a stable HTTPS URL. The PWA manifest (`public/manifest.json`) is already set up. iOS users get an install tutorial; Android/desktop users get the native install prompt.

---

## Database Schema

### `players`
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK, FK to `auth.users(id)` |
| `email` | text | Unique |
| `full_name` | text | |
| `nickname` | text | Optional |
| `photo_url` | text | Supabase Storage URL |
| `phone` | text | |
| `status` | text | `'alive'` \| `'eliminated'` \| `'opted_out'` |
| `kill_count` | int | |
| `eliminated_at` | timestamptz | |
| `eliminated_by` | uuid | FK to `players(id)` |
| `onboarding_complete` | boolean | |
| `rules_accepted_at` | timestamptz | |
| `spoon_collected` | boolean | |
| `is_demo` | boolean | Excluded from chain + leaderboard |
| `created_at` | timestamptz | |

### `assignments`
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `assassin_id` | uuid | FK |
| `target_id` | uuid | FK |
| `status` | text | `'active'` \| `'completed'` \| `'reassigned'` |
| `wrong_guesses` | int | Increments on incorrect kill verification |
| `assigned_at` | timestamptz | |
| `completed_at` | timestamptz | |

### `kills`
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `assassin_id` | uuid | FK |
| `target_id` | uuid | FK |
| `confirmed_at` | timestamptz | |
| `confirmed_by` | text | `'app'` \| `'admin'` \| `'self'` \| `'auto'` |
| `selfie_url` | text | Optional |
| `notes` | text | Optional |

### `game_state` (singleton, `id = 1`)
| Column | Type | Notes |
|--------|------|-------|
| `id` | int | Always `1` |
| `status` | text | `'pending'` \| `'active'` \| `'paused'` \| `'ended'` |
| `started_at` | timestamptz | |
| `current_round` | int | Increments on each `generate_assignments` |
| `players_remaining` | int | |
| `deadline` | timestamptz | |

### `messages`
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `sender` | text | Default `'SYSTEM'` |
| `recipient_id` | uuid | Nullable (broadcast = null) |
| `subject` | text | |
| `body` | text | |
| `channel` | text | `'app'` \| `'sms'` \| `'email'` \| `'all'` |
| `sent_at` | timestamptz | |
| `read_at` | timestamptz | |

---

## License

This is a one-off school project. No license — copy ideas freely, but don't lift the codebase wholesale without asking.
