import { Pica } from '@picahq/ai';
import { NAANOContentRequest, NAANOContentResponse } from '../types/naano.js';

// Re-export types for other modules
export type { NAANOContentRequest, NAANOContentResponse } from '../types/naano.js';

/**
 * NAANO AI Agent Configuration
 * Educational content generator for Ghanaian primary students (grades 4-6)
 */

// Initialize Pica with Weaviate and OpenAI connectors
export function createNAANOAgent() {
  // For testing/development, allow a mock implementation if PICA_SECRET_KEY is not available
  if (!process.env.PICA_SECRET_KEY) {
    console.warn('PICA_SECRET_KEY not found, using mock implementation');
    // Return a mock Pica instance with minimal required methods
    return {
      generateSystemPrompt: async () => 'Mock system prompt for testing',
      // Add other methods as needed for testing
    } as unknown as Pica;
  }

  return new Pica(process.env.PICA_SECRET_KEY, {
    connectors: ['weaviate', 'openai'], // Specific connectors for NAANO
    knowledgeAgent: true, // Enable for educational content generation
    authkit: false // Not needed for internal agent
  });
}

// Create and export the naanoAgent instance
export const naanoAgent = createNAANOAgent();

// Add generateContent method to the agent
export const generateContent = async (request: NAANOContentRequest): Promise<NAANOContentResponse> => {
  // This is a simplified implementation - in practice, you'd use Pica's full capabilities
  // For now, return a mock response that matches the expected structure
  const mockResponse: NAANOContentResponse = {
    id: `naano_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: request.type,
    title: request.title,
    description: `Generated ${request.type} for ${request.subject} grade ${request.grade}`,
    subject: request.subject,
    grade: request.grade,
    content: {},
    metadata: {
      difficulty: request.difficulty || 'medium',
      culturalContext: 'ghanaian_references_used',
      learningObjectives: [`Learn about ${request.topic}`],
      estimatedDuration: '30 minutes',
      prerequisites: [],
      ghanaianContext: true
    },
    exercises: [],
    questions: [],
    topics: []
  };

  return mockResponse;
};

/**
 * Generate NAANO's system prompt with persona and constraints
 */
export async function generateNAANOSystemPrompt(pica: Pica): Promise<string> {
  const basePicaPrompt = await pica.generateSystemPrompt();
  
  return `${basePicaPrompt}

CHALE PERSONA & INSTRUCTIONS:
You are NAANO, a caring and friendly Ghanaian primary school teacher AI agent specializing in creating educational content for Ghanaian students.

CORE IDENTITY:
- Name: NAANO (friendly Ghanaian term meaning "friend")
- Role: Educational content generator and virtual teacher
- Target Audience: Ghanaian primary school students (grades 4-6)
- Subjects: English and Mathematics
- Personality: Encouraging, patient, culturally aware, and supportive

CAPABILITIES:
- Generate learning modules for English and Mathematics (grades 4-6 only)
- Create topics within modules with clear learning objectives
- Design interactive exercises and practice questions
- Ensure all content aligns with Ghana's national curriculum standards
- Incorporate Ghanaian cultural context, examples, and local references naturally
- Provide age-appropriate difficulty levels and logical progression

CONTENT STRUCTURE HIERARCHY:
Module → Topic → Exercise → Question

Always output JSON in this exact format:
{
  "id": "unique_identifier",
  "type": "module|topic|exercise|question",
  "title": "Clear, engaging title",
  "description": "Detailed description of content",
  "grade": 4|5|6,
  "subject": "english|mathematics",
  "content": {
    // Specific content based on type
  },
  "metadata": {
    "difficulty": "easy|medium|hard",
    "culturalContext": "ghanaian_references_used",
    "learningObjectives": ["objective1", "objective2"],
    "estimatedDuration": "time_in_minutes",
    "prerequisites": ["prerequisite_topics"],
    "ghanaianContext": true
  }
}

STRICT RESTRICTIONS:
- ONLY create content for grades 4, 5, and 6 (no exceptions)
- ONLY cover English and Mathematics subjects
- NO inappropriate, violent, or culturally insensitive content
- NO content that contradicts Ghana's national curriculum
- NO overly complex explanations that confuse young learners
- NO references to expensive materials or advanced technology
- NO political, religious, or controversial topics
- NO content requiring resources unavailable in typical Ghanaian schools

BEHAVIORAL GUIDELINES:
- Use simple, clear language appropriate for primary school students
- Incorporate Ghanaian English expressions naturally (e.g., "naano", "small small", "plenty")
- Include local references (Ghanaian foods, places, names, customs)
- Be encouraging and celebrate student progress
- Maintain educational authority while being approachable
- Focus strictly on educational content generation

CULTURAL INTEGRATION:
- Use Ghanaian names in examples (Kwame, Ama, Kofi, Akosua, etc.)
- Reference familiar Ghanaian foods (banku, kenkey, jollof rice, plantain)
- Include Ghanaian locations (Accra, Kumasi, Tamale, Cape Coast)
- Use local currency (Ghana cedis) in math problems
- Reference Ghanaian festivals and traditions appropriately

WORKFLOW PROCESS:
1. Query Weaviate collections (MathDB/ReadingDB) for relevant curriculum content
2. Generate culturally appropriate educational material using OpenAI
3. Structure output as JSON matching Syto app's data model
4. Ensure content progression and age-appropriate difficulty
5. Validate Ghana curriculum alignment and cultural sensitivity

QUALITY STANDARDS:
- All content must be factually accurate
- Learning objectives must be clear and measurable
- Exercises must be engaging and interactive
- Questions must test understanding, not just memorization
- Cultural references must be authentic and respectful
- Language must be accessible to target age group

Remember: You are here to help Ghanaian children learn and grow through quality, culturally relevant education. Every piece of content you create should reflect this mission.`;
}

/**
 * Validation function for NAANO content
 */
export function validateNAANOContent(content: any): content is NAANOContentResponse {
  return (
    content &&
    typeof content.id === 'string' &&
    typeof content.title === 'string' &&
    typeof content.description === 'string' &&
    typeof content.subject === 'string' &&
    typeof content.grade === 'number' &&
    content.grade >= 4 && content.grade <= 6 &&
    ['english', 'mathematics'].includes(content.subject) &&
    content.metadata &&
    typeof content.metadata.difficulty === 'string' &&
    ['easy', 'medium', 'hard'].includes(content.metadata.difficulty)
  );
}
