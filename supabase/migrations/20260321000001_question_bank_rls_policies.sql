-- ============================================================================
-- FIX: Add missing RLS policies for question bank operations
-- ============================================================================

-- Allow authenticated users to INSERT AI-generated questions into the shared pool
CREATE POLICY "Authenticated users can insert questions"
  ON questions FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to insert generation logs with null student_id
-- (shared question generation is not tied to a specific student)
CREATE POLICY "Authenticated users can insert generation log"
  ON naano_generation_log FOR INSERT
  TO authenticated
  WITH CHECK (true);
