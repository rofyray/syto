import Anthropic from '@anthropic-ai/sdk';

/**
 * Question Generator Tool Definition
 * This tool definition guides Claude on how to structure question generation
 * The actual generation is done by Claude itself using the curriculum context
 */
export const questionGeneratorTool: Anthropic.Tool = {
  name: 'generate_questions',
  description: `Signal that you're ready to generate curriculum-aligned, culturally-relevant multiple-choice questions for Ghanaian students.

**Purpose of this tool:**
This tool is informational - it indicates you're entering question generation mode. The actual question creation happens through your natural language capabilities using the curriculum context you've searched and the detailed question generation guidelines in your system prompt.

**When to use this tool:**
- AFTER you've searched the curriculum for the topic using the search_curriculum tool
- When a student or teacher requests practice questions
- When generating quiz content for a specific topic and grade
- After analyzing curriculum standards to ensure alignment

**What you must do when generating questions:**
1. **Curriculum alignment**: Base questions on the curriculum content you found from search_curriculum
2. **Cultural integration**: EVERY question must include authentic Ghanaian cultural elements:
   - Ghanaian names (Kwame, Ama, Kofi, Akosua, Yaw, Efua, etc.)
   - Ghanaian locations (Makola Market, Accra, Kumasi, Kejetia Market, Cape Coast, etc.)
   - Ghana Cedis (GH₵) with realistic prices for all money problems
   - Ghanaian foods (jollof rice, fufu, plantain, banku, kenkey, waakye, oranges, etc.)
   - Scenarios from daily Ghanaian student life (school, market, family, home, sports, etc.)

3. **Test understanding, not memorization**: Create questions that require thinking and application
4. **Plausible wrong answers**: Include distractors based on common student misconceptions
5. **Educational explanations**: Provide step-by-step explanations that teach the concept
6. **Grade-appropriate difficulty**: Match complexity to the specified grade level
7. **JSON output format**: Structure questions in the exact JSON format specified in your system prompt

**Example good questions:**
- "Kwame went to Makola Market with GH₵20. He bought 3 oranges at GH₵2 each. How much money did he have left?" (Grade 4 Math)
- "Read this sentence: 'Ama is cooking banku for dinner.' What is the verb in this sentence?" (Grade 4 English)

**Remember**: Quality over quantity. Each question should be educational, culturally authentic, and curriculum-aligned.`,
  input_schema: {
    type: 'object',
    properties: {
      topic: {
        type: 'string',
        description: 'The specific topic for questions. Be precise about what concept to test. Examples: "addition and subtraction word problems", "multiplication tables", "fractions with like denominators", "verb identification", "noun-adjective agreement", "reading comprehension", "sentence construction"',
      },
      subject: {
        type: 'string',
        enum: ['english', 'mathematics'],
        description: 'The subject area: "mathematics" for math topics (numbers, operations, geometry, measurements, word problems) or "english" for language topics (grammar, reading, writing, vocabulary, comprehension)',
      },
      grade: {
        type: 'number',
        enum: [4, 5, 6],
        description: 'Grade level determines question complexity. Grade 4: basic/foundational (single-step, simple scenarios). Grade 5: intermediate (two-step problems, moderate complexity). Grade 6: advanced (multi-step, complex reasoning, applying multiple concepts)',
      },
      difficulty: {
        type: 'string',
        enum: ['easy', 'medium', 'hard'],
        description: 'Difficulty within the grade level. Easy: straightforward application of concept. Medium: requires some thinking and multi-step reasoning. Hard: complex scenarios, multiple concepts combined, requires deeper understanding. Choose based on student needs.',
      },
      count: {
        type: 'number',
        description: 'Number of questions to generate. Default: 5 (recommended). Minimum: 1, Maximum: 10. For quick practice use 3-5 questions. For comprehensive practice use 8-10 questions.',
        default: 5,
      },
      culturalContext: {
        type: 'string',
        description: 'Optional: Emphasize a specific Ghanaian cultural element. Examples: "market scenarios", "football/sports", "family meals", "classroom activities", "Accra locations", "traditional foods". If not specified, vary cultural elements across questions naturally.',
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
