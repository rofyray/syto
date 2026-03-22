/*
  # Add missing tables referenced in code + Grade 5-6 seed data

  1. user_answers - tracks individual question responses
  2. user_activity - logs user actions
  3. user_recent_modules - view for dashboard recent modules
  4. Grade 5-6 seed data for modules, topics, exercises
*/

-- ============================================================================
-- user_answers table
-- Referenced by: saveUserAnswer, saveUserAnswers, getUserAnswersByUserId,
--   getUserAnswersByExercise, getUserAnswersBySession in src/lib/supabase.ts
-- ============================================================================
CREATE TABLE user_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  question_id TEXT,
  user_answer TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  exercise_id TEXT,
  topic_id TEXT,
  module_id TEXT,
  difficulty TEXT,
  question_type TEXT DEFAULT 'multiple-choice',
  time_spent_seconds INTEGER DEFAULT 0,
  attempt_number INTEGER DEFAULT 1,
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX user_answers_user_id_idx ON user_answers (user_id);
CREATE INDEX user_answers_exercise_id_idx ON user_answers (exercise_id);
CREATE INDEX user_answers_session_id_idx ON user_answers (session_id);
CREATE INDEX user_answers_created_at_idx ON user_answers (created_at DESC);

ALTER TABLE user_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own answers"
  ON user_answers FOR ALL TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- user_activity table
-- Referenced by: logUserActivity in src/api/middleware/auth-middleware.ts
-- ============================================================================
CREATE TABLE user_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX user_activity_user_id_idx ON user_activity (user_id);
CREATE INDEX user_activity_created_at_idx ON user_activity (created_at DESC);

ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own activity"
  ON user_activity FOR ALL TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- user_recent_modules view
-- Referenced by: getRecentModules in src/lib/supabase.ts
-- ============================================================================
CREATE VIEW user_recent_modules AS
SELECT DISTINCT ON (up.user_id, up.module_id)
  up.user_id,
  up.module_id,
  m.title,
  m.subject,
  m.description,
  up.score,
  up.completed,
  COALESCE(up.completion_date, up.created_at) AS last_accessed_at
FROM user_progress up
JOIN modules m ON m.id = up.module_id
ORDER BY up.user_id, up.module_id, COALESCE(up.completion_date, up.created_at) DESC;

-- ============================================================================
-- Add updated_at column to user_progress (used in code but not in schema)
-- ============================================================================
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS last_accessed_at TIMESTAMPTZ;
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS time_spent_seconds INTEGER DEFAULT 0;
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS attempts INTEGER DEFAULT 0;

-- ============================================================================
-- Grade 5 Seed Data
-- ============================================================================
INSERT INTO modules (id, title, description, subject, grade_level) VALUES
  -- English Grade 5
  ('eng-5-1', 'Advanced Reading Comprehension', 'Analyze complex texts with deeper comprehension strategies using Ghanaian literature.', 'english', 5),
  ('eng-5-2', 'Grammar and Sentence Structure', 'Master complex sentence structures, tenses, and parts of speech.', 'english', 5),
  ('eng-5-3', 'Essay Writing', 'Learn to write structured essays including narrative, descriptive, and expository types.', 'english', 5),
  ('eng-5-4', 'Advanced Vocabulary', 'Build academic vocabulary through context clues, prefixes, suffixes, and root words.', 'english', 5),
  -- Mathematics Grade 5
  ('math-5-1', 'Advanced Number Operations', 'Work with larger numbers, long multiplication, and division with remainders.', 'mathematics', 5),
  ('math-5-2', 'Fractions and Decimals', 'Add, subtract, and compare fractions and decimals in real-world contexts.', 'mathematics', 5),
  ('math-5-3', 'Perimeter, Area, and Volume', 'Calculate measurements of 2D and 3D shapes with practical applications.', 'mathematics', 5),
  ('math-5-4', 'Data Analysis', 'Create and interpret bar graphs, line graphs, and pie charts with Ghanaian data.', 'mathematics', 5);

-- Grade 5 Topics
INSERT INTO topics (id, title, description, module_id, content, order_index) VALUES
  ('eng-5-1-t1', 'Identifying Themes', 'Recognize themes and morals in Ghanaian folktales and stories.', 'eng-5-1', 'Content about themes in Ghanaian literature...', 1),
  ('eng-5-1-t2', 'Drawing Conclusions', 'Use evidence from text to draw logical conclusions.', 'eng-5-1', 'Content about drawing conclusions...', 2),
  ('eng-5-2-t1', 'Complex Sentences', 'Build complex sentences using conjunctions and relative clauses.', 'eng-5-2', 'Content about complex sentences...', 1),
  ('eng-5-2-t2', 'Verb Tenses', 'Master past, present, future, and continuous tenses.', 'eng-5-2', 'Content about verb tenses...', 2),
  ('math-5-1-t1', 'Long Multiplication', 'Multiply multi-digit numbers using various strategies.', 'math-5-1', 'Content about long multiplication...', 1),
  ('math-5-1-t2', 'Long Division', 'Divide numbers with remainders and check answers.', 'math-5-1', 'Content about long division...', 2),
  ('math-5-2-t1', 'Adding Fractions', 'Add fractions with like and unlike denominators.', 'math-5-2', 'Content about adding fractions...', 1),
  ('math-5-2-t2', 'Decimal Operations', 'Add, subtract, and compare decimal numbers.', 'math-5-2', 'Content about decimal operations...', 2);

