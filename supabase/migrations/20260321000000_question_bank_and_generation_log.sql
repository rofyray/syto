-- ============================================================================
-- QUESTION BANK: Extend shared questions table for AI-generated question pool
-- ============================================================================

-- Make exercise_id nullable so AI-generated questions can exist without an exercise
-- (they're keyed by topic_name + subject + grade instead)
ALTER TABLE questions ALTER COLUMN exercise_id DROP NOT NULL;

-- Add AI generation metadata columns
ALTER TABLE questions ADD COLUMN IF NOT EXISTS generated_by TEXT DEFAULT 'seed';
ALTER TABLE questions ADD COLUMN IF NOT EXISTS cultural_context TEXT;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS curriculum_alignment TEXT;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS topic_name TEXT;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS subject TEXT;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS grade_level INTEGER;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS generation_hash TEXT;

-- Index for question bank lookup: find available questions for a topic
CREATE INDEX IF NOT EXISTS questions_bank_lookup_idx
  ON questions (subject, grade_level, topic_name, difficulty);

-- Index for dedup: prevent saving duplicate questions
CREATE INDEX IF NOT EXISTS questions_generation_hash_idx
  ON questions (generation_hash);

-- Backfill existing seed questions with generated_by = 'seed'
UPDATE questions SET generated_by = 'seed' WHERE generated_by IS NULL;

-- ============================================================================
-- GENERATION LOG: Allow shared (non-student-specific) generation logging
-- ============================================================================

-- Make student_id nullable for shared question generation (not tied to a student)
ALTER TABLE naano_generation_log ALTER COLUMN student_id DROP NOT NULL;

-- Track which question IDs were created in each generation batch
ALTER TABLE naano_generation_log ADD COLUMN IF NOT EXISTS question_ids TEXT[];

-- Update RLS policies to allow inserts with null student_id (server-side only)
-- The existing policy requires auth.uid() = student_id, which won't work for shared generation.
-- Add a service-role insert policy for server-side operations.
CREATE POLICY "Service role can insert generation log"
  ON naano_generation_log FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can select generation log"
  ON naano_generation_log FOR SELECT
  TO service_role
  USING (true);
