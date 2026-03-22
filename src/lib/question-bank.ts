/**
 * Question Bank Service
 * Manages a shared pool of AI-generated questions to avoid redundant LLM calls.
 *
 * Flow:
 * 1. Check if enough unused questions exist in pool for this topic/grade/difficulty
 * 2. Exclude questions the student already answered correctly
 * 3. If enough available → return from pool (no LLM call)
 * 4. If not enough → generate only the missing count via LLM, save to pool, return all
 */

import { createHash } from 'crypto';
import {
  getQuestionPool,
  getStudentCorrectQuestionIds,
  savePoolQuestions,
  getExistingQuestionHashes,
  type Question,
} from './supabase.js';
import { supabase } from './supabase.js';
import { createNAANOAgent } from './naano/index.js';
import { NAANORequestSchema } from './naano/types.js';

export interface QuestionBankParams {
  userId?: string;
  topic: string;
  subject: string;
  grade: number;
  difficulty?: string;
  count?: number;
}

export interface QuestionBankResult {
  questions: Question[];
  fromPool: number;
  newlyGenerated: number;
  metadata?: {
    modelUsed?: string;
    tokensUsed?: number;
    processingTime?: number;
  };
}

/**
 * Generate a dedup hash for a question based on its content
 */
function generateQuestionHash(
  subject: string,
  grade: number,
  topicName: string,
  questionText: string
): string {
  const normalized = `${subject}:${grade}:${topicName}:${questionText}`
    .toLowerCase()
    .trim();
  return createHash('sha256').update(normalized).digest('hex');
}

/**
 * Shuffle an array (Fisher-Yates)
 */
function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Get questions for a student, pulling from the shared pool first.
 * Only generates new questions via LLM if the pool doesn't have enough.
 */
export async function getQuestionsForStudent(
  params: QuestionBankParams
): Promise<QuestionBankResult> {
  const { userId, topic, subject, grade, difficulty = 'medium', count = 5 } = params;

  // 1. Get all questions in the pool for this topic/grade/difficulty
  const pool = await getQuestionPool(subject, grade, topic, difficulty);
  const poolIds = pool.map(q => q.id);

  // 2. Find which questions this student has already answered correctly
  let correctIds: string[] = [];
  if (userId && poolIds.length > 0) {
    correctIds = await getStudentCorrectQuestionIds(userId, poolIds);
  }

  // 3. Filter out correctly-answered questions
  const available = pool.filter(q => !correctIds.includes(q.id));

  // 4. If we have enough, return a random selection
  if (available.length >= count) {
    const selected = shuffle(available).slice(0, count);
    return {
      questions: selected,
      fromPool: count,
      newlyGenerated: 0,
    };
  }

  // 5. Need to generate more questions
  const needed = count - available.length;
  const generated = await generateAndSaveQuestions({
    topic,
    subject,
    grade,
    difficulty,
    count: needed,
  });

  const allQuestions = [...shuffle(available), ...generated];

  return {
    questions: allQuestions.slice(0, count),
    fromPool: available.length,
    newlyGenerated: generated.length,
    metadata: generated.length > 0 ? { modelUsed: 'claude-sonnet-4-6' } : undefined,
  };
}

/**
 * Generate new questions via NAANO LLM and save to the shared pool
 */
async function generateAndSaveQuestions(params: {
  topic: string;
  subject: string;
  grade: number;
  difficulty: string;
  count: number;
}): Promise<Question[]> {
  const { topic, subject, grade, difficulty, count } = params;
  const startTime = Date.now();

  try {
    // Build the generation request
    const request = NAANORequestSchema.parse({
      type: 'generate_questions',
      subject,
      grade,
      content: `Generate ${count} ${difficulty} multiple-choice questions about ${topic} for grade ${grade} ${subject}.

IMPORTANT:
1. First use the search_curriculum tool to get relevant curriculum content
2. Then generate questions based on the curriculum
3. Each question MUST include Ghanaian cultural context (names, locations, foods, currency)
4. Return ONLY valid JSON in this exact format:

{
  "questions": [
    {
      "id": "q1",
      "questionText": "...",
      "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
      "correctAnswer": "A. ...",
      "explanation": "...",
      "difficulty": "${difficulty}",
      "culturalContext": "Description of Ghanaian elements used"
    }
  ]
}`,
      context: { topic, difficulty },
    });

    // Create a fresh NAANO agent for generation
    const naano = createNAANOAgent();
    const response = await naano.processRequest(request);

    // Parse generated questions from response
    let rawQuestions: any[];
    try {
      const jsonMatch = response.content.toString().match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        rawQuestions = parsed.questions || parsed;
      } else {
        rawQuestions = JSON.parse(response.content.toString());
      }
      if (!Array.isArray(rawQuestions)) {
        rawQuestions = [rawQuestions];
      }
    } catch {
      console.error('Failed to parse generated questions');
      return [];
    }

    // Generate hashes and check for duplicates
    const questionsWithHashes = rawQuestions.map(q => ({
      question_text: q.questionText || q.question_text,
      options: q.options,
      correct_answer: q.correctAnswer || q.correct_answer,
      explanation: q.explanation || '',
      difficulty,
      topic_name: topic,
      subject,
      grade_level: grade,
      cultural_context: q.culturalContext || q.cultural_context,
      curriculum_alignment: q.curriculumAlignment || q.curriculum_alignment,
      generation_hash: generateQuestionHash(subject, grade, topic, q.questionText || q.question_text),
    }));

    // Dedup: filter out questions that already exist in the pool
    const hashes = questionsWithHashes.map(q => q.generation_hash);
    const existingHashes = await getExistingQuestionHashes(hashes);
    const newQuestions = questionsWithHashes.filter(
      q => !existingHashes.includes(q.generation_hash)
    );

    if (newQuestions.length === 0) {
      return [];
    }

    // Save to pool
    const saved = await savePoolQuestions(newQuestions);

    // Log the generation (non-blocking)
    const processingTime = Date.now() - startTime;
    logGeneration({
      topic,
      subject,
      grade,
      difficulty,
      count,
      questionIds: saved.map(q => q.id),
      tokensUsed: response.metadata?.tokensUsed,
      processingTime,
      success: true,
    }).catch(err => console.error('Failed to log generation:', err));

    return saved;
  } catch (error) {
    console.error('Error generating questions:', error);

    // Log failed generation (non-blocking)
    logGeneration({
      topic,
      subject,
      grade,
      difficulty,
      count,
      questionIds: [],
      processingTime: Date.now() - startTime,
      success: false,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    }).catch(err => console.error('Failed to log generation error:', err));

    throw error;
  }
}

/**
 * Log a question generation event to naano_generation_log
 */
async function logGeneration(params: {
  topic: string;
  subject: string;
  grade: number;
  difficulty: string;
  count: number;
  questionIds: string[];
  tokensUsed?: number;
  processingTime: number;
  success: boolean;
  errorMessage?: string;
}): Promise<void> {
  const { error } = await supabase
    .from('naano_generation_log')
    .insert({
      student_id: null,
      generation_type: 'question',
      request_data: {
        topic: params.topic,
        subject: params.subject,
        grade: params.grade,
        difficulty: params.difficulty,
        count: params.count,
      },
      generation_prompt: `Generate ${params.count} ${params.difficulty} questions for ${params.subject} grade ${params.grade}: ${params.topic}`,
      generation_success: params.success,
      error_message: params.errorMessage,
      generation_time_ms: params.processingTime,
      tokens_used: params.tokensUsed,
      question_ids: params.questionIds,
    });

  if (error) {
    console.error('Error logging generation:', error);
  }
}
