/**
 * Type definitions for Chale AI integration
 */

// ============================================================================
// REQUEST TYPES
// ============================================================================

export interface ChaleContentRequest {
  type: 'module' | 'topic' | 'exercise' | 'question';
  subject: 'english' | 'mathematics';
  grade: 4 | 5 | 6;
  title: string;
  topic?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  context?: string;
  culturalContext?: string;
  curriculumTopic?: string;
  orderIndex?: number;
}

export interface ChaleModuleRequest extends Omit<ChaleContentRequest, 'type'> {
  culturalContext?: string;
  curriculumTopic?: string;
}

export interface ChaleTopicRequest extends Omit<ChaleContentRequest, 'type'> {
  moduleContext: string;
  moduleId: string;
  culturalContext?: string;
  curriculumTopic?: string;
  orderIndex?: number;
}

export interface ChaleExerciseRequest extends Omit<ChaleContentRequest, 'type'> {
  topicContext: string;
  topicId: string;
  culturalContext?: string;
  curriculumTopic?: string;
  orderIndex?: number;
}

export interface ChaleQuestionRequest extends Omit<ChaleContentRequest, 'type'> {
  topic: string;
  exerciseContext: string;
  exerciseId: string;
  culturalContext?: string;
  curriculumTopic?: string;
  orderIndex?: number;
}

export interface ChaleLearningPathRequest extends Omit<ChaleContentRequest, 'type'> {
  topicsCount?: number;
  exercisesPerTopic?: number;
  questionsPerExercise?: number;
  culturalContext?: string;
  curriculumTopic?: string;
}

export interface ChaleBatchRequest {
  requests: ChaleContentRequest[];
}

export interface ChaleCulturalContentRequest extends ChaleContentRequest {
  topic: string;
  culturalContext: string;
  contentType?: 'module' | 'topic' | 'exercise' | 'question';
}

export interface ChaleAssessmentRequest extends ChaleContentRequest {
  topic: string;
  questionCount?: number;
}

// ============================================================================
// RESPONSE TYPES
// ============================================================================

export interface ChaleContentResponse {
  id: string;
  type: 'module' | 'topic' | 'exercise' | 'question';
  title: string;
  description: string;
  grade: 4 | 5 | 6;
  subject: 'english' | 'mathematics';
  content: Record<string, any>;
  metadata: {
    difficulty: 'easy' | 'medium' | 'hard';
    culturalContext: string;
    learningObjectives: string[];
    estimatedDuration: string;
    prerequisites: string[];
    ghanaianContext: boolean;
  };
  // Additional properties for different content types
  difficulty?: 'easy' | 'medium' | 'hard';
  culturalContext?: string;
  topics?: any[];
  exercises?: any[];
  questions?: any[];
  instructions?: string;
  question?: string;
  options?: any;
  answer?: string;
  explanation?: string;
  hints?: string[];
}