-- Grade 5 Exercises
INSERT INTO exercises (id, title, topic_id, type, order_index) VALUES
  ('eng-5-1-ex1', 'Theme Identification Practice', 'eng-5-1-t1', 'multiple-choice', 1),
  ('eng-5-2-ex1', 'Sentence Building', 'eng-5-2-t1', 'multiple-choice', 1),
  ('math-5-1-ex1', 'Multiplication Problems', 'math-5-1-t1', 'problem-solving', 1),
  ('math-5-2-ex1', 'Fraction Addition', 'math-5-2-t1', 'multiple-choice', 1);

-- ============================================================================
-- Grade 6 Seed Data
-- ============================================================================
INSERT INTO modules (id, title, description, subject, grade_level) VALUES
  -- English Grade 6
  ('eng-6-1', 'Critical Reading and Analysis', 'Evaluate texts critically, identify bias, and compare different perspectives.', 'english', 6),
  ('eng-6-2', 'Advanced Grammar', 'Master advanced grammar including passive voice, reported speech, and conditionals.', 'english', 6),
  ('eng-6-3', 'Research and Report Writing', 'Learn research skills and write structured reports and summaries.', 'english', 6),
  ('eng-6-4', 'Literature Appreciation', 'Study Ghanaian and African literature including poetry, prose, and drama.', 'english', 6),
  -- Mathematics Grade 6
  ('math-6-1', 'Ratios and Percentages', 'Understand ratios, proportions, and percentages in everyday Ghanaian contexts.', 'mathematics', 6),
  ('math-6-2', 'Integers and Order of Operations', 'Work with negative numbers and apply BODMAS/PEMDAS rules.', 'mathematics', 6),
  ('math-6-3', 'Geometry and Transformations', 'Explore symmetry, rotation, reflection, and coordinate geometry.', 'mathematics', 6),
  ('math-6-4', 'Probability and Statistics', 'Calculate probability and use statistical measures with real-world data.', 'mathematics', 6);

-- Grade 6 Topics
INSERT INTO topics (id, title, description, module_id, content, order_index) VALUES
  ('eng-6-1-t1', 'Evaluating Arguments', 'Identify and evaluate arguments and evidence in texts.', 'eng-6-1', 'Content about evaluating arguments...', 1),
  ('eng-6-1-t2', 'Comparing Perspectives', 'Compare different viewpoints on the same topic.', 'eng-6-1', 'Content about comparing perspectives...', 2),
  ('eng-6-2-t1', 'Passive Voice', 'Understand and use passive voice constructions.', 'eng-6-2', 'Content about passive voice...', 1),
  ('eng-6-2-t2', 'Reported Speech', 'Convert direct speech to reported speech and vice versa.', 'eng-6-2', 'Content about reported speech...', 2),
  ('math-6-1-t1', 'Understanding Ratios', 'Express and simplify ratios using Ghanaian market examples.', 'math-6-1', 'Content about ratios...', 1),
  ('math-6-1-t2', 'Percentages', 'Calculate percentages including discounts and interest in cedis.', 'math-6-1', 'Content about percentages...', 2),
  ('math-6-2-t1', 'Negative Numbers', 'Understand and operate with integers on a number line.', 'math-6-2', 'Content about negative numbers...', 1),
  ('math-6-2-t2', 'Order of Operations', 'Apply BODMAS rules to solve multi-step problems.', 'math-6-2', 'Content about order of operations...', 2);

-- Grade 6 Exercises
INSERT INTO exercises (id, title, topic_id, type, order_index) VALUES
  ('eng-6-1-ex1', 'Argument Analysis', 'eng-6-1-t1', 'multiple-choice', 1),
  ('eng-6-2-ex1', 'Passive Voice Practice', 'eng-6-2-t1', 'multiple-choice', 1),
  ('math-6-1-ex1', 'Ratio Problems', 'math-6-1-t1', 'problem-solving', 1),
  ('math-6-2-ex1', 'Integer Operations', 'math-6-2-t1', 'multiple-choice', 1);
