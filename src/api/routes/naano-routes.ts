import express, { Request, Response } from 'express';
import { getNAANOAgent, createNAANOAgent } from '../../lib/naano/index.js';
import { NAANORequestSchema } from '../../lib/naano/types.js';
import { getQuestionsForStudent } from '../../lib/question-bank.js';
import { translateSingleText } from './khaya-routes.js';
import { getCachedTranslation, setCachedTranslation } from '../../lib/redis.js';
import { getModulesWithChildren } from '../../lib/supabase.js';
import { z } from 'zod';

const router = express.Router();

/**
 * Get a user-friendly error message based on the error type.
 * Never exposes raw backend errors to users.
 */
function getUserFriendlyErrorMessage(error: any): string {
  const message = error?.message?.toLowerCase() || '';
  const status = error?.status;

  // Credit balance / authentication issues
  if (message.includes('credit balance') || message.includes('billing') || status === 401 || message.includes('api key')) {
    return "NAANO is taking a short break right now. Please try again later!";
  }

  // Rate limiting
  if (status === 429 || message.includes('rate limit') || message.includes('too many requests')) {
    return "NAANO is a bit busy right now. Please wait a moment and try again!";
  }

  // Overloaded
  if (status === 529 || message.includes('overloaded')) {
    return "NAANO is helping lots of students right now. Please try again in a few minutes!";
  }

  // Network / timeout
  if (message.includes('timeout') || message.includes('network') || message.includes('econnrefused') || message.includes('fetch failed')) {
    return "NAANO is having trouble connecting. Please check your internet and try again!";
  }

  // Default fallback
  return "Oops! NAANO ran into a small problem. Please try again in a moment!";
}

/**
 * Race a promise against a timeout. Ensures we can respond before
 * Netlify kills the function (26s max).
 */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('timeout')), ms)
  );
  return Promise.race([promise, timeout]);
}

/**
 * Strip markdown formatting from text so it renders cleanly as plain text.
 */
function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')    // **bold** -> bold
    .replace(/\*(.+?)\*/g, '$1')        // *italic* -> italic
    .replace(/__(.+?)__/g, '$1')        // __bold__ -> bold
    .replace(/_(.+?)_/g, '$1')          // _italic_ -> italic
    .replace(/^#{1,6}\s+/gm, '')        // # headers -> plain text
    .replace(/`([^`]+)`/g, '$1');       // `code` -> code
}

/**
 * POST /api/naano/chat
 * Chat with NAANO AI
 */
router.post('/chat', async (req: Request, res: Response) => {
  let request;
  try {
    request = NAANORequestSchema.parse({
      type: 'chat',
      subject: req.body.subject || 'mathematics',
      grade: req.body.grade || 5,
      content: req.body.content || req.body.message,
      context: req.body.context,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    res.status(500).json({ error: true, message: 'Internal server error' });
    return;
  }

  try {
    const grade = request.grade;
    const studentName = req.body.studentName || 'Student';

    // Fetch curriculum modules for both subjects (cached 10min)
    const [mathModules, englishModules] = await Promise.all([
      getModulesWithChildren(grade, 'mathematics'),
      getModulesWithChildren(grade, 'english'),
    ]);

    const naano = createNAANOAgent();
    naano.setStudentContext({ studentName, grade, mathModules, englishModules });
    const response = await withTimeout(naano.processRequest(request), 24_000);

    res.json({
      response: stripMarkdown(response.content as string),
      metadata: response.metadata,
    });
  } catch (error: any) {
    console.error(JSON.stringify({
      level: 'error',
      endpoint: '/chat',
      errorMessage: error?.message,
      errorStatus: error?.status,
      timestamp: new Date().toISOString(),
    }));
    const friendlyMessage = getUserFriendlyErrorMessage(error);
    res.status(500).json({ error: true, message: friendlyMessage });
  }
});

/**
 * POST /api/naano/generate-questions
 * Generate curriculum-aligned questions.
 * Pulls from existing pool first; only calls LLM if not enough questions exist.
 */
router.post('/generate-questions', async (req: Request, res: Response) => {
  const { topic, subject, grade, difficulty, count, userId } = req.body;

  if (!topic || !subject || !grade) {
    res.status(400).json({
      error: true,
      message: 'Missing required fields: topic, subject, grade',
    });
    return;
  }

  try {
    const result = await withTimeout(
      getQuestionsForStudent({
        userId: userId || (req as any).userId,
        topic,
        subject,
        grade: parseInt(grade),
        difficulty: difficulty || 'medium',
        count: count || 5,
      }),
      24_000,
    );

    res.json({
      questions: result.questions,
      fromPool: result.fromPool,
      newlyGenerated: result.newlyGenerated,
      metadata: result.metadata,
    });
  } catch (error: any) {
    console.error(JSON.stringify({
      level: 'error',
      endpoint: '/generate-questions',
      errorMessage: error?.message,
      errorStatus: error?.status,
      topic,
      subject,
      grade,
      timestamp: new Date().toISOString(),
    }));
    const friendlyMessage = getUserFriendlyErrorMessage(error);
    res.status(500).json({ error: true, message: friendlyMessage });
  }
});

/**
 * POST /api/naano/explain
 * Get explanation for a concept
 */
router.post('/explain', async (req: Request, res: Response) => {
  try {
    const { concept, subject, grade } = req.body;

    if (!concept || !subject || !grade) {
      res.status(400).json({
        error: 'Missing required fields: concept, subject, grade',
      });
      return;
    }

    const request = NAANORequestSchema.parse({
      type: 'explain_concept',
      subject,
      grade: parseInt(grade),
      content: `Explain the concept of "${concept}" in a way that a grade ${grade} student can understand. Use Ghanaian examples and context to make it relatable.`,
    });

    const naano = getNAANOAgent();
    const response = await naano.processRequest(request);

    res.json({
      success: true,
      explanation: response.content,
      metadata: response.metadata,
    });
  } catch (error: any) {
    console.error(JSON.stringify({
      level: 'error',
      endpoint: '/explain',
      errorMessage: error?.message,
      timestamp: new Date().toISOString(),
    }));

    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: true,
        message: 'Validation error',
        details: error.errors,
      });
      return;
    }

    const friendlyMessage = getUserFriendlyErrorMessage(error);
    res.status(500).json({ error: true, message: friendlyMessage });
  }
});

/**
 * POST /api/naano/validate-answer
 * Validate student answer with explanation
 */
router.post('/validate-answer', async (req: Request, res: Response) => {
  try {
    const { question, studentAnswer, correctAnswer, subject, grade } = req.body;

    if (!question || !studentAnswer || !correctAnswer || !subject || !grade) {
      res.status(400).json({
        error: 'Missing required fields: question, studentAnswer, correctAnswer, subject, grade',
      });
      return;
    }

    const request = NAANORequestSchema.parse({
      type: 'validate_answer',
      subject,
      grade: parseInt(grade),
      content: `Question: ${question}

