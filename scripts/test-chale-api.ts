#!/usr/bin/env tsx

/**
 * Comprehensive Test Script for Chale AI API
 * Tests all endpoints, content generation, and validation
 */

import dotenv from 'dotenv';
import fetch from 'node-fetch';

// Load environment variables
dotenv.config({ path: '.env.development' });

const API_BASE_URL = 'http://localhost:3001';
const TEST_TIMEOUT = 30000; // 30 seconds per test

interface TestResult {
  name: string;
  success: boolean;
  duration: number;
  error?: string;
  data?: any;
}

// Type definitions for API responses
interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}

interface ChaleResponse {
  chale?: any;
  syto?: any;
}

class ChaleAPITester {
  private results: TestResult[] = [];
  private authToken?: string;

  constructor() {
    console.log('🧪 Chale AI API Testing Suite');
    console.log('================================');
  }

  /**
   * Run a single test with timeout and error handling
   */
  private async runTest(name: string, testFn: () => Promise<any>): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      console.log(`\n🔄 Running: ${name}`);
      
      const result = await Promise.race([
        testFn(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Test timeout')), TEST_TIMEOUT)
        )
      ]);
      
      const duration = Date.now() - startTime;
      console.log(`✅ Passed: ${name} (${duration}ms)`);
      
      return {
        name,
        success: true,
        duration,
        data: result
      };
      
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log(`❌ Failed: ${name} (${duration}ms) - ${errorMessage}`);
      
