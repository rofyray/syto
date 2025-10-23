import Anthropic from '@anthropic-ai/sdk';
import { getCurriculumContext } from '../../milvus-client.js';
import { CurriculumSearchToolSchema, type CurriculumSearchResult } from '../types.js';

/**
 * Curriculum Search Tool Definition
 * Allows NAANO to search the Milvus curriculum database
 */
export const curriculumSearchTool: Anthropic.Tool = {
  name: 'search_curriculum',
  description: `Search Ghana's national curriculum database for authentic Ministry of Education content.

**When to use this tool:**
- BEFORE generating any educational content (questions, explanations, examples)
- When a student asks about a specific topic you need to teach accurately
- To verify what students at a specific grade level should know
- To ensure your teaching aligns with Ghana's official curriculum standards
- When you're unsure about the appropriate difficulty level for a grade

**What this tool searches:**
- Authentic Ghana Ministry of Education syllabus documents for Primary 4, 5, and 6
- Official learning objectives and standards for each topic
- Recommended teaching approaches from the curriculum
- Grade-appropriate content guidelines
- Subject-specific focus areas (Mathematics and English Language)

**How the results help you:**
- Ensures your teaching matches what the Ghana curriculum requires
- Provides accurate, grade-appropriate content
- Gives you official learning objectives to reference
- Helps you understand prerequisite knowledge students should have
- Allows you to cite curriculum standards in your explanations

**Example usage:**
- Before creating questions on "fractions" for Grade 5, search to see what fraction concepts Grade 5 students should master
- When explaining "verb tenses" to Grade 4, search to understand which tenses are taught at that level
- To verify the difficulty level appropriate for "multiplication word problems" in Grade 6

**Important:** ALWAYS use this tool before generating questions or explaining curriculum topics. It's the foundation for accurate, curriculum-aligned teaching!`,
  input_schema: {
    type: 'object',
    properties: {
      subject: {
        type: 'string',
        enum: ['mathematics', 'english'],
        description: 'The subject to search. Choose "mathematics" for math topics (numbers, operations, geometry, measurements, word problems) or "english" for language topics (grammar, reading, writing, vocabulary, comprehension)',
      },
      grade: {
        type: 'number',
        enum: [4, 5, 6],
        description: 'The grade level (Primary 4, 5, or 6). This determines which curriculum standards and learning objectives to retrieve. Grade 4 is basic level, Grade 5 is intermediate, Grade 6 is advanced primary.',
      },
      query: {
        type: 'string',
        description: 'Your search query for curriculum content. Be specific about the topic you need information on. Examples: "fractions addition", "multiplication word problems", "verb tenses present and past", "reading comprehension strategies", "geometry shapes", "paragraph writing". The more specific your query, the better the results.',
      },
      limit: {
        type: 'number',
        description: 'Maximum number of curriculum results to return (default: 5, max: 10). Use 5 for focused topics, 10 for broader topics that might have multiple relevant curriculum sections.',
        default: 5,
      },
    },
    required: ['subject', 'grade', 'query'],
  },
};

/**
 * Handle curriculum search tool execution
 */
export async function handleCurriculumSearch(input: unknown): Promise<string> {
  try {
    // Validate input
    const params = CurriculumSearchToolSchema.parse(input);

    // Query Milvus for curriculum content
    const curriculumContext = await getCurriculumContext(
      params.subject,
      params.grade,
      params.query
    );

    // Format result
    const result: CurriculumSearchResult = {
      success: true,
      subject: params.subject,
      grade: params.grade,
      query: params.query,
      content: curriculumContext,
      source: 'Ghana National Curriculum Database',
    };

    return JSON.stringify(result, null, 2);
  } catch (error) {
    console.error('Error in curriculum search:', error);

    // Throw the error so it propagates up to the API layer
    return JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      content: '',
    });
  }
}
