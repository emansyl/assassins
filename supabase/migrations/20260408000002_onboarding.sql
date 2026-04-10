-- Onboarding flow: rules acceptance + spoon collection tracking.

ALTER TABLE players ADD COLUMN onboarding_complete boolean NOT NULL DEFAULT false;
ALTER TABLE players ADD COLUMN rules_accepted_at timestamptz;
ALTER TABLE players ADD COLUMN spoon_collected boolean NOT NULL DEFAULT false;
