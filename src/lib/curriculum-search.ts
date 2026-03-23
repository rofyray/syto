import OpenAI from 'openai';
import { supabase } from './supabase.js';
import {
  getCachedEmbedding,
  setCachedEmbedding,
  getCachedSearchResults,
  setCachedSearchResults,
} from './redis.js';

/**
 * Curriculum search using Supabase pgvector
 * Replaces Milvus/Zilliz Cloud for semantic search of Ghana curriculum content
 * Now with Redis caching for embeddings and search results
 */

let openaiClient: OpenAI | null = null;

/**
 * Initialize OpenAI client for generating embeddings
 */
function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

/**
 * Generate embeddings for text using OpenAI (with Redis caching)
 * Same query always produces the same embedding — cache for 24h to save API costs
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  // Check Redis cache first
  const cached = await getCachedEmbedding(text);
  if (cached) {
    return cached;
  }

  const client = getOpenAIClient();

  try {
    const response = await client.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });

    const embedding = response.data[0].embedding;

    // Cache the embedding (non-blocking)
    setCachedEmbedding(text, embedding).catch(err =>
      console.error('Failed to cache embedding:', err)
    );

    return embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw new Error('Failed to generate embedding');
  }
}

export interface CurriculumResult {
  id: string;
  content: string;
  subject: string;
  grade_level: number;
  strand: string | null;
  sub_strand: string | null;
  element_type: string | null;
  source: string | null;
  page_number: number | null;
  similarity: number;
}

/**
 * Search curriculum content using pgvector semantic search (with Redis caching)
 * Caches full search results for 4h — saves both embedding generation AND pgvector query
 */
export async function searchCurriculum(
  subject: 'mathematics' | 'english',
  grade: number,
  query: string,
  limit: number = 5
): Promise<CurriculumResult[]> {
  try {
    // Check Redis cache for full search results
    const cached = await getCachedSearchResults<CurriculumResult[]>(subject, grade, query);
    if (cached) {
      return cached;
    }

    const queryVector = await generateEmbedding(query);

    // Use Supabase RPC for vector similarity search
    const { data, error } = await supabase.rpc('search_curriculum_content', {
      query_embedding: queryVector,
      filter_subject: subject,
      filter_grade: grade,
      match_count: limit,
    });

    if (error) {
      console.error('Error searching curriculum:', error);
      return [];
    }

    const results = (data || []) as CurriculumResult[];

    // Cache the search results (non-blocking)
    if (results.length > 0) {
      setCachedSearchResults(subject, grade, query, results).catch(err =>
        console.error('Failed to cache search results:', err)
      );
    }

    return results;
  } catch (error) {
    console.error(`Error searching ${subject} curriculum:`, error);
    return [];
  }
}

/**
 * Get curriculum content by strand (structured query, no embeddings needed)
 */
export async function getCurriculumByStrand(
  subject: 'mathematics' | 'english',
  grade: number,
  strand: string
): Promise<CurriculumResult[]> {
  const { data, error } = await supabase
    .from('curriculum_content')
    .select('*')
    .eq('subject', subject)
    .eq('grade_level', grade)
    .ilike('strand', `%${strand}%`)
    .order('page_number', { ascending: true });

  if (error) {
    console.error('Error fetching curriculum by strand:', error);
    return [];
  }

  return (data || []).map((item: any) => ({ ...item, similarity: 1.0 }));
}

/**
 * Get formatted curriculum context for NAANO AI
 * Drop-in replacement for the old Milvus getCurriculumContext()
 */
export async function getCurriculumContext(
  subject: 'mathematics' | 'english',
  grade: number,
  topic: string
): Promise<string> {
  try {
    const results = await searchCurriculum(subject, grade, topic, 3);

    if (results.length === 0) {
      return `No specific curriculum content found for "${topic}" in ${subject} grade ${grade}. Please generate questions based on general curriculum knowledge for this grade level.`;
    }

    const contextParts = results.map(
      (item, index) =>
        `Context ${index + 1} (Score: ${item.similarity?.toFixed(3)}): ${item.content || 'No content available'}`
    );

    return `Curriculum context for ${subject} grade ${grade}:\n${contextParts.join('\n\n')}`;
  } catch (error: any) {
    console.error('Error getting curriculum context:', error);
    throw error;
  }
}
