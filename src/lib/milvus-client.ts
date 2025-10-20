import { MilvusClient, DataType } from '@zilliz/milvus2-sdk-node';
import OpenAI from 'openai';

/**
 * Milvus client configuration for NAANO AI agent
 * Connects to curriculum databases (MathDB and ReadingDB) via Zilliz Cloud
 */

let milvusClient: MilvusClient | null = null;
let openaiClient: OpenAI | null = null;

// Collection names
export const MATH_COLLECTION = 'MathDB';
export const READING_COLLECTION = 'ReadingDB';

// Embedding dimension for OpenAI text-embedding-3-small model
const EMBEDDING_DIM = 1536;

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
 * Generate embeddings for text using OpenAI
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const client = getOpenAIClient();

  try {
    const response = await client.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw new Error('Failed to generate embedding');
  }
}

/**
 * Initialize Milvus client with Zilliz Cloud configuration
 */
export async function getMilvusClient(): Promise<MilvusClient> {
  if (!milvusClient) {
    if (!process.env.MILVUS_URI || !process.env.MILVUS_TOKEN) {
      throw new Error('MILVUS_URI and MILVUS_TOKEN environment variables are required');
    }

    try {
      milvusClient = new MilvusClient({
        address: process.env.MILVUS_URI,
        token: process.env.MILVUS_TOKEN,
      });

      console.log('✅ Connected to Milvus/Zilliz Cloud successfully');
    } catch (error: any) {
      console.error('❌ Failed to connect to Milvus/Zilliz Cloud:', error.message);

      if (error.message?.includes('STOPPED') || error.code === 16) {
        console.warn('⚠️  Your Zilliz Cloud cluster is stopped.');
        console.warn('   Visit https://cloud.zilliz.com/ to start your cluster.');
      }

      throw error;
    }
  }

  return milvusClient;
}

/**
 * Create a collection in Milvus with proper schema
 */
export async function createCollection(collectionName: string): Promise<void> {
  const client = await getMilvusClient();

  try {
    // Check if collection already exists
    const hasCollection = await client.hasCollection({
      collection_name: collectionName,
    });

    if (hasCollection) {
      console.log(`ℹ️  Collection ${collectionName} already exists`);
      return;
    }

    // Define collection schema
    const fields = [
      {
        name: 'elementId',
        data_type: DataType.VarChar,
        max_length: 500,
        is_primary_key: true, // Use elementId as primary key (no auto_id)
      },
      {
        name: 'content',
        data_type: DataType.VarChar,
        max_length: 65535,
      },
      {
        name: 'elementType',
        data_type: DataType.VarChar,
        max_length: 100,
      },
      {
        name: 'source',
        data_type: DataType.VarChar,
        max_length: 500,
      },
      {
        name: 'pageNumber',
        data_type: DataType.Int64,
      },
      {
        name: 'vector',
        data_type: DataType.FloatVector,
        dim: EMBEDDING_DIM,
      },
    ];

    // Create collection with AUTOINDEX for simplicity
    await client.createCollection({
      collection_name: collectionName,
      fields: fields,
      index_params: [
        {
          field_name: 'vector',
          index_type: 'AUTOINDEX',
          metric_type: 'COSINE', // Use cosine similarity for semantic search
        },
      ],
    });

    console.log(`✅ Created collection: ${collectionName}`);
  } catch (error) {
    console.error(`❌ Failed to create collection ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Query MathDB collection for curriculum content
 */
export async function queryMathDB(query: string, grade?: number, limit: number = 10) {
  return searchCurriculumContent(query, 'mathematics', grade, limit);
}

/**
 * Query ReadingDB collection for curriculum content
 */
export async function queryReadingDB(query: string, grade?: number, limit: number = 10) {
  return searchCurriculumContent(query, 'english', grade, limit);
}

/**
 * Search curriculum databases for relevant content
 */
export async function searchCurriculumContent(
  query: string,
  subject: 'mathematics' | 'english',
  grade?: number,
  limit: number = 5
) {
  try {
    const client = await getMilvusClient();
    const collectionName = subject === 'mathematics' ? MATH_COLLECTION : READING_COLLECTION;

    // Generate embedding for the query
    const queryVector = await generateEmbedding(query);

    // Build filter expression if grade is specified
    let filter = '';
    if (grade) {
      filter = `pageNumber >= ${(grade - 4) * 30} && pageNumber <= ${(grade - 3) * 30}`;
      // This is a simple heuristic - adjust based on actual page distribution
    }

    // Perform vector search
    const searchParams = {
      collection_name: collectionName,
      vectors: [queryVector],
      limit: limit,
      output_fields: ['content', 'elementType', 'source', 'pageNumber', 'elementId'],
      ...(filter && { filter }),
    };

    const results = await client.search(searchParams);

    // Transform results to match expected format
    if (results.results && results.results.length > 0) {
      return results.results.map((result: any) => ({
        id: result.id,
        score: result.score,
        properties: {
          content: result.content,
          elementType: result.elementType,
          source: result.source,
          pageNumber: result.pageNumber,
          elementId: result.elementId,
        },
      }));
    }

    return [];
  } catch (error: any) {
    console.error(`Error searching ${subject} curriculum:`, error);

    // Check if it's a cluster stopped error
    if (error.message?.includes('STOPPED') || error.code === 16) {
      console.warn('⚠️  Milvus cluster is currently stopped. Curriculum search unavailable.');
      console.warn('   To use curriculum search, please start your Zilliz Cloud cluster.');
    }

    return [];
  }
}

/**
 * Get curriculum context for content generation
 */
export async function getCurriculumContext(
  subject: 'mathematics' | 'english',
  grade: number,
  topic: string
): Promise<string> {
  try {
    const results = await searchCurriculumContent(topic, subject, grade, 3);

    if (results.length === 0) {
      throw new Error('No curriculum content found. Curriculum database may be unavailable.');
    }

    const contextParts = results.map(
      (item: any, index: number) =>
        `Context ${index + 1} (Score: ${item.score?.toFixed(3)}): ${item.properties?.content || 'No content available'}`
    );

    return `Curriculum context for ${subject} grade ${grade}:\n${contextParts.join('\n\n')}`;
  } catch (error: any) {
    console.error('Error getting curriculum context:', error);

    // Check if it's a cluster stopped error and throw a specific error
    if (error.message?.includes('STOPPED') || error.code === 16) {
      throw new Error('CURRICULUM_DATABASE_OFFLINE');
    }

    throw error;
  }
}

/**
 * Close Milvus connection
 */
export async function closeMilvusConnection(): Promise<void> {
  if (milvusClient) {
    // Milvus SDK doesn't have an explicit close method for serverless
    milvusClient = null;
    console.log('🔌 Closed Milvus connection');
  }
}
