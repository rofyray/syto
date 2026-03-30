import { createClient } from '@supabase/supabase-js';

// Handle environment variables for both browser (Vite) and Node.js environments
let supabaseUrl: string;
let supabaseAnonKey: string;

// Check if we're in a browser environment (Vite/frontend)
if (typeof window !== 'undefined' && typeof import.meta !== 'undefined') {
  // Frontend (Vite) environment
  supabaseUrl = import.meta.env?.VITE_SUPABASE_URL as string;
  supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY as string;
} else {
  // Node.js (API) environment
  supabaseUrl = process.env.SUPABASE_URL || '';
  supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
}

// Validate that we have the required environment variables
if (!supabaseUrl) {
  console.error('Missing SUPABASE_URL / VITE_SUPABASE_URL environment variable');
}
if (!supabaseAnonKey) {
  console.error('Missing SUPABASE_ANON_KEY / VITE_SUPABASE_ANON_KEY environment variable');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side admin client using service role key (bypasses RLS).
// Only available in Node.js (API) environment — never used in the browser.
let supabaseAdmin = supabase; // fallback to anon if no service role key
if (typeof window === 'undefined') {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (serviceRoleKey && supabaseUrl) {
    supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
  } else {
    console.warn('Missing SUPABASE_SERVICE_ROLE_KEY — server-side writes will use anon key and may fail RLS checks');
  }
}
export { supabaseAdmin };

export type UserProfile = {
  id: string;
  username: string;
  grade_level: number;
  first_name: string;
  last_name: string;
  created_at: string;
  avatar_url?: string;
};

export type Module = {
  id: string;
  title: string;
  description: string;
  subject: 'english' | 'mathematics';
  grade_level: number;
  topics: Topic[];
};

export type Topic = {
  id: string;
  title: string;
  description: string;
  module_id: string;
  content: string;
  exercises: Exercise[];
};

export type Exercise = {
  id: string;
  title: string;
  topic_id: string;
  type: 'multiple-choice' | 'fill-in-blank' | 'matching' | 'problem-solving';
  questions: Question[];
};

export type Question = {
  id: string;
  exercise_id?: string;
  question_text: string;
  options?: string[];
  correct_answer: string;
  explanation?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  order_index?: number;
  // Question bank fields (AI-generated shared pool)
  topic_name?: string;
  subject?: string;
  grade_level?: number;
  generation_hash?: string;
  cultural_context?: string;
  curriculum_alignment?: string;
  generated_by?: string;
};

export type UserProgress = {
  id?: string;
  user_id: string;
  module_id: string;
  topic_id?: string;
  exercise_id?: string;
  score?: number;
  completed: boolean;
  completion_date?: string;
  created_at?: string;
  last_accessed_at?: string;
  time_spent_seconds?: number;
  attempts?: number;
  updated_at?: string;
  started_at?: string;
};

export type UserAnswer = {
  id?: string;
  user_id: string;
  question_id: string;
  user_answer: string;
  correct_answer: string;
  is_correct: boolean;
  exercise_id?: string;
  topic_id?: string;
  module_id?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  question_type?: 'multiple-choice' | 'fill-in-blank' | 'matching' | 'problem-solving';
  time_spent_seconds?: number;
  session_id?: string;
  attempt_number?: number;
  created_at?: string;
};

export type UserLearningAnalytics = {
  id?: string;
  user_id: string;
  subject: 'english' | 'mathematics';
  total_questions_attempted?: number;
  total_questions_correct?: number;
  average_score?: number;
  total_time_spent_seconds?: number;
  learning_streak_days?: number;
  last_activity_date?: string;
  strong_topics?: string[];
  weak_topics?: string[];
  modules_started?: number;
  modules_completed?: number;
  topics_completed?: number;
  exercises_completed?: number;
  created_at?: string;
  updated_at?: string;
};

export type RecentModule = {
  user_id: string;
  module_id: string;
  title: string;
  subject: 'english' | 'mathematics';
  description: string;
  last_accessed_at: string;
  score?: number;
  completed: boolean;
};

// Queries
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
  
  return data as UserProfile;
}

