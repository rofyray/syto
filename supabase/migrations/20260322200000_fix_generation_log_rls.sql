/*
  Fix RLS policy on naano_generation_log to allow server-side generation logging.

  The question bank logs generations with student_id = NULL (shared pool, not student-specific).
  The existing policies only allow service_role inserts for null student_id,
  but the app uses the anon key. This adds a policy for anon/authenticated inserts
  where student_id is null.
*/

CREATE POLICY "Allow anonymous generation logging"
  ON naano_generation_log FOR INSERT
  TO anon, authenticated
  WITH CHECK (student_id IS NULL);
