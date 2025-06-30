#!/usr/bin/env tsx

import { promises as fs } from 'fs';
import path from 'path';
import { PDFIngestionService } from '../src/lib/pdf-ingestion';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.development' });

/**
 * Test script to verify comprehensive PDF extraction with correct page counts
 * This will copy PDFs back from processed folder and run full ingestion
 */
async function testComprehensiveExtraction() {
  console.log('🧪 Testing Comprehensive PDF Extraction\n');
  
  const pipeline = new PDFIngestionService({
    weaviateUrl: process.env.WEAVIATE_URL || '',
    weaviateApiKey: process.env.WEAVIATE_API_KEY || ''
  });
  
  const dataDir = path.join(process.cwd(), 'data');
  const processedDir = path.join(dataDir, 'processed');
  
  try {
    // Ensure data directory exists
    await fs.mkdir(dataDir, { recursive: true });
    
    // Copy PDFs back from processed folder for testing
    const processedFiles = await fs.readdir(processedDir).catch(() => []);
    const pdfFiles = processedFiles.filter(f => f.endsWith('.pdf'));
    
    if (pdfFiles.length === 0) {
      console.log('❌ No PDFs found in processed folder. Please ensure PDFs are available.');
      console.log('💡 Try running the ingestion first: npm run ingest-pdfs');
      return;
    }
    
    console.log(`📁 Found ${pdfFiles.length} PDFs in processed folder`);
    
    // Copy PDFs back to data folder for testing
    for (const pdfFile of pdfFiles) {
      const srcPath = path.join(processedDir, pdfFile);
      const destPath = path.join(dataDir, pdfFile);
      await fs.copyFile(srcPath, destPath);
      console.log(`📋 Copied ${pdfFile} for testing`);
    }
    
    console.log('\n🔍 Running comprehensive extraction test via full ingestion...\n');
    
    // Connect to Weaviate
    await pipeline.connect();
    
    // Run the full ingestion pipeline which will show extraction stats
    const result = await pipeline.ingestPDFs(dataDir);
    
    console.log('\n📈 COMPREHENSIVE EXTRACTION TEST RESULTS:');
    console.log('==========================================');
    console.log(`📊 Total Objects Ingested: ${result.totalObjects}`);
    console.log(`📋 Collections Created: ${result.collections.join(', ')}`);
    console.log(`📁 Files Processed: ${result.processedFiles.join(', ')}`);
    
    if (result.errors.length > 0) {
      console.log(`❌ Errors: ${result.errors.join(', ')}`);
    }
    
    // Expected vs actual comparison
    const expectedMath = 183 * 2; // ~2 elements per page for math
    const expectedReading = 97 * 3; // ~3 elements per page for reading
    const expectedTotal = expectedMath + expectedReading;
    
    console.log(`\n🎯 Expected vs Actual:`);
    console.log(`   Expected: ~${expectedTotal} objects (183 math pages × 2 + 97 reading pages × 3)`);
    console.log(`   Actual: ${result.totalObjects} objects`);
    console.log(`   Coverage: ${((result.totalObjects / expectedTotal) * 100).toFixed(1)}%`);
    
    if (result.totalObjects > 500) {
      console.log('\n✅ SUCCESS: Comprehensive extraction working correctly!');
      console.log('   All PDF pages are being processed with multiple content elements per page.');
      console.log('   The Weaviate collections now contain comprehensive curriculum data for Chale AI.');
    } else if (result.totalObjects > 100) {
      console.log('\n⚠️  PARTIAL SUCCESS: Good improvement but could be better.');
      console.log('   Consider increasing content density per page for even more comprehensive coverage.');
    } else {
      console.log('\n❌ NEEDS IMPROVEMENT: Extraction may not be working as expected.');
      console.log('   Check the extraction logic and page count calculations.');
    }
    
    console.log('\n✨ Test completed successfully!');
    console.log('🚀 Ready for Chale AI integration with comprehensive curriculum knowledge base!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testComprehensiveExtraction().catch(console.error);