export async function getModulesByGradeAndSubject(
  grade: number,
  subject: 'english' | 'mathematics'
): Promise<Module[]> {
  const { data, error } = await supabase
    .from('modules')
    .select('*')
    .eq('grade_level', grade)
    .eq('subject', subject);

  if (error) {
    console.error('Error fetching modules:', error);
    return [];
  }

  return data as Module[];
}

// In-memory cache for modules with children
const moduleCache = new Map<string, { data: Module[]; timestamp: number }>();
const MODULE_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export async function getModulesWithChildren(
  grade: number,
  subject: 'english' | 'mathematics'
): Promise<Module[]> {
  const cacheKey = `${grade}-${subject}`;
  const cached = moduleCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < MODULE_CACHE_TTL) {
    return cached.data;
  }

  const { data, error } = await supabase
    .from('modules')
    .select('*, topics(*, exercises(*))')
    .eq('grade_level', grade)
    .eq('subject', subject);

  if (error) {
    console.error('Error fetching modules with children:', error);
    return [];
  }

  const result = data as Module[];
  moduleCache.set(cacheKey, { data: result, timestamp: Date.now() });
  return result;
}

export async function getTopicsByModuleId(moduleId: string): Promise<Topic[]> {
  const { data, error } = await supabase
    .from('topics')
    .select('*')
    .eq('module_id', moduleId);
  
  if (error) {
    console.error('Error fetching topics:', error);
    return [];
  }
  
  return data as Topic[];
}

export async function getExercisesByTopicId(topicId: string): Promise<Exercise[]> {
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .eq('topic_id', topicId);
  
  if (error) {
    console.error('Error fetching exercises:', error);
    return [];
  }
  
  return data as Exercise[];
}

export async function getQuestionsByExerciseId(exerciseId: string): Promise<Question[]> {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('exercise_id', exerciseId);
  
  if (error) {
    console.error('Error fetching questions:', error);
    return [];
  }
  
  return data as Question[];
}

export async function getUserProgressByUserId(userId: string): Promise<UserProgress[]> {
  const { data, error } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', userId);
  
  if (error) {
    console.error('Error fetching user progress:', error);
    return [];
  }
  
  return data as UserProgress[];
}

export async function updateUserProgress(progress: Partial<UserProgress>): Promise<boolean> {
  const { error } = await supabase
    .from('user_progress')
    .upsert(progress);
  
  if (error) {
    console.error('Error updating user progress:', error);
    return false;
  }
  
  return true;
}

// Functions to save NAANO-generated content
export async function saveModule(module: Omit<Module, 'topics'>): Promise<string | null> {
  const { data, error } = await supabase
    .from('modules')
    .insert(module)
    .select('id')
    .single();
  
  if (error) {
    console.error('Error saving module:', error);
    return null;
  }
  
  return data.id;
}

export async function saveTopic(topic: Omit<Topic, 'exercises'>): Promise<string | null> {
  const { data, error } = await supabase
    .from('topics')
    .insert(topic)
    .select('id')
    .single();
  
  if (error) {
    console.error('Error saving topic:', error);
    return null;
  }
  
  return data.id;
}

export async function saveExercise(exercise: Omit<Exercise, 'questions'>): Promise<string | null> {
  const { data, error } = await supabase
    .from('exercises')
    .insert(exercise)
    .select('id')
    .single();
  
  if (error) {
    console.error('Error saving exercise:', error);
    return null;
  }
  
  return data.id;
}

export async function saveQuestion(question: Question): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from('questions')
    .insert(question)
    .select('id')
    .single();
  
  if (error) {
    console.error('Error saving question:', error);
    return null;
  }
  
  return data.id;
}

