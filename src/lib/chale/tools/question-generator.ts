import Anthropic from '@anthropic-ai/sdk';

/**
 * Question Generator Tool Definition
 * This tool definition guides Claude on how to structure question generation
 * The actual generation is done by Claude itself using the curriculum context
 */
export const questionGeneratorTool: Anthropic.Tool = {
  name: 'generate_questions',
  description: `Generate curriculum-aligned multiple-choice questions for Ghanaian students. Questions MUST include Ghanaian cultural context (names, foods, locations, currency). This tool is informational - the actual question generation happens through your natural language capabilities.`,
  input_schema: {
    type: 'object',
    properties: {
      topic: {
        type: 'string',
        description: 'The specific topic for questions (e.g., "multiplication", "verb tenses")',
      },
      subject: {
        type: 'string',
        enum: ['english', 'mathematics'],
        description: 'Subject area',
      },
      grade: {
        type: 'number',
        enum: [4, 5, 6],
        description: 'Grade level',
      },
      difficulty: {
        type: 'string',
        enum: ['easy', 'medium', 'hard'],
        description: 'Difficulty level',
      },
      count: {
        type: 'number',
        description: 'Number of questions to generate (1-10, default: 5)',
        default: 5,
      },
      culturalContext: {
        type: 'string',
        description: 'Specific Ghanaian cultural element to emphasize (optional)',
      },
    },
    required: ['topic', 'subject', 'grade', 'difficulty'],
  },
};

/**
 * Handle question generation tool (informational)
 * This tool is primarily directive - Claude generates the questions
 */
export async function handleQuestionGeneration(input: unknown): Promise<string> {
  // This is informational - we just acknowledge the request
  // Claude will actually generate the questions based on the system prompt
  return JSON.stringify({
    success: true,
    message: 'Question generation initiated. Generating curriculum-aligned questions with Ghanaian cultural context...',
    params: input,
  });
}
