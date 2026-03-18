-- ============================================================
-- Migration: Add survey_version column for multi-round support
-- Run this in your Supabase SQL Editor BEFORE deploying the code
-- ============================================================

-- 1. Add survey_version column (default 1 so existing rows get version 1)
ALTER TABLE survey_responses ADD COLUMN survey_version INT NOT NULL DEFAULT 1;
ALTER TABLE survey_partials ADD COLUMN survey_version INT NOT NULL DEFAULT 1;

-- 2. Drop the old unique constraint on email (one response per email, period)
ALTER TABLE survey_responses DROP CONSTRAINT IF EXISTS survey_responses_email_key;

-- 3. Add new composite unique constraint (one response per email per version)
ALTER TABLE survey_responses ADD CONSTRAINT survey_responses_email_version_key UNIQUE (email, survey_version);

-- 4. Update the index for fast lookups
DROP INDEX IF EXISTS idx_survey_responses_email;
CREATE INDEX idx_survey_responses_email_version ON survey_responses (email, survey_version);

-- 5. Drop and recreate views to include survey_version
DROP VIEW IF EXISTS survey_results;
DROP VIEW IF EXISTS survey_item_counts;
DROP VIEW IF EXISTS survey_by_team_size;

CREATE VIEW survey_results AS
SELECT
  survey_version,
  first_name,
  last_name,
  email,
  team_size,
  submitted_at,
  r.value->>'label' AS item,
  (r.value->>'rank')::int AS rank
FROM survey_responses,
LATERAL jsonb_array_elements(rankings) AS r(value)
ORDER BY survey_version, email, rank;

CREATE VIEW survey_item_counts AS
SELECT
  survey_version,
  r.value->>'label' AS item,
  COUNT(*) AS times_selected,
  ROUND(AVG((r.value->>'rank')::numeric), 2) AS avg_rank
FROM survey_responses,
LATERAL jsonb_array_elements(rankings) AS r(value)
GROUP BY survey_version, r.value->>'label'
ORDER BY survey_version, times_selected DESC, avg_rank ASC;

CREATE VIEW survey_by_team_size AS
SELECT
  survey_version,
  team_size,
  r.value->>'label' AS item,
  COUNT(*) AS times_selected,
  ROUND(AVG((r.value->>'rank')::numeric), 2) AS avg_rank
FROM survey_responses,
LATERAL jsonb_array_elements(rankings) AS r(value)
GROUP BY survey_version, team_size, r.value->>'label'
ORDER BY survey_version, team_size, times_selected DESC, avg_rank ASC;
