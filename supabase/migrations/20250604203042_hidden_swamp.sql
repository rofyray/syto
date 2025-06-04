/*
  # Initial Database Schema for Syto EdTech Platform
  
  1. New Tables
    - profiles: User profile information
    - modules: Learning modules for English and Mathematics
    - topics: Topics within each module
    - exercises: Interactive exercises for each topic
    - questions: Questions for each exercise
    - user_progress: Tracks student progress
    
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  grade_level INTEGER NOT NULL CHECK (grade_level BETWEEN 4 AND 6),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  avatar_url TEXT
);

-- Create modules table
CREATE TABLE IF NOT EXISTS modules (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  subject TEXT NOT NULL CHECK (subject IN ('english', 'mathematics')),
  grade_level INTEGER NOT NULL CHECK (grade_level BETWEEN 4 AND 6),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create topics table
CREATE TABLE IF NOT EXISTS topics (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  module_id TEXT NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create exercises table
CREATE TABLE IF NOT EXISTS exercises (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  topic_id TEXT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('multiple-choice', 'fill-in-blank', 'matching', 'problem-solving')),
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create questions table
CREATE TABLE IF NOT EXISTS questions (
  id TEXT PRIMARY KEY,
  exercise_id TEXT NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  options TEXT[],
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_progress table
CREATE TABLE IF NOT EXISTS user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  module_id TEXT NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  topic_id TEXT REFERENCES topics(id) ON DELETE CASCADE,
  exercise_id TEXT REFERENCES exercises(id) ON DELETE CASCADE,
  score INTEGER CHECK (score >= 0 AND score <= 100),
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  completion_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, module_id, topic_id, exercise_id)
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Anyone can view modules"
  ON modules FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can view topics"
  ON topics FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can view exercises"
  ON exercises FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can view questions"
  ON questions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can view own progress"
  ON user_progress FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
  ON user_progress FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON user_progress FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS profiles_username_idx ON profiles(username);
CREATE INDEX IF NOT EXISTS profiles_grade_level_idx ON profiles(grade_level);
CREATE INDEX IF NOT EXISTS topics_module_id_idx ON topics(module_id);
CREATE INDEX IF NOT EXISTS exercises_topic_id_idx ON exercises(topic_id);
CREATE INDEX IF NOT EXISTS questions_exercise_id_idx ON questions(exercise_id);
CREATE INDEX IF NOT EXISTS user_progress_user_id_idx ON user_progress(user_id);

-- Insert sample data
INSERT INTO modules (id, title, description, subject, grade_level) VALUES
  ('eng-1', 'Reading Comprehension', 'Learn to understand and analyze texts with Ghanaian stories and passages.', 'english', 4),
  ('eng-2', 'Grammar Basics', 'Master the fundamentals of English grammar with interactive exercises.', 'english', 4),
  ('eng-3', 'Writing Skills', 'Develop your writing abilities through creative and structured exercises.', 'english', 4),
  ('eng-4', 'Vocabulary Building', 'Expand your word knowledge with contextually relevant vocabulary.', 'english', 4),
  ('math-1', 'Number Operations', 'Master addition, subtraction, multiplication, and division with a Ghanaian context.', 'mathematics', 4),
  ('math-2', 'Basic Algebra', 'Learn about patterns, sequences, and simple equations.', 'mathematics', 4),
  ('math-3', 'Geometry and Measurement', 'Explore shapes, angles, perimeter, area, and volume.', 'mathematics', 4),
  ('math-4', 'Data Handling', 'Learn to collect, represent, and interpret data using charts and graphs.', 'mathematics', 4);

-- Insert sample topics
INSERT INTO topics (id, title, description, module_id, content, order_index) VALUES
  ('eng-1-topic-1', 'Understanding Main Ideas', 'Learn to identify the main idea of a text.', 'eng-1', 'Content about main ideas...', 1),
  ('eng-1-topic-2', 'Making Inferences', 'Learn to make logical conclusions based on text evidence.', 'eng-1', 'Content about inferences...', 2),
  ('math-1-topic-1', 'Whole Numbers', 'Work with whole numbers up to 100,000.', 'math-1', 'Content about whole numbers...', 1),
  ('math-1-topic-2', 'Decimals', 'Understand and operate with decimal numbers.', 'math-1', 'Content about decimals...', 2);

-- Insert sample exercises
INSERT INTO exercises (id, title, topic_id, type, order_index) VALUES
  ('eng-1-ex-1', 'Main Idea Practice', 'eng-1-topic-1', 'multiple-choice', 1),
  ('eng-1-ex-2', 'Supporting Details', 'eng-1-topic-1', 'multiple-choice', 2),
  ('math-1-ex-1', 'Place Value', 'math-1-topic-1', 'multiple-choice', 1),
  ('math-1-ex-2', 'Addition and Subtraction', 'math-1-topic-1', 'problem-solving', 2);

-- Insert sample questions
INSERT INTO questions (id, exercise_id, question_text, options, correct_answer, explanation, difficulty, order_index) VALUES
  ('q1', 'eng-1-ex-1', 'What is the main idea of the passage about Kwame Nkrumah?', 
   ARRAY['He built many schools', 'He led Ghana to independence and promoted African unity', 'He was born in Nkroful', 'He became president in 1957'], 
   'He led Ghana to independence and promoted African unity',
   'This captures his key role in independence and Pan-African vision.',
   'medium',
   1),
  ('q2', 'math-1-ex-1', 'What is the place value of 7 in 27,835?',
   ARRAY['Ones', 'Tens', 'Hundreds', 'Thousands'],
   'Thousands',
   'In 27,835, the 7 is in the thousands place (7,000).',
   'easy',
   1);