export async function saveQuestions(questions: Question[]): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from('questions')
    .insert(questions);
  
  if (error) {
    console.error('Error saving questions:', error);
    return false;
  }
  
  return true;
}

// Helper function to save complete module with all nested content
export async function saveCompleteModule(moduleData: {
  module: Omit<Module, 'topics'>;
  topics: Array<{
    topic: Omit<Topic, 'exercises' | 'module_id'>;
    exercises: Array<{
      exercise: Omit<Exercise, 'questions' | 'topic_id'>;
      questions: Omit<Question, 'exercise_id'>[];
    }>;
  }>;
}): Promise<boolean> {
  try {
    // Save the module first
    const moduleId = await saveModule(moduleData.module);
    if (!moduleId) return false;
    
    // Save topics and their exercises/questions
    for (const topicData of moduleData.topics) {
      const topicId = await saveTopic({
        ...topicData.topic,
        module_id: moduleId
      });
      if (!topicId) return false;
      
      // Save exercises for this topic
      for (const exerciseData of topicData.exercises) {
        const exerciseId = await saveExercise({
          ...exerciseData.exercise,
          topic_id: topicId
        });
        if (!exerciseId) return false;
        
        // Save questions for this exercise
        const questionsWithExerciseId = exerciseData.questions.map(q => ({
          ...q,
          exercise_id: exerciseId
        }));
        
        const questionsSuccess = await saveQuestions(questionsWithExerciseId);
        if (!questionsSuccess) return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error saving complete module:', error);
    return false;
  }
}

// ============================================================================
// QUESTION BANK FUNCTIONS
// ============================================================================

/**
 * Get AI-generated questions from the shared pool by topic, subject, grade, difficulty
 */
export async function getQuestionPool(
  subject: string,
  gradeLevel: number,
  topicName: string,
  difficulty: string = 'medium'
): Promise<Question[]> {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('subject', subject)
    .eq('grade_level', gradeLevel)
    .eq('topic_name', topicName)
    .eq('difficulty', difficulty)
    .eq('generated_by', 'naano-ai');

  if (error) {
    console.error('Error fetching question pool:', error);
    return [];
  }

  return data as Question[];
}

/**
 * Get question IDs that a student has answered correctly (for exclusion from pool)
 */
export async function getStudentCorrectQuestionIds(
  userId: string,
  questionIds: string[]
): Promise<string[]> {
  if (questionIds.length === 0) return [];

  const { data, error } = await supabase
    .from('user_answers')
    .select('question_id')
    .eq('user_id', userId)
    .eq('is_correct', true)
    .in('question_id', questionIds);

  if (error) {
    console.error('Error fetching student correct question IDs:', error);
    return [];
  }

  // Return unique question IDs
  return [...new Set(data.map(d => d.question_id))];
}

/**
 * Save AI-generated questions to the shared question pool
 */
export async function savePoolQuestions(
  questions: Array<{
    question_text: string;
    options: string[];
    correct_answer: string;
    explanation?: string;
    difficulty: string;
    topic_name: string;
    subject: string;
    grade_level: number;
    cultural_context?: string;
    curriculum_alignment?: string;
    generation_hash: string;
  }>
): Promise<Question[]> {
  const records = questions.map((q, index) => ({
    id: `ai-${crypto.randomUUID()}`,
    question_text: q.question_text,
    options: q.options,
    correct_answer: q.correct_answer,
    explanation: q.explanation || '',
    difficulty: q.difficulty,
    order_index: index,
    generated_by: 'naano-ai',
    topic_name: q.topic_name,
    subject: q.subject,
    grade_level: q.grade_level,
    cultural_context: q.cultural_context,
    curriculum_alignment: q.curriculum_alignment,
    generation_hash: q.generation_hash,
  }));

  const { data, error } = await supabaseAdmin
    .from('questions')
    .insert(records)
    .select();

  if (error) {
    console.error('Error saving pool questions:', error);
    return [];
  }

  return data as Question[];
}

/**
 * Check for existing questions by generation hash (dedup)
 */
export async function getExistingQuestionHashes(hashes: string[]): Promise<string[]> {
  if (hashes.length === 0) return [];

  const { data, error } = await supabase
    .from('questions')
    .select('generation_hash')
    .in('generation_hash', hashes);

  if (error) {
    console.error('Error checking existing question hashes:', error);
    return [];
  }

  return data.map(d => d.generation_hash);
}

// ============================================================================
// USER ANSWERS FUNCTIONS
// ============================================================================

export async function saveUserAnswer(answer: Omit<UserAnswer, 'id' | 'created_at'>): Promise<boolean> {
  const { error } = await supabase
    .from('user_answers')
    .insert(answer);

  if (error) {
    console.error('Error saving user answer:', error);
    return false;
  }

  return true;
}

export async function saveUserAnswers(answers: Omit<UserAnswer, 'id' | 'created_at'>[]): Promise<boolean> {
  const { error } = await supabase
    .from('user_answers')
    .insert(answers);

  if (error) {
    console.error('Error saving user answers:', error);
    return false;
  }

  return true;
}

export async function getUserAnswersByUserId(userId: string): Promise<UserAnswer[]> {
  const { data, error } = await supabase
    .from('user_answers')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user answers:', error);
    return [];
  }

  return data as UserAnswer[];
}

export async function getUserAnswersByExercise(userId: string, exerciseId: string): Promise<UserAnswer[]> {
  const { data, error } = await supabase
    .from('user_answers')
    .select('*')
    .eq('user_id', userId)
    .eq('exercise_id', exerciseId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user answers by exercise:', error);
    return [];
  }

  return data as UserAnswer[];
}

export async function getUserAnswersBySession(sessionId: string): Promise<UserAnswer[]> {
  const { data, error } = await supabase
    .from('user_answers')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching user answers by session:', error);
    return [];
  }

  return data as UserAnswer[];
}

