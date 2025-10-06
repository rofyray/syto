import Anthropic from '@anthropic-ai/sdk';
import { getCurriculumContext } from '../../milvus-client.js';
import { CurriculumSearchToolSchema, type CurriculumSearchResult } from '../types';

/**
 * Curriculum Search Tool Definition
 * Allows NAANO to search the Milvus curriculum database
 */
export const curriculumSearchTool: Anthropic.Tool = {
  name: 'search_curriculum',
  description: `Search Ghana's national curriculum database (Milvus vector database) for relevant educational content. Use this BEFORE generating any educational content to ensure curriculum alignment. The database contains authentic Ghana Ministry of Education syllabus content for Primary 4-6.`,
  input_schema: {
    type: 'object',
    properties: {
      subject: {
        type: 'string',
        enum: ['mathematics', 'english'],
        description: 'The subject to search (mathematics or english)',
      },
      grade: {
        type: 'number',
        enum: [4, 5, 6],
        description: 'The grade level (4, 5, or 6)',
      },
      query: {
        type: 'string',
        description: 'Search query for curriculum content (e.g., "fractions", "reading comprehension", "verb tenses")',
      },
      limit: {
        type: 'number',
        description: 'Maximum number of results to return (default: 5)',
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
    return JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      content: '',
    });
  }
}
