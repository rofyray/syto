import express, { Request, Response } from 'express';
import { getNAANOAgent, createNAANOAgent } from '../../lib/naano/index.js';
import { NAANORequestSchema } from '../../lib/naano/types.js';
import { getQuestionsForStudent, streamQuestionsForStudent } from '../../lib/question-bank.js';
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
 * POST /api/naano/chat
 * Chat with NAANO AI (streaming)
 */
router.post('/chat', async (req: Request, res: Response) => {
  // Validate before setting SSE headers so we can return proper JSON errors
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
    res.status(500).json({ error: 'Internal server error' });
    return;
  }

  // Set up Server-Sent Events for streaming
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  try {
    const naano = createNAANOAgent();
    let fullResponse = '';

    for await (const chunk of naano.processRequestStream(request)) {
      fullResponse += chunk;
      res.write(`data: ${JSON.stringify({ chunk, fullResponse })}\n\n`);
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error: any) {
    console.error('Error in chat endpoint:', error);
    const friendlyMessage = getUserFriendlyErrorMessage(error);
    res.write(`data: ${JSON.stringify({ type: 'error', message: friendlyMessage })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  }
});

/**
 * POST /api/naano/generate-questions
 * Stream curriculum-aligned questions using SSE for progressive delivery.
 * Pulls from existing pool first; only calls LLM if not enough questions exist.
 */
router.post('/generate-questions', async (req: Request, res: Response) => {
  const { topic, subject, grade, difficulty, count, userId } = req.body;

  if (!topic || !subject || !grade) {
    res.status(400).json({
      error: 'Missing required fields: topic, subject, grade',
    });
    return;
  }

  // Set up Server-Sent Events for streaming
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  try {
    const stream = streamQuestionsForStudent({
      userId: userId || (req as any).userId,
      topic,
      subject,
      grade: parseInt(grade),
      difficulty: difficulty || 'medium',
      count: count || 5,
    });

    for await (const event of stream) {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error: any) {
    console.error('Error streaming questions:', error);
    const friendlyMessage = getUserFriendlyErrorMessage(error);
    res.write(`data: ${JSON.stringify({ type: 'error', message: friendlyMessage })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
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
    console.error('Error explaining concept:', error);

    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Validation error',
        details: error.errors,
      });
      return;
    }

    res.status(500).json({
      error: error.message || 'Internal server error',
    });
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
    console.error('Error validating answer:', error);

    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Validation error',
        details: error.errors,
      });
      return;
    }

    res.status(500).json({
      error: error.message || 'Internal server error',
    });
  }
});

/**
 * POST /api/naano/explain-answer
 * Explain why an answer is correct (streaming)
 */
router.post('/explain-answer', async (req: Request, res: Response) => {
  const { question, correctAnswer, options, subject, grade } = req.body;

  if (!question || !correctAnswer || !subject || !grade) {
    res.status(400).json({
      error: 'Missing required fields: question, correctAnswer, subject, grade',
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
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
    return;
  }

  // Set up Server-Sent Events for streaming
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  try {
    const naano = createNAANOAgent();

    for await (const chunk of naano.processRequestStream(request)) {
      res.write(`data: ${JSON.stringify({ type: 'content', text: chunk })}\n\n`);
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error: any) {
    console.error('Error explaining answer:', error);
    const friendlyMessage = getUserFriendlyErrorMessage(error);
    res.write(`data: ${JSON.stringify({ type: 'error', message: friendlyMessage })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
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
