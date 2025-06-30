import weaviate, { WeaviateClient } from 'weaviate-client';

/**
 * Weaviate client configuration for Chale AI agent
 * Connects to curriculum databases (MathDB and ReadingDB)
 */

let weaviateClient: WeaviateClient | null = null;

/**
 * Initialize Weaviate client with environment configuration
 */
export async function getWeaviateClient(): Promise<WeaviateClient> {
  if (!weaviateClient) {
    if (!process.env.WEAVIATE_URL || !process.env.WEAVIATE_API_KEY) {
      throw new Error('WEAVIATE_URL and WEAVIATE_API_KEY environment variables are required');
    }

    weaviateClient = await weaviate.connectToLocal({
      host: process.env.WEAVIATE_URL,
      headers: {
        'X-OpenAI-Api-Key': process.env.WEAVIATE_API_KEY,
      }
    });
  }

  return weaviateClient;
}

/**
 * Query MathDB collection for curriculum content
 */
export async function queryMathDB(query: string, grade?: number, limit: number = 10) {
  const client = await getWeaviateClient();
  
  try {
    const collection = client.collections.get('MathDB');
    
    const queryOptions: any = {
      limit,
      returnMetadata: ['score']
    };

    if (grade) {
      queryOptions.where = collection.filter.byProperty('grade').equal(grade);
    }

    const result = await collection.query.nearText(query, queryOptions);
    return result.objects || [];
  } catch (error) {
    console.error('Error querying MathDB:', error);
    throw new Error('Failed to query mathematics curriculum database');
  }
}

/**
 * Query ReadingDB collection for curriculum content
 */
export async function queryReadingDB(query: string, grade?: number, limit: number = 10) {
  const client = await getWeaviateClient();
  
  try {
    const collection = client.collections.get('ReadingDB');
    
    const queryOptions: any = {
      limit,
      returnMetadata: ['score']
    };

    if (grade) {
      queryOptions.where = collection.filter.byProperty('grade').equal(grade);
    }

    const result = await collection.query.nearText(query, queryOptions);
    return result.objects || [];
  } catch (error) {
    console.error('Error querying ReadingDB:', error);
    throw new Error('Failed to query reading curriculum database');
  }
}

/**
 * Search both curriculum databases for relevant content
 */
export async function searchCurriculumContent(
  query: string, 
  subject: 'mathematics' | 'english', 
  grade?: number, 
  limit: number = 5
) {
  try {
    if (subject === 'mathematics') {
      return await queryMathDB(query, grade, limit);
    } else {
      return await queryReadingDB(query, grade, limit);
    }
  } catch (error) {
    console.error(`Error searching ${subject} curriculum:`, error);
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
      return `No specific curriculum content found for ${subject} grade ${grade} topic: ${topic}`;
    }

    const contextParts = results.map((item: any, index: number) => 
      `Context ${index + 1}: ${item.properties?.content || item.content || 'No content available'}`
    );

    return `Curriculum context for ${subject} grade ${grade}:\n${contextParts.join('\n\n')}`;
  } catch (error) {
    console.error('Error getting curriculum context:', error);
    return `Error retrieving curriculum context for ${subject} grade ${grade}`;
  }
}