Student's Answer: ${studentAnswer}
Correct Answer: ${correctAnswer}

Please provide encouraging feedback on the student's answer. If incorrect, explain why and help them understand the correct answer in a supportive way.`,
    });

    const naano = getNAANOAgent();
    const response = await naano.processRequest(request);

    res.json({
      success: true,
      validation: response.content,
      metadata: response.metadata,
    });
  } catch (error: any) {
    console.error(JSON.stringify({
      level: 'error',
      endpoint: '/validate-answer',
      errorMessage: error?.message,
      timestamp: new Date().toISOString(),
    }));

    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: true,
        message: 'Validation error',
        details: error.errors,
      });
      return;
    }

    const friendlyMessage = getUserFriendlyErrorMessage(error);
    res.status(500).json({ error: true, message: friendlyMessage });
  }
});

/**
 * POST /api/naano/explain-answer
 * Explain why an answer is correct
 */
router.post('/explain-answer', async (req: Request, res: Response) => {
  const { question, correctAnswer, options, subject, grade, language } = req.body;

  if (!question || !correctAnswer || !subject || !grade) {
    res.status(400).json({
      error: true,
      message: 'Missing required fields: question, correctAnswer, subject, grade',
    });
    return;
  }

  const optionsText = options ? `\nOptions: ${options.join(', ')}` : '';

  let request;
  try {
    request = NAANORequestSchema.parse({
      type: 'chat',
      subject,
      grade: parseInt(grade),
      content: `Question: ${question}${optionsText}
Correct Answer: ${correctAnswer}

Explain why "${correctAnswer}" is the correct answer. Be CONCISE (2-3 short paragraphs max). Focus ONLY on:
1. Why this specific answer is correct
2. What makes it the right choice for this question

Use simple language appropriate for grade ${grade}. Include ONE brief Ghanaian example if it helps clarify. NO introductions, NO lengthy explanations, NO emojis unless absolutely needed for clarity.`,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: true, message: 'Validation error', details: error.errors });
      return;
    }
    res.status(500).json({ error: true, message: 'Internal server error' });
    return;
  }

  try {
    const naano = createNAANOAgent();
    const response = await withTimeout(naano.processRequest(request), 24_000);

    const explanation = stripMarkdown(response.content as string);
    let translatedExplanation: string | undefined;

    // Translate explanation if a non-English language is requested
    if (language && language !== 'en') {
      try {
        const cached = await getCachedTranslation(explanation, language);
        if (cached) {
          translatedExplanation = cached;
        } else {
          const langPair = `en-${language}`;
          translatedExplanation = await translateSingleText(explanation, langPair);
          setCachedTranslation(explanation, language, translatedExplanation);
        }
      } catch (translateError) {
        console.warn('Translation of explanation failed, returning English only:', translateError);
      }
    }

    res.json({
      explanation,
      translatedExplanation,
      metadata: response.metadata,
    });
  } catch (error: any) {
    console.error(JSON.stringify({
      level: 'error',
      endpoint: '/explain-answer',
      errorMessage: error?.message,
      timestamp: new Date().toISOString(),
    }));
    const friendlyMessage = getUserFriendlyErrorMessage(error);
    res.status(500).json({ error: true, message: friendlyMessage });
  }
});

/**
 * POST /api/naano/reset
 * Reset conversation history
 */
router.post('/reset', (req: Request, res: Response) => {
  try {
    const naano = getNAANOAgent();
    naano.resetConversation();

    res.json({
      success: true,
      message: 'Conversation history reset successfully',
    });
  } catch (error: any) {
    console.error('Error resetting conversation:', error);
    res.status(500).json({
      error: error.message || 'Internal server error',
    });
  }
});

export default router;
