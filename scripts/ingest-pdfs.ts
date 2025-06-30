#!/usr/bin/env node

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv';
import { ingestPDFsToWeaviate } from '../src/lib/pdf-ingestion.js';
import { DEFAULT_INGESTION_CONFIG, loadEnvironment } from '../src/lib/pdf-config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Main CLI function for PDF ingestion
 */
async function main() {
  console.log('🚀 Starting PDF Ingestion Pipeline...\n');

  try {
    // Load environment variables from .env.development
    const envPath = join(__dirname, '..', '.env.development');
    config({ path: envPath });
    
    // Validate environment
    await loadEnvironment();

    // Set data directory path
    const dataDirectory = join(__dirname, '..', 'data');
    console.log(`📂 Data directory: ${dataDirectory}\n`);

    // Configure ingestion settings
    const ingestionConfig = {
      ...DEFAULT_INGESTION_CONFIG,
      batchSize: 100, // Smaller batches for initial testing
      deleteAfterProcessing: false, // Keep original files for safety
      moveToProcessed: true, // Move to processed folder
    };

    console.log('⚙️ Ingestion Configuration:');
    console.log(`  - Batch Size: ${ingestionConfig.batchSize}`);
    console.log(`  - Delete After Processing: ${ingestionConfig.deleteAfterProcessing}`);
    console.log(`  - Move to Processed: ${ingestionConfig.moveToProcessed}\n`);

    // Run ingestion
    const result = await ingestPDFsToWeaviate(dataDirectory, ingestionConfig);

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
      result.processedFiles.forEach(file => console.log(`  - ${file}`));
    }

    if (result.collections.length > 0) {
      console.log('\n📚 Collections:');
      result.collections.forEach(collection => console.log(`  - ${collection}`));
    }

    if (result.errors.length > 0) {
      console.log('\n❌ Errors:');
      result.errors.forEach(error => console.log(`  - ${error}`));
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
📚 PDF Ingestion CLI

Usage: npm run ingest-pdfs

This script will:
1. Connect to Weaviate Cloud using environment variables
2. Process all PDF files in the /data directory
3. Create appropriate collections (MathDB, ReadingDB, etc.)
4. Extract text content and import to Weaviate
5. Move processed files to /data/processed directory

Environment Variables Required:
- WEAVIATE_URL: Your Weaviate Cloud cluster URL
- WEAVIATE_API_KEY: Your Weaviate API key

Options:
  --help, -h    Show this help message
  
Examples:
  npm run ingest-pdfs
  node scripts/ingest-pdfs.js
`);
  process.exit(0);
}

// Run the main function
main().catch(console.error);
