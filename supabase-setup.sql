-- ============================================================
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- Create the survey responses table
CREATE TABLE survey_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  team_size TEXT NOT NULL,
  survey_version INT NOT NULL DEFAULT 1,
  rankings JSONB NOT NULL,
  remaining_rankings JSONB DEFAULT '[]'::jsonb,
  submitted_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (email, survey_version)
);

-- Index on email + version for fast duplicate lookups
CREATE INDEX idx_survey_responses_email_version ON survey_responses (email, survey_version);

-- Enable Row Level Security
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;

-- Policy: only the service role can insert (API route uses service key)
CREATE POLICY "Service role can insert"
  ON survey_responses
  FOR INSERT
  WITH CHECK (true);

-- Policy: only the service role can select (for duplicate checking)
CREATE POLICY "Service role can select"
  ON survey_responses
  FOR SELECT
  USING (true);

-- ============================================================
-- Optional: View to see results nicely
-- ============================================================
CREATE OR REPLACE VIEW survey_results AS
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

-- ============================================================
-- Optional: Quick summary of most-selected items
-- ============================================================
CREATE OR REPLACE VIEW survey_item_counts AS
SELECT
  survey_version,
  r.value->>'label' AS item,
  COUNT(*) AS times_selected,
  ROUND(AVG((r.value->>'rank')::numeric), 2) AS avg_rank
FROM survey_responses,
LATERAL jsonb_array_elements(rankings) AS r(value)
GROUP BY survey_version, r.value->>'label'
ORDER BY survey_version, times_selected DESC, avg_rank ASC;

-- ============================================================
-- Optional: Breakdown by team size
-- ============================================================
CREATE OR REPLACE VIEW survey_by_team_size AS
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

-- ============================================================
-- Partial responses (progressive save)
-- ============================================================
CREATE TABLE survey_partials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL UNIQUE,
  step TEXT NOT NULL,
  selections JSONB,
  rankings JSONB,
  remaining_rankings JSONB,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  team_size TEXT,
  survey_version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE survey_partials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role can all" ON survey_partials FOR ALL USING (true) WITH CHECK (true);