// ============================================================================
// LEARNING ANALYTICS FUNCTIONS
// ============================================================================

export async function getUserLearningAnalytics(
  userId: string,
  subject?: 'english' | 'mathematics'
): Promise<UserLearningAnalytics[]> {
  let query = supabase
    .from('user_learning_analytics')
    .select('*')
    .eq('user_id', userId);

  if (subject) {
    query = query.eq('subject', subject);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching learning analytics:', error);
    return [];
  }

  return data as UserLearningAnalytics[];
}

export async function updateLearningAnalytics(
  analytics: Partial<UserLearningAnalytics> & { user_id: string; subject: 'english' | 'mathematics' }
): Promise<boolean> {
  const { error } = await supabase
    .from('user_learning_analytics')
    .upsert(analytics);

  if (error) {
    console.error('Error updating learning analytics:', error);
    return false;
  }

  return true;
}

// ============================================================================
// RECENT MODULES FUNCTIONS
// ============================================================================

export async function getRecentModules(userId: string, limit: number = 5): Promise<RecentModule[]> {
  const { data, error } = await supabase
    .from('user_recent_modules')
    .select('*')
    .eq('user_id', userId)
    .order('last_accessed_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching recent modules:', error);
    return [];
  }

  return data as RecentModule[];
}

// ============================================================================
// ENHANCED PROGRESS TRACKING FUNCTIONS
// ============================================================================

export async function startExercise(
  userId: string,
  moduleId: string,
  topicId: string,
  exerciseId: string
): Promise<boolean> {
  const progress: Partial<UserProgress> = {
    user_id: userId,
    module_id: moduleId,
    topic_id: topicId,
    exercise_id: exerciseId,
    completed: false,
    started_at: new Date().toISOString(),
    last_accessed_at: new Date().toISOString(),
  };

  return updateUserProgress(progress);
}