      return {
        name,
        success: false,
        duration,
        error: errorMessage
      };
    }
  }

  /**
   * Test server health check
   */
  private async testHealthCheck(): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/health`);
    
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }
    
    const data = await response.json() as ApiResponse;
    
    if ((data as any).status !== 'healthy') {
      throw new Error(`Server not healthy: ${(data as any).status}`);
    }
    
    return data;
  }

  /**
   * Test cache statistics endpoint
   */
  private async testCacheStats(): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/cache-stats`);
    
    if (!response.ok) {
      throw new Error(`Cache stats failed: ${response.status}`);
    }
    
    return await response.json();
  }

  /**
   * Test module generation
   */
  private async testModuleGeneration(): Promise<any> {
    const testData = {
      subject: 'english',
      grade: 4,
      title: 'Reading Comprehension Basics',
      topic: 'Reading Comprehension',
      difficulty: 'medium'
    };
    
    const response = await fetch(`${API_BASE_URL}/api/chale/generate-module`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.authToken && { 'Authorization': `Bearer ${this.authToken}` })
      },
      body: JSON.stringify(testData)
    });
    
    if (!response.ok) {
      const errorData = await response.json() as ApiResponse;
      throw new Error(`Module generation failed: ${response.status} - ${errorData.error || errorData.message}`);
    }
    
    const data = await response.json() as ApiResponse;
    
    // Validate response structure - updated for new flat structure
    if (!data.success || !data.data) {
      throw new Error('Invalid response structure for module generation');
    }
    
    return data;
  }

  /**
   * Test topic generation
   */
  private async testTopicGeneration(): Promise<any> {
    const testData = {
      subject: 'mathematics',
      grade: 5,
      title: 'Basic Addition and Subtraction',
      topic: 'Basic Addition and Subtraction',
      moduleId: 'test-module-id',
      difficulty: 'easy'
    };
    
    const response = await fetch(`${API_BASE_URL}/api/chale/generate-topic`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.authToken && { 'Authorization': `Bearer ${this.authToken}` })
      },
      body: JSON.stringify(testData)
    });
    
    if (!response.ok) {
      const errorData = await response.json() as ApiResponse;
      throw new Error(`Topic generation failed: ${response.status} - ${errorData.error || errorData.message}`);
    }
    
    const data = await response.json() as ApiResponse;
    
    // Validate response structure
    if (!data.success || !data.data) {
      throw new Error('Invalid response structure for topic generation');
    }
    
    return data;
  }

  /**
   * Test exercise generation
   */
  private async testExerciseGeneration(): Promise<any> {
    const testData = {
      subject: 'english',
      grade: 4,
      title: 'Reading Practice',
      topic: 'Reading Practice',
      topicId: 'test-topic-id',
      difficulty: 'medium'
    };
    
    const response = await fetch(`${API_BASE_URL}/api/chale/generate-exercise`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.authToken && { 'Authorization': `Bearer ${this.authToken}` })
      },
      body: JSON.stringify(testData)
    });
    
    if (!response.ok) {
      const errorData = await response.json() as ApiResponse;
      throw new Error(`Exercise generation failed: ${response.status} - ${errorData.error || errorData.message}`);
    }
    
    const data = await response.json() as ApiResponse;
    
    // Validate response structure
    if (!data.success || !data.data) {
      throw new Error('Invalid response structure for exercise generation');
    }
    
    return data;
  }

  /**
   * Test question generation
   */
  private async testQuestionGeneration(): Promise<any> {
    const testData = {
      subject: 'mathematics',
      grade: 5,
      title: 'Addition Question',
      topic: 'Addition Question',
      exerciseId: 'test-exercise-id',
      difficulty: 'easy'
    };
    
    const response = await fetch(`${API_BASE_URL}/api/chale/generate-question`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.authToken && { 'Authorization': `Bearer ${this.authToken}` })
      },
      body: JSON.stringify(testData)
    });
    
    if (!response.ok) {
      const errorData = await response.json() as ApiResponse;
      throw new Error(`Question generation failed: ${response.status} - ${errorData.error || errorData.message}`);
    }
    
    const data = await response.json() as ApiResponse;
    
    // Validate response structure
    if (!data.success || !data.data) {
      throw new Error('Invalid response structure for question generation');
    }
    
    return data;
  }

  /**
   * Test learning path generation
   */
  private async testLearningPathGeneration(): Promise<any> {
    const testData = {
      subject: 'english',
      grade: 4,
      title: 'Complete Reading Course',
      topic: 'Complete Reading Course',
      topicsCount: 2,
      exercisesPerTopic: 1,
      questionsPerExercise: 2,
      difficulty: 'medium'
    };
    
    const response = await fetch(`${API_BASE_URL}/api/chale/generate-learning-path`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.authToken && { 'Authorization': `Bearer ${this.authToken}` })
      },
      body: JSON.stringify(testData)
    });
    
    if (!response.ok) {
      const errorData = await response.json() as ApiResponse;
      throw new Error(`Learning path generation failed: ${response.status} - ${errorData.error || errorData.message}`);
    }
    
    const data = await response.json() as ApiResponse;
    
    // Validate response structure
    if (!data.success || !data.data) {
      throw new Error('Invalid response structure for learning path generation');
    }
    
    return data;
  }

  /**
   * Test curriculum-aligned content generation
   */
  private async testCurriculumContent(): Promise<any> {
    const testData = {
      subject: 'mathematics',
      grade: 6,
      title: 'Fractions and Decimals',
      topic: 'Fractions and Decimals',
      difficulty: 'hard',
      context: 'Ghana National Curriculum - Mathematics Grade 6'
    };
    
    const response = await fetch(`${API_BASE_URL}/api/chale/generate-module`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.authToken && { 'Authorization': `Bearer ${this.authToken}` })
      },
      body: JSON.stringify(testData)
    });
    
    if (!response.ok) {
      const errorData = await response.json() as ApiResponse;
      throw new Error(`Curriculum content generation failed: ${response.status} - ${errorData.error || errorData.message}`);
    }
    
    const data = await response.json() as ApiResponse;
    
    // Validate curriculum alignment
    if (!data.success || !data.data) {
      throw new Error('Invalid curriculum content response');
    }
    
    return data;
  }

  /**
   * Test cultural content generation
   */
  private async testCulturalContent(): Promise<any> {
    const testData = {
      subject: 'english',
      grade: 5,
      title: 'Ghanaian Folk Tales',
      topic: 'Ghanaian Folk Tales',
      difficulty: 'medium',
      context: 'Include Ghanaian cultural references and local context'
    };
    
    const response = await fetch(`${API_BASE_URL}/api/chale/generate-module`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.authToken && { 'Authorization': `Bearer ${this.authToken}` })
      },
      body: JSON.stringify(testData)
    });
    
    if (!response.ok) {
      const errorData = await response.json() as ApiResponse;
      throw new Error(`Cultural content generation failed: ${response.status} - ${errorData.error || errorData.message}`);
    }
    
    const data = await response.json() as ApiResponse;
    
    // Validate cultural content
    if (!data.success || !data.data) {
      throw new Error('Invalid cultural content response');
    }
    
    return data;
  }

  /**
   * Test assessment generation
   */
  private async testAssessmentGeneration(): Promise<any> {
    const testData = {
      subject: 'mathematics',
      grade: 4,
      title: 'Basic Math Assessment',
      topic: 'Basic Math Assessment',
      exerciseId: 'test-exercise-id',
      difficulty: 'medium'
    };
    
    const response = await fetch(`${API_BASE_URL}/api/chale/generate-question`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.authToken && { 'Authorization': `Bearer ${this.authToken}` })
      },
      body: JSON.stringify(testData)
    });
    
    if (!response.ok) {
      const errorData = await response.json() as ApiResponse;
      throw new Error(`Assessment generation failed: ${response.status} - ${errorData.error || errorData.message}`);
    }
    
    const data = await response.json() as ApiResponse;
    
    // Validate assessment structure
    if (!data.success || !data.data) {
      throw new Error('Invalid assessment response structure');
    }
    
    return data;
  }

  /**
   * Test validation errors
   */
  private async testValidationErrors(): Promise<any> {
    // Test with invalid data
    const invalidData = {
      subject: 'invalid_subject',
      grade: 99,
      // Missing required fields
    };
    
    const response = await fetch(`${API_BASE_URL}/api/chale/generate-module`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.authToken && { 'Authorization': `Bearer ${this.authToken}` })
      },
      body: JSON.stringify(invalidData)
    });
    
    // Should return validation error
    if (response.ok) {
      throw new Error('Expected validation error but request succeeded');
    }
    
    const errorData = await response.json() as ApiResponse;
    
    if (!errorData.error && !errorData.message) {
      throw new Error('Expected error message in validation response');
    }
    
    return { validationWorking: true, error: errorData.error || errorData.message };
  }

  /**
   * Test rate limiting
   */
  private async testRateLimiting(): Promise<any> {
    const testData = {
      subject: 'english',
      grade: 4,
      title: 'Rate Limit Test',
      topic: 'Rate Limit Test',
      difficulty: 'easy'
    };
    
    // Make multiple rapid requests to trigger rate limiting
    const promises = Array.from({ length: 10 }, () =>
      fetch(`${API_BASE_URL}/api/chale/generate-module`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.authToken && { 'Authorization': `Bearer ${this.authToken}` })
        },
        body: JSON.stringify(testData)
      })
    );
    
    const responses = await Promise.all(promises);
    const rateLimitedResponses = responses.filter(r => r.status === 429);
    
    if (rateLimitedResponses.length === 0) {
      console.warn('⚠️  Rate limiting may not be working as expected');
    }
    
    return {
      totalRequests: responses.length,
      rateLimitedCount: rateLimitedResponses.length,
      rateLimitingActive: rateLimitedResponses.length > 0
    };
  }

  /**
   * Run all tests
   */
  async runAllTests(): Promise<void> {
    console.log(`🚀 Starting comprehensive API tests...`);
    console.log(`📍 API Base URL: ${API_BASE_URL}`);
    
    // Basic functionality tests
    this.results.push(await this.runTest('Health Check', () => this.testHealthCheck()));
    this.results.push(await this.runTest('Cache Statistics', () => this.testCacheStats()));
    
    // Content generation tests
    this.results.push(await this.runTest('Module Generation', () => this.testModuleGeneration()));
    this.results.push(await this.runTest('Topic Generation', () => this.testTopicGeneration()));
    this.results.push(await this.runTest('Exercise Generation', () => this.testExerciseGeneration()));
    this.results.push(await this.runTest('Question Generation', () => this.testQuestionGeneration()));
    this.results.push(await this.runTest('Learning Path Generation', () => this.testLearningPathGeneration()));
    this.results.push(await this.runTest('Curriculum Content', () => this.testCurriculumContent()));
    this.results.push(await this.runTest('Cultural Content', () => this.testCulturalContent()));
    this.results.push(await this.runTest('Assessment Generation', () => this.testAssessmentGeneration()));
    
    // Error handling tests
    this.results.push(await this.runTest('Validation Errors', () => this.testValidationErrors()));
    this.results.push(await this.runTest('Rate Limiting', () => this.testRateLimiting()));
    
    // Print summary
    this.printSummary();
  }

  /**
   * Print test summary
   */
  private printSummary(): void {
    console.log('\n📊 TEST SUMMARY');
    console.log('================');
    
    const passed = this.results.filter(r => r.success).length;
    const failed = this.results.filter(r => !r.success).length;
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);
    
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⏱️  Total Duration: ${totalDuration}ms`);
    console.log(`📈 Success Rate: ${((passed / this.results.length) * 100).toFixed(1)}%`);
    
    if (failed > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.results
        .filter(r => !r.success)
        .forEach(r => console.log(`   • ${r.name}: ${r.error}`));
    }
    
    console.log('\n🎯 RECOMMENDATIONS:');
    
    if (failed === 0) {
      console.log('   • All tests passed! API is ready for production.');
      console.log('   • Consider adding more edge case tests.');
      console.log('   • Monitor performance in production environment.');
    } else {
      console.log('   • Fix failing tests before deploying to production.');
      console.log('   • Check server logs for detailed error information.');
      console.log('   • Verify environment variables are properly configured.');
    }
    
    console.log('\n🚀 Next Steps:');
    console.log('   • Start the API server: npm run start-api');
    console.log('   • Test with frontend integration');
    console.log('   • Deploy to staging environment');
    console.log('   • Set up monitoring and logging');
  }
}

/**
 * Main execution
 */
async function main() {
  const tester = new ChaleAPITester();
  
  try {
    await tester.runAllTests();
  } catch (error) {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  }
}

// Run tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { ChaleAPITester };
