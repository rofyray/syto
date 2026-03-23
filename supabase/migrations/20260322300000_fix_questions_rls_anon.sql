-- Add anon role to questions INSERT policy
-- Backend uses anon key for server-side question pool operations
-- The existing policy (20260321000001) only allows 'authenticated'
CREATE POLICY "Anon can insert questions"
  ON questions FOR INSERT
  TO anon
  WITH CHECK (true);
