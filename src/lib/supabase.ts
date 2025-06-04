import { createClient } from '@supabase/supabase-js';

// These will be replaced with environment variables in production
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-supabase-url.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UserProfile = {
  id: string;
  username: string;
  grade_level: number;
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
  exercise_id: string;
  question_text: string;
  options?: string[];
  correct_answer: string;
  explanation?: string;
  difficulty: 'easy' | 'medium' | 'hard';
};

export type UserProgress = {
  user_id: string;
  module_id: string;
  topic_id?: string;
  exercise_id?: string;
  score?: number;
  completed: boolean;
  completion_date?: string;
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