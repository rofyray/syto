/**
 * NAANO AI Agent Configuration
 * Centralized configuration for the Claude-powered NAANO agent
 */

export const NAANO_CONFIG = {
  // Model configuration
  models: {
    // For structured output: question generation, answer validation
    primary: 'claude-sonnet-4-6-20250514',
    // For streaming text: chat, explanations
    fast: 'claude-haiku-4-5-20251001',
  },
  maxTokens: 4096,
  temperature: 0.7,

  // Tool configuration
  tools: {
    curriculumSearch: {
      enabled: true,
      maxResults: 5,
      description: 'Search Ghana national curriculum database for relevant educational content',
    },
    questionGenerator: {
      enabled: true,
      defaultCount: 5,
      culturalContextRequired: true,
      description: 'Generate curriculum-aligned multiple-choice questions with Ghanaian context',
    },
    progressTracker: {
      enabled: true,
      description: 'Record student learning progress in the database',
    },
  },

  // Streaming configuration
  streaming: {
    enabled: true,
    chunkSize: 100,
  },

  // Validation rules
  validation: {
    enforceGradeLevel: true,
    allowedGrades: [4, 5, 6],
    enforceSubjects: true,
    allowedSubjects: ['english', 'mathematics'],
    culturalContextRequired: true,
  },

  // Ghana-specific context
  cultural: {
    requiredElements: ['names', 'locations', 'currency', 'foods'],
    ghanaianNames: {
      boys: ['Kwame', 'Kofi', 'Yaw', 'Kwesi', 'Kwaku', 'Fiifi', 'Ebo', 'Kwabena'],
      girls: ['Ama', 'Akosua', 'Abena', 'Yaa', 'Efua', 'Esi', 'Adjoa', 'Afia'],
    },
    locations: ['Accra', 'Kumasi', 'Tamale', 'Cape Coast', 'Takoradi', 'Makola Market', 'Kwame Nkrumah Circle'],
    foods: ['banku', 'kenkey', 'fufu', 'jollof rice', 'waakye', 'plantain', 'groundnut soup', 'red red'],
    currency: 'GH₵',
  },

  // Error handling
  errorHandling: {
    maxRetries: 3,
    retryDelay: 1000, // ms
    fallbackResponses: true,
  },

  // Performance
  performance: {
    enableCaching: true,
    cacheTTL: 3600, // 1 hour in seconds
    enableRateLimiting: true,
    maxRequestsPerMinute: 60,
  },
} as const;

// Type for the config
export type NAANOConfig = typeof NAANO_CONFIG;

// Validation helper
export function validateNAANOConfig(): boolean {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    console.error('❌ ANTHROPIC_API_KEY is not set in environment variables');
    return false;
  }

  if (!apiKey.startsWith('sk-ant-')) {
    console.error('❌ ANTHROPIC_API_KEY appears to be invalid (should start with sk-ant-)');
    return false;
  }

  console.log('✅ NAANO configuration validated successfully');
  return true;
}

// Get curriculum context requirements for a subject
export function getCurriculumRequirements(subject: 'english' | 'mathematics', grade: number) {
  const baseRequirements = {
    subject,
    grade,
    culturalContext: NAANO_CONFIG.cultural,
  };

  if (subject === 'mathematics') {
    return {
      ...baseRequirements,
      focusAreas: ['number operations', 'fractions', 'geometry', 'word problems', 'measurements'],
      exampleTypes: ['practical applications', 'market scenarios', 'money calculations'],
    };
  } else {
    return {
      ...baseRequirements,
      focusAreas: ['reading comprehension', 'grammar', 'vocabulary', 'writing skills', 'oral expression'],
      exampleTypes: ['Ghanaian folk tales', 'local contexts', 'cultural stories'],
    };
  }
}
