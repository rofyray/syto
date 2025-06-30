import { createClient } from '@supabase/supabase-js';



const supabaseUrl = process.env.SUPABASE_URL || 'https://your-supabase-url.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key';

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
  id?: string;
  user_id: string;
  module_id: string;
  topic_id?: string;
  exercise_id?: string;
  score?: number;
  completed: boolean;
  completion_date?: string;
  created_at?: string;
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

// Functions to save Chale-generated content
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
  const { data, error } = await supabase
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
  const { error } = await supabase
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