export async function completeExercise(
  userId: string,
  moduleId: string,
  topicId: string,
  exerciseId: string,
  score: number,
  timeSpentSeconds: number
): Promise<boolean> {
  // Find existing progress record
  const { data: existingProgress } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('module_id', moduleId)
    .eq('topic_id', topicId)
    .eq('exercise_id', exerciseId)
    .single();

  const progress: Partial<UserProgress> = {
    user_id: userId,
    module_id: moduleId,
    topic_id: topicId,
    exercise_id: exerciseId,
    score,
    completed: true,
    completion_date: new Date().toISOString(),
    last_accessed_at: new Date().toISOString(),
    time_spent_seconds: timeSpentSeconds,
    attempts: existingProgress ? (existingProgress.attempts || 0) + 1 : 1,
  };

  return updateUserProgress(progress);
}

// ============================================================================
// COMPLETION TRACKING FUNCTIONS
// ============================================================================

/**
 * Calculate subject completion percentage based on completed modules
 * A module is considered complete when ALL its topics are completed
 */
export async function getSubjectCompletion(
  userId: string,
  subject: 'english' | 'mathematics',
  gradeLevel: number
): Promise<{ completedModules: number; totalModules: number; percentage: number }> {
  // Run both queries in parallel for speed
  const [modulesResult, progressResult] = await Promise.all([
    supabase
      .from('modules')
      .select('id, topics (id)')
      .eq('subject', subject)
      .eq('grade_level', gradeLevel),
    supabase
      .from('user_progress')
      .select('module_id, topic_id, completed')
      .eq('user_id', userId)
      .eq('completed', true),
  ]);

  const { data: modules, error } = modulesResult;
  const { data: userProgress } = progressResult;

  if (error || !modules || modules.length === 0) {
    return { completedModules: 0, totalModules: modules?.length || 0, percentage: 0 };
  }

  const progressByModule = new Map<string, Set<string>>();
  for (const p of userProgress || []) {
    if (p.topic_id) {
      if (!progressByModule.has(p.module_id)) {
        progressByModule.set(p.module_id, new Set());
      }
      progressByModule.get(p.module_id)!.add(p.topic_id);
    }
  }

  let completedModulesCount = 0;
  for (const mod of modules) {
    const topicCount = (mod.topics as any[])?.length || 0;
    if (topicCount === 0) continue;
    const completedTopics = progressByModule.get(mod.id)?.size || 0;
    if (completedTopics >= topicCount) completedModulesCount++;
  }

  const percentage = Math.round((completedModulesCount / modules.length) * 100);
  return { completedModules: completedModulesCount, totalModules: modules.length, percentage };
}

/**
 * Get module-level completion details for a specific module
 */
export async function getModuleCompletionDetails(
  userId: string,
  moduleId: string
): Promise<{
  topicsCompleted: number;
  totalTopics: number;
  percentage: number;
  isComplete: boolean;
}> {
  // Get all topics for this module
  const allTopics = await getTopicsByModuleId(moduleId);

  if (allTopics.length === 0) {
    return { topicsCompleted: 0, totalTopics: 0, percentage: 0, isComplete: false };
  }

  // Get user's progress for this module
  const { data: userProgress } = await supabase
    .from('user_progress')
    .select('topic_id, completed')
    .eq('user_id', userId)
    .eq('module_id', moduleId);

  if (!userProgress) {
    return { topicsCompleted: 0, totalTopics: allTopics.length, percentage: 0, isComplete: false };
  }

  // Count unique completed topics
  const completedTopicIds = new Set(
    userProgress
      .filter(p => p.topic_id && p.completed)
      .map(p => p.topic_id)
  );

  const topicsCompleted = completedTopicIds.size;
  const percentage = Math.round((topicsCompleted / allTopics.length) * 100);
  const isComplete = topicsCompleted === allTopics.length;

  return {
    topicsCompleted,
    totalTopics: allTopics.length,
    percentage,
    isComplete
  };
}