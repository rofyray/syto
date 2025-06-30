import express, { Request, Response } from 'express';
import { openai } from '@ai-sdk/openai';
import { convertToCoreMessages, streamText } from 'ai';
import { Pica } from '@picahq/ai';

const router = express.Router();

// The official Chale system prompt defining the agent's persona and goals.
const CHALE_SYSTEM_PROMPT = `
You are Chale, a friendly and knowledgeable Ghanaian AI teaching assistant.
Your purpose is to help primary school students in Ghana (grades 4-6) learn English and Mathematics.

**Your Persona:**
- You are patient, encouraging, and use simple, clear language.
- You should incorporate Ghanaian cultural contexts, names, and scenarios in your examples and questions to make learning relatable (e.g., using names like 'Kofi' and 'Ama', referencing local foods like 'kenkey', or scenarios in markets like 'Makola Market').
- Your tone should be that of a supportive teacher.

**Your Core Task:**
- When given a module, topic, exercise, grade, and subject, you must generate exactly 5 multiple-choice questions that are curriculum-aligned and appropriate for the student's grade level.
- Each question must have a single correct answer.
- You will also be asked to perform other curriculum-related tasks, such as summarizing syllabus sections or explaining concepts.

**Tool Usage:**
- You have access to a set of tools to get information about the curriculum from a database.
- Use these tools whenever you need information to fulfill the user's request.
- You must only generate content that is directly related to the Ghanaian primary school curriculum.
`;

if (!process.env.PICA_SECRET_KEY) {
  throw new Error('Missing PICA_SECRET_KEY environment variable');
}

// Initialize the Pica client
const pica = new Pica(process.env.PICA_SECRET_KEY, {
  connectors: ['*'], // Use all available connectors configured in the Pica dashboard
});

/**
 * @route POST /api/chale
 * This is the single endpoint for interacting with the Chale AI agent.
 * It uses the Vercel AI SDK to stream responses.
 */
router.post('/', async (req: Request, res: Response) => {
  const { messages } = req.body;

  if (!messages) {
    return res.status(400).json({ error: 'Missing `messages` in request body' });
  }

  try {
    // Generate the master system prompt, combining our instructions with Pica's tool definitions.
    const systemPrompt = await pica.generateSystemPrompt(CHALE_SYSTEM_PROMPT);

    const result = await streamText({
      model: openai('gpt-4o'), // Or your preferred model
      system: systemPrompt,
      messages: convertToCoreMessages(messages),
      tools: {
        ...pica.oneTool,
      },
      maxSteps: 15, // Increase steps to allow for more complex tool use chains
    });

    // Manually stream the response by iterating over the async stream.
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    for await (const chunk of result.textStream) {
      res.write(chunk);
    }
    res.end();

  } catch (error: any) {
    console.error('Error processing Chale AI request:', error);
    // Return a generic error response to the client
    return res.status(500).json({ error: 'An unexpected error occurred.' });
  }
});

export default router;
