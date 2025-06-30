import { config } from 'dotenv';
import { join } from 'path';
import { PDFIngestionService } from './pdf-ingestion.js';
import { DEFAULT_INGESTION_CONFIG, validateEnvironment } from './pdf-config.js';
// Load environment variables
const envPath = join(process.cwd(), '.env.development');
config({ path: envPath });
/**
 * Test utility for PDF ingestion pipeline
 */
export class PDFIngestionTester {
    constructor() {
        // Validate environment first
        const validation = validateEnvironment();
        if (!validation.valid) {
            throw new Error(`Missing environment variables: ${validation.missing.join(', ')}`);
        }
        this.service = new PDFIngestionService({
            weaviateUrl: process.env.WEAVIATE_URL,
            weaviateApiKey: process.env.WEAVIATE_API_KEY,
            ...DEFAULT_INGESTION_CONFIG
        });
    }
    /**
     * Test Weaviate connection
     */
    async testConnection() {
        try {
            console.log('🔌 Testing Weaviate connection...');
            await this.service.connect();
            console.log('✅ Connection test passed');
            return true;
        }
        catch (error) {
            console.error('❌ Connection test failed:', error);
            return false;
        }
    }
    /**
     * Test collection creation
     */
    async testCollectionCreation(collectionName = 'TestDB') {
        try {
            console.log(`📚 Testing collection creation: ${collectionName}`);
            await this.service.connect();
            await this.service.createCollection(collectionName);
            console.log('✅ Collection creation test passed');
            return true;
        }
        catch (error) {
            console.error('❌ Collection creation test failed:', error);
            return false;
        }
    }
    /**
     * Test PDF processing (mock)
     */
    async testPDFProcessing(filePath) {
        try {
            console.log(`📄 Testing PDF processing: ${filePath}`);
            const elements = await this.service.processPDF(filePath);
            console.log(`✅ PDF processing test passed - extracted ${elements.length} elements`);
            return true;
        }
        catch (error) {
            console.error('❌ PDF processing test failed:', error);
            return false;
        }
    }
    /**
     * Test data import
     */
    async testDataImport(collectionName = 'TestDB') {
        try {
            console.log(`📦 Testing data import to: ${collectionName}`);
            await this.service.connect();
            // Create test collection
            await this.service.createCollection(collectionName);
            // Create mock elements
            const mockElements = [
                {
                    content: 'Test content for ingestion pipeline',
                    elementType: 'paragraph',
                    source: 'test.pdf',
                    pageNumber: 1,
                    metadata: { test: true }
                },
                {
                    content: 'Another test element',
                    elementType: 'title',
                    source: 'test.pdf',
                    pageNumber: 1,
                    metadata: { test: true }
                }
            ];
            const importedCount = await this.service.importToCollection(collectionName, mockElements);
            console.log(`✅ Data import test passed - imported ${importedCount} objects`);
            return true;
        }
        catch (error) {
            console.error('❌ Data import test failed:', error);
            return false;
        }
    }
    /**
     * Test query functionality
     */
    async testQuery(collectionName = 'TestDB', query = 'test content') {
        try {
            console.log(`🔍 Testing query: "${query}" in ${collectionName}`);
            const results = await this.service.testQuery(collectionName, query);
            console.log(`✅ Query test passed - found ${results.length} results`);
            return true;
        }
        catch (error) {
            console.error('❌ Query test failed:', error);
            return false;
        }
    }
    /**
     * Run all tests
     */
    async runAllTests() {
        console.log('🧪 Running PDF Ingestion Tests...\n');
        const tests = [
            { name: 'Connection', fn: () => this.testConnection() },
            { name: 'Collection Creation', fn: () => this.testCollectionCreation() },
            { name: 'PDF Processing', fn: () => this.testPDFProcessing('mock-test.pdf') },
            { name: 'Data Import', fn: () => this.testDataImport() },
            { name: 'Query', fn: () => this.testQuery() }
        ];
        const results = {};
        let passed = 0;
        let failed = 0;
        for (const test of tests) {
            console.log(`\n--- ${test.name} Test ---`);
            try {
                const result = await test.fn();
                results[test.name] = result;
                if (result) {
                    passed++;
                }
                else {
                    failed++;
                }
            }
            catch (error) {
                console.error(`❌ ${test.name} test threw error:`, error);
                results[test.name] = false;
                failed++;
            }
        }
        console.log('\n📊 TEST RESULTS:');
        console.log('='.repeat(40));
        console.log(`✅ Passed: ${passed}`);
        console.log(`❌ Failed: ${failed}`);
        console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
        console.log('\nDetailed Results:');
        Object.entries(results).forEach(([name, result]) => {
            console.log(`  ${result ? '✅' : '❌'} ${name}`);
        });
        return { passed, failed, results };
    }
}
/**
 * Standalone test runner function
 */
export async function runPDFIngestionTests() {
    try {
        const tester = new PDFIngestionTester();
        const results = await tester.runAllTests();
        process.exit(results.failed === 0 ? 0 : 1);
    }
    catch (error) {
        console.error('💥 Test runner failed:', error);
        process.exit(1);
    }
}