export interface ChaleModuleResponse {
  id: string;
  title: string;
  description: string;
  subject: string;
  grade: number;
  difficulty: string;
  culturalContext?: string;
  topics?: any[];
  metadata?: any;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface ChaleTopicResponse {
  id: string;
  title: string;
  description: string;
  content: string;
  exercises?: any[];
  metadata?: any;
  module_id: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface ChaleExerciseResponse {
  id: string;
  title: string;
  description?: string;
  type: 'multiple-choice' | 'fill-in-blank' | 'matching' | 'problem-solving' | 'creative-writing' | 'reading-comprehension';
  instructions?: string;
  topic_id: string;
  order_index: number;
  questions?: any[];
  created_at: string;
  updated_at: string;
}

export interface ChaleQuestionResponse {
  id: string;
  question_text: string;
  question_type: 'multiple-choice' | 'true-false' | 'fill-in-blank' | 'short-answer' | 'essay' | 'matching';
  options?: any;
  correct_answer: string;
  explanation?: string;
  hints?: string[];
  exercise_id: string;
  order_index: number;
  points: number;
  created_at: string;
  updated_at: string;
}

export interface ChaleLearningPathResponse {
  module: ChaleModuleResponse;
  topics: (ChaleTopicResponse & { exercises: (ChaleExerciseResponse & { questions: ChaleQuestionResponse[] })[] })[];
}

// ============================================================================
// DATABASE TYPES
// ============================================================================

export interface DatabaseSaveResult {
  id: string;
  created_at: string;
  updated_at?: string;
}

export interface BatchGenerationResult {
  successful: any[];
  failed: any[];
  stats: {
    total: number;
    successful: number;
    failed: number;
  };
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ChaleApiResponse<T = any> {
  success: boolean;
  data?: T;
  database?: DatabaseSaveResult;
  stats?: any;
  metadata?: {
    student_id?: string;
    generation_time_ms?: number;
    saved_to_database?: boolean;
    [key: string]: any;
  };
  message?: string;
  error?: string;
}

export interface ChaleHealthResponse {
  status: 'healthy' | 'unhealthy';
  service: string;
  timestamp: string;
  version: string;
  capabilities: string[];
}

// ============================================================================
// PROGRESS TRACKING TYPES
// ============================================================================

export interface StudentAnswerRequest {
  questionId: string;
  answer: string;
  timeSpent: number;
  hintsUsed?: number;
}

export interface StudentAnswerResponse {
  is_correct: boolean;
  correct_answer: string;
  explanation?: string;
  progress: any;
}

export interface LearningAnalyticsResponse {
  analytics: any[];
  learning_streak: number;
}

// Utility functions to transform ChaleContentResponse to specific response types
export function transformToModuleResponse(
  content: ChaleContentResponse,
  request: ChaleModuleRequest
): ChaleModuleResponse {
  return {
    id: content.id || `chale_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    title: content.title || request.title,
    description: content.description || '',
    subject: request.subject,
    grade: request.grade,
    difficulty: request.difficulty || 'medium',
    culturalContext: request.culturalContext,
    topics: content.topics || [],
    metadata: content.metadata,
    image_url: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

export function transformToTopicResponse(
  content: ChaleContentResponse,
  request: ChaleTopicRequest
): ChaleTopicResponse {
  return {
    id: content.id || `chale_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    title: content.title || request.title,
    description: content.description || '',
    content: typeof content.content === 'string' ? content.content : JSON.stringify(content.content || {}),
    exercises: content.exercises || [],
    metadata: content.metadata,
    module_id: request.moduleId,
    order_index: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

export function transformToExerciseResponse(
  content: ChaleContentResponse,
  request: ChaleExerciseRequest
): ChaleExerciseResponse {
  return {
    id: content.id || `chale_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    title: content.title || request.title,
    description: content.description,
    type: (content.type as any) || 'multiple-choice',
    instructions: content.instructions || 'Complete the following exercise.',
    topic_id: request.topicId,
    order_index: 1,
    questions: content.questions || [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

export function transformToQuestionResponse(
  content: ChaleContentResponse,
  request: ChaleQuestionRequest
): ChaleQuestionResponse {
  return {
    id: content.id || `chale_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    question_text: content.question || content.title || 'Sample question',
    question_type: (content.type as any) || 'multiple-choice',
    options: content.options,
    correct_answer: content.answer || 'A',
    explanation: content.explanation,
    hints: content.hints || [],
    exercise_id: request.exerciseId,
    order_index: 1,
    points: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

export function transformToLearningPathResponse(content: ChaleContentResponse, request: ChaleLearningPathRequest): ChaleLearningPathResponse {
  return {
    module: {
      id: content.id || `chale_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: content.title || `Learning Path for ${request.subject} Grade ${request.grade}`,
      description: content.description || '',
      subject: request.subject,
      grade: request.grade,
      difficulty: request.difficulty || 'medium',
      culturalContext: request.culturalContext,
      topics: content.topics || [],
      metadata: content.metadata,
      image_url: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    topics: []
  };
}
