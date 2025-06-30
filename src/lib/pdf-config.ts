import { IngestionConfig } from './pdf-ingestion';

/**
 * Configuration for PDF ingestion pipeline
 */
export const DEFAULT_INGESTION_CONFIG: Partial<IngestionConfig> = {
  batchSize: 200,
  deleteAfterProcessing: false,
  moveToProcessed: true,
};

/**
 * Collection mapping based on PDF file names
 */
export const COLLECTION_MAPPING: Record<string, string> = {
  'math_syllabus': 'MathDB',
  'reading_syllabus': 'ReadingDB',
  'english_syllabus': 'EnglishDB',
  'science_syllabus': 'ScienceDB',
};

/**
 * Get collection name from PDF filename
 */
export function getCollectionName(filename: string): string {
  const baseName = filename.toLowerCase().replace('.pdf', '');
  
  // Check direct mapping first
  if (COLLECTION_MAPPING[baseName]) {
    return COLLECTION_MAPPING[baseName];
  }
  
  // Check for partial matches
  for (const [key, value] of Object.entries(COLLECTION_MAPPING)) {
    if (baseName.includes(key.split('_')[0])) {
      return value;
    }
  }
  
  // Default: create collection name from filename
  return `${baseName.replace(/[^a-zA-Z0-9]/g, '')}DB`;
}

/**
 * Validate environment variables
 */
export function validateEnvironment(): { valid: boolean; missing: string[] } {
  const required = ['WEAVIATE_URL', 'WEAVIATE_API_KEY'];
  const missing: string[] = [];
  
  for (const envVar of required) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }
  
  return {
    valid: missing.length === 0,
    missing
  };
}

/**
 * Load environment variables from .env.development
 */
export async function loadEnvironment(): Promise<void> {
  try {
    // In a Node.js environment, you would use dotenv
    // For now, we'll assume environment variables are already loaded
    const validation = validateEnvironment();
    
    if (!validation.valid) {
      throw new Error(`Missing required environment variables: ${validation.missing.join(', ')}`);
    }
    
    console.log('✅ Environment variables validated');
  } catch (error) {
    console.error('❌ Environment validation failed:', error);
    throw error;
  }
}
