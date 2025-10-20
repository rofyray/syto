import express, { Request, Response } from 'express';
import { getNAANOAgent, createNAANOAgent } from '../../lib/naano';
import { NAANORequestSchema } from '../../lib/naano/types';
import { z } from 'zod';

const router = express.Router();

/**
 * POST /api/naano/chat
 * Chat with NAANO AI (streaming)
 */
router.post('/chat', async (req: Request, res: Response) => {
  try {
    const request = NAANORequestSchema.parse({
      type: 'chat',
      subject: req.body.subject || 'mathematics',
      grade: req.body.grade || 5,
      content: req.body.content || req.body.message,
      context: req.body.context,
    });

    const naano = getNAANOAgent();

    // Set up Server-Sent Events for streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable buffering for Nginx

    let fullResponse = '';

    for await (const chunk of naano.processRequestStream(request)) {
      fullResponse += chunk;
      res.write(`data: ${JSON.stringify({ chunk, fullResponse })}\n\n`);
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error: any) {
    console.error('Error in chat endpoint:', error);

    // Handle validation errors
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
 * POST /api/naano/generate-questions
 * Generate curriculum-aligned questions
 */
router.post('/generate-questions', async (req: Request, res: Response) => {
  try {
    const { topic, subject, grade, difficulty, count } = req.body;

    if (!topic || !subject || !grade) {
      res.status(400).json({
        error: 'Missing required fields: topic, subject, grade',
      });
      return;
    }

    const request = NAANORequestSchema.parse({
      type: 'generate_questions',
      subject,
      grade: parseInt(grade),
      content: `Generate ${count || 5} ${difficulty || 'medium'} multiple-choice questions about ${topic} for grade ${grade} ${subject}.

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
      "difficulty": "${difficulty || 'medium'}",
      "culturalContext": "Description of Ghanaian elements used"
    }
  ]
}`,
      context: { topic, difficulty },
    });

    // Create a fresh NAANO instance for each question generation request
    // This prevents conversation history pollution from previous requests
    const naano = createNAANOAgent();
    const response = await naano.processRequest(request);

    // Try to parse questions from response
    let questions;
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.content.toString().match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        questions = parsed.questions || parsed;
      } else {
        questions = JSON.parse(response.content.toString());
      }
    } catch (parseError) {
      console.error('Error parsing questions:', parseError);
      res.status(500).json({
        error: 'Failed to parse generated questions',
        rawResponse: response.content,
      });
      return;
    }

    res.json({
      success: true,
      questions: Array.isArray(questions) ? questions : [questions],
      metadata: response.metadata,
    });
  } catch (error: any) {
    console.error('Error generating questions:', error);

    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Validation error',
        details: error.errors,
      });
      return;
    }

    // Check if it's a Milvus-related error
    if (error.message?.includes('STOPPED') ||
        error.message?.includes('CURRICULUM_DATABASE_OFFLINE') ||
        error.code === 16) {
      res.status(503).json({
        error: 'NAANO is currently offline',
        message: 'The curriculum database is unavailable right now. Please try again in a few minutes.',
        code: 'CURRICULUM_DATABASE_OFFLINE',
      });
      return;
    }

    res.status(500).json({
      error: error.message || 'Internal server error',
    });
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
