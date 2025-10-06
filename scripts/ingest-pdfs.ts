#!/usr/bin/env node

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv';
import { ingestPDFsToMilvus } from '../src/lib/pdf-ingestion-milvus.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Main CLI function for PDF ingestion to Milvus
 */
async function main() {
  console.log('🚀 Starting PDF Ingestion Pipeline (Milvus/Zilliz Cloud)...\n');

  try {
    // Load environment variables from .env.development
    const envPath = join(__dirname, '..', '.env.development');
    config({ path: envPath });

    // Validate environment variables
    if (!process.env.MILVUS_URI || !process.env.MILVUS_TOKEN) {
      throw new Error('MILVUS_URI and MILVUS_TOKEN environment variables are required');
    }

    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required for generating embeddings');
    }

    console.log('✅ Environment variables loaded successfully\n');

    // Set data directory path
    const dataDirectory = join(__dirname, '..', 'data');
    console.log(`📂 Data directory: ${dataDirectory}\n`);

    // Configure ingestion settings
    const ingestionConfig = {
      batchSize: 50, // Smaller batches for embedding generation (OpenAI rate limits)
      deleteAfterProcessing: false, // Keep original files for safety
      moveToProcessed: true, // Move to processed folder
    };

    console.log('⚙️  Ingestion Configuration:');
    console.log(`  - Batch Size: ${ingestionConfig.batchSize}`);
    console.log(`  - Delete After Processing: ${ingestionConfig.deleteAfterProcessing}`);
    console.log(`  - Move to Processed: ${ingestionConfig.moveToProcessed}`);
    console.log(`  - Embedding Model: OpenAI text-embedding-3-small\n`);

    // Run ingestion
    const result = await ingestPDFsToMilvus(dataDirectory, ingestionConfig);

    // Display results
    console.log('\n📊 INGESTION RESULTS:');
    console.log('='.repeat(50));
    console.log(`✅ Success: ${result.success}`);
    console.log(`📄 Processed Files: ${result.processedFiles.length}`);
    console.log(`📚 Collections Created: ${result.collections.length}`);
    console.log(`📦 Total Objects Imported: ${result.totalObjects}`);
    console.log(`❌ Errors: ${result.errors.length}`);

    if (result.processedFiles.length > 0) {
      console.log('\n📄 Processed Files:');
      result.processedFiles.forEach((file) => console.log(`  - ${file}`));
    }

    if (result.collections.length > 0) {
      console.log('\n📚 Collections:');
      result.collections.forEach((collection) => console.log(`  - ${collection}`));
    }

    if (result.errors.length > 0) {
      console.log('\n❌ Errors:');
      result.errors.forEach((error) => console.log(`  - ${error}`));
    }

    console.log('\n🎉 PDF Ingestion Pipeline Complete!');

    // Exit with appropriate code
    process.exit(result.success ? 0 : 1);
  } catch (error) {
    console.error('\n💥 Pipeline failed with error:', error);
    process.exit(1);
  }
}

// Handle CLI arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
📚 PDF Ingestion CLI for Milvus/Zilliz Cloud

Usage: npm run ingest-pdfs

This script will:
1. Connect to Milvus/Zilliz Cloud using environment variables
2. Process all PDF files in the /data directory
3. Generate embeddings using OpenAI text-embedding-3-small
4. Create appropriate collections (MathDB, ReadingDB, etc.)
5. Extract text content and import to Milvus with vector embeddings
6. Move processed files to /data/processed directory

Environment Variables Required:
- MILVUS_URI: Your Zilliz Cloud cluster endpoint
- MILVUS_TOKEN: Your Zilliz Cloud authentication token
- OPENAI_API_KEY: Your OpenAI API key for embedding generation

Options:
  --help, -h    Show this help message

Examples:
  npm run ingest-pdfs
  node scripts/ingest-pdfs.js

Note: The ingestion process generates embeddings for each text chunk,
which may take some time depending on the PDF size and OpenAI API rate limits.
`);
  process.exit(0);
}

// Run the main function
main().catch(console.error);
