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
import { getCurriculumContext } from './curriculum-search.js';

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
 * Curriculum context is pre-fetched in parallel with pool lookup to avoid
 * an extra LLM round-trip if generation is needed.
 */
export async function getQuestionsForStudent(
  params: QuestionBankParams
): Promise<QuestionBankResult> {
  const { userId, topic, subject, grade, difficulty = 'medium', count = 5 } = params;

  // 1. Run pool lookup and curriculum pre-fetch in parallel
  //    If pool has enough questions, curriculum context is unused (cheap: Redis-cached)
  //    If not, we already have it ready — saves 1 full LLM round-trip
  const [poolResult, curriculumContext] = await Promise.all([
    getQuestionPool(subject, grade, topic, difficulty).catch(err => {
      console.warn('Question pool lookup failed, proceeding to generate:', err);
      return [] as Question[];
    }),
    getCurriculumContext(
      subject as 'mathematics' | 'english',
      grade,
      topic
    ).catch(() => ''),
  ]);

  // 2. Check which questions the student hasn't correctly answered
  let correctIds: string[] = [];
  if (userId && poolResult.length > 0) {
    try {
      correctIds = await getStudentCorrectQuestionIds(userId, poolResult.map(q => q.id));
    } catch (err) {
      console.warn('Student answer lookup failed:', err);
    }
  }

  const available = poolResult.filter(q => !correctIds.includes(q.id));

  // 3. If we have enough, return a random selection (fast path: ~200ms)
  if (available.length >= count) {
    return {
      questions: shuffle(available).slice(0, count),
      fromPool: count,
      newlyGenerated: 0,
    };
  }

  // 4. Generate missing questions with pre-fetched curriculum context (1 LLM call)
  const needed = count - available.length;
  const generated = await generateAndSaveQuestions({
    topic,
    subject,
    grade,
    difficulty,
    count: needed,
    curriculumContext,
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
 * Generate new questions via NAANO LLM and save to the shared pool.
 * Uses pre-fetched curriculum context to avoid an extra LLM round-trip.
 */
async function generateAndSaveQuestions(params: {
  topic: string;
  subject: string;
  grade: number;
  difficulty: string;
  count: number;
  curriculumContext?: string;
}): Promise<Question[]> {
  const { topic, subject, grade, difficulty, count, curriculumContext } = params;
  const startTime = Date.now();

  try {
    // Build prompt with pre-fetched curriculum context (no tool use needed)
    const prompt = `${curriculumContext ? `## Ghana Curriculum Reference\n${curriculumContext}\n\n` : ''}Generate ${count} ${difficulty} multiple-choice questions about "${topic}" for grade ${grade} ${subject}.

Each question MUST include Ghanaian cultural context (names, locations, foods, currency).
Return ONLY valid JSON in this exact format:

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
}`;

    // Single LLM call with no tools — curriculum context is already in the prompt
    const naano = createNAANOAgent();
    const response = await naano.generateDirect(prompt, 'generate_questions');

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

    // If save failed (RLS, network, etc.), fall back to in-memory questions
    const questionsToReturn = saved.length > 0 ? saved : newQuestions.map((q, i) => ({
      id: `temp-${crypto.randomUUID()}`,
      question_text: q.question_text,
      options: q.options,
      correct_answer: q.correct_answer,
      explanation: q.explanation || '',
      difficulty: q.difficulty,
      topic_name: q.topic_name,
      subject: q.subject,
      grade_level: q.grade_level,
      order_index: i,
      created_at: new Date().toISOString(),
    } as Question));

    // Log the generation (non-blocking)
    const processingTime = Date.now() - startTime;
    logGeneration({
      topic,
      subject,
      grade,
      difficulty,
      count,
      questionIds: questionsToReturn.map(q => q.id),
      tokensUsed: response.metadata?.tokensUsed,
      processingTime,
      success: true,
    }).catch(err => console.error('Failed to log generation:', err));

    return questionsToReturn;
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
