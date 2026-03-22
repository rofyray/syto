#!/usr/bin/env node

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables BEFORE importing modules that use them
const envPath = join(__dirname, '..', '.env.development');
config({ path: envPath });

/**
 * Main CLI function for PDF ingestion to Supabase (pgvector)
 */
async function main() {
  console.log('Starting PDF Ingestion Pipeline (Supabase pgvector)...\n');

  try {
    // Dynamic import after env vars are loaded
    const { ingestPDFsToSupabase } = await import('../src/lib/pdf-ingestion.js');

    // Validate environment variables
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY environment variables are required');
    }

    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required for generating embeddings');
    }

    console.log('Environment variables loaded successfully\n');

    // Set data directory path
    const dataDirectory = join(__dirname, '..', 'data');
    console.log(`Data directory: ${dataDirectory}\n`);

    // Configure ingestion settings
    const ingestionConfig = {
      batchSize: 50,
      deleteAfterProcessing: false,
      moveToProcessed: true,
    };

    console.log('Ingestion Configuration:');
    console.log(`  - Batch Size: ${ingestionConfig.batchSize}`);
    console.log(`  - Delete After Processing: ${ingestionConfig.deleteAfterProcessing}`);
    console.log(`  - Move to Processed: ${ingestionConfig.moveToProcessed}`);
    console.log(`  - Embedding Model: OpenAI text-embedding-3-small`);
    console.log(`  - Target: Supabase curriculum_content table (pgvector)\n`);

    // Run ingestion
    const result = await ingestPDFsToSupabase(dataDirectory, ingestionConfig);

    // Display results
    console.log('\nINGESTION RESULTS:');
    console.log('='.repeat(50));
    console.log(`Success: ${result.success}`);
    console.log(`Processed Files: ${result.processedFiles.length}`);
    console.log(`Total Objects Imported: ${result.totalObjects}`);
    console.log(`Errors: ${result.errors.length}`);

    if (result.processedFiles.length > 0) {
      console.log('\nProcessed Files:');
      result.processedFiles.forEach((file) => console.log(`  - ${file}`));
    }

    if (result.errors.length > 0) {
      console.log('\nErrors:');
      result.errors.forEach((error) => console.log(`  - ${error}`));
    }

    console.log('\nPDF Ingestion Pipeline Complete!');
    process.exit(result.success ? 0 : 1);
  } catch (error) {
    console.error('\nPipeline failed with error:', error);
    process.exit(1);
  }
}

// Handle CLI arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
PDF Ingestion CLI for Supabase pgvector

Usage: npm run ingest-pdfs

This script will:
1. Process all PDF files in the /data directory
2. Generate embeddings using OpenAI text-embedding-3-small
3. Extract structured metadata (subject, grade, strand)
4. Insert into Supabase curriculum_content table with vector embeddings
5. Move processed files to /data/processed directory

Environment Variables Required:
- SUPABASE_URL: Your Supabase project URL
- SUPABASE_ANON_KEY: Your Supabase anonymous key
- OPENAI_API_KEY: Your OpenAI API key for embedding generation

Options:
  --help, -h    Show this help message
`);
  process.exit(0);
}

main().catch(console.error);
