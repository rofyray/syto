import { z } from 'zod';
import Anthropic from '@anthropic-ai/sdk';

// ============================================================================
// REQUEST SCHEMAS & TYPES
// ============================================================================

export const NAANORequestSchema = z.object({
  type: z.enum(['chat', 'generate_questions', 'explain_concept', 'validate_answer']),
  subject: z.enum(['english', 'mathematics']),
  grade: z.number().min(4).max(6),
  content: z.string(),
  context: z.object({
    topic: z.string().optional(),
    difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
    studentId: z.string().optional(),
  }).optional(),
});

export type NAANORequest = z.infer<typeof NAANORequestSchema>;

// ============================================================================
// TOOL SCHEMAS
// ============================================================================

export const CurriculumSearchToolSchema = z.object({
  subject: z.enum(['mathematics', 'english']),
  grade: z.number().min(4).max(6),
  query: z.string(),
  limit: z.number().default(5),
});

export type CurriculumSearchInput = z.infer<typeof CurriculumSearchToolSchema>;

export const QuestionGeneratorToolSchema = z.object({
  topic: z.string(),
  subject: z.enum(['english', 'mathematics']),
  grade: z.number().min(4).max(6),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  count: z.number().min(1).max(10).default(5),
  culturalContext: z.string().optional(),
});

export type QuestionGeneratorInput = z.infer<typeof QuestionGeneratorToolSchema>;

export const ProgressTrackerToolSchema = z.object({
  studentId: z.string(),
  moduleId: z.string(),
  score: z.number().min(0).max(100),
  completed: z.boolean(),
});

export type ProgressTrackerInput = z.infer<typeof ProgressTrackerToolSchema>;

// ============================================================================
// RESPONSE TYPES
// ============================================================================

export interface Question {
  id: string;
  questionText: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  culturalContext?: string;
}

export interface NAANOResponse {
  id: string;
  type: 'chat' | 'questions' | 'explanation' | 'validation';
  content: string | Question[];
  metadata: {
    modelUsed: string;
    tokensUsed?: number;
    processingTime: number;
    toolsUsed: string[];
  };
}

// ============================================================================
// TOOL RESULT TYPES
// ============================================================================

export interface CurriculumSearchResult {
  success: boolean;
  subject: string;
  grade: number;
  query: string;
  content: string;
  source: string;
}

export interface ProgressTrackingResult {
  success: boolean;
  message?: string;
  error?: string;
}

// ============================================================================
// ANTHROPIC TYPES (for convenience)
// ============================================================================

export type AnthropicMessage = Anthropic.Message;
export type AnthropicMessageParam = Anthropic.MessageParam;
export type AnthropicTool = Anthropic.Tool;
export type AnthropicToolUseBlock = Anthropic.ToolUseBlock;
export type AnthropicTextBlock = Anthropic.TextBlock;
