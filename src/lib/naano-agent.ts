import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { createNAANOAgent, generateNAANOSystemPrompt, NAANOContentRequest, NAANOContentResponse, validateNAANOContent } from './naano-config.js';
import { getCurriculumContext } from './weaviate-client.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Core NAANO AI Agent Implementation
 * Educational content generator using Pica OneTool framework
 */

export class NAANOAgent {
  private pica: any;
  private systemPrompt: string | null = null;

  constructor() {
    this.pica = createNAANOAgent();
  }

  /**
   * Initialize the agent with system prompt
   */
  async initialize(): Promise<void> {
    if (!this.systemPrompt) {
      this.systemPrompt = await generateNAANOSystemPrompt(this.pica);
    }
  }

  /**
   * Generate educational content using Pica OneTool
   */
  async generateContent(request: NAANOContentRequest): Promise<NAANOContentResponse> {
    await this.initialize();

    try {
      // Get curriculum context from Weaviate
      const curriculumContext = await getCurriculumContext(
        request.subject,
        request.grade,
        request.topic || `${request.subject} ${request.type}`
      );

      // Construct the generation prompt
      const prompt = this.buildGenerationPrompt(request, curriculumContext);

      // Generate content using OpenAI through Pica OneTool
      const { text } = await generateText({
        model: openai('gpt-4o'),
        system: this.systemPrompt!,
        tools: { ...this.pica.oneTool },
        prompt,
        maxSteps: 10,
        temperature: 0.7, // Balanced creativity for educational content
      });

      // Parse and validate the generated content
      const generatedContent = this.parseGeneratedContent(text);
      
      if (!validateNAANOContent(generatedContent)) {
        throw new Error('Generated content does not meet NAANO standards');
      }

      return generatedContent;

    } catch (error) {
      console.error('Error generating content with NAANO:', error);
      throw new Error(`Failed to generate ${request.type} content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Build the generation prompt based on request and curriculum context
   */
  private buildGenerationPrompt(request: NAANOContentRequest, curriculumContext: string): string {
    const basePrompt = `Generate a ${request.type} for ${request.subject} grade ${request.grade}.`;
    
    let specificInstructions = '';
    
    switch (request.type) {
      case 'module':
        specificInstructions = `
Create a complete learning module that includes:
- Clear module title and description
- Learning objectives aligned with Ghana curriculum
- Overview of topics to be covered
- Estimated duration for completion
- Prerequisites and expected outcomes
- Ghanaian cultural context integration`;
        break;
        
      case 'topic':
        specificInstructions = `
Create a topic within a module that includes:
- Engaging topic title and clear description
- Specific learning objectives
- Key concepts to be taught
- Connection to real-world Ghanaian examples
- Preparation for related exercises`;
        break;
        
      case 'exercise':
        specificInstructions = `
Create an interactive exercise that includes:
- Clear exercise title and instructions
- Step-by-step activities for students
- Practice problems or tasks
- Expected learning outcomes
- Assessment criteria
- Ghanaian context in examples`;
        break;
        
      case 'question':
        specificInstructions = `
Create an educational question that includes:
- Clear, age-appropriate question text
- Multiple choice options (if applicable)
- Correct answer with explanation
- Difficulty level appropriate for grade ${request.grade}
- Ghanaian cultural context in the scenario`;
        break;
    }

    const difficultyInstruction = request.difficulty 
      ? `The difficulty level should be ${request.difficulty}.` 
      : `The difficulty should be appropriate for grade ${request.grade} students.`;

    const topicInstruction = request.topic 
      ? `Focus specifically on the topic: "${request.topic}".` 
      : '';

    return `${basePrompt}

${specificInstructions}

${difficultyInstruction}
${topicInstruction}

CURRICULUM CONTEXT:
${curriculumContext}

IMPORTANT REQUIREMENTS:
1. Output MUST be valid JSON matching the NAANOContentResponse format
2. Include authentic Ghanaian cultural references
3. Use age-appropriate language for grade ${request.grade}
4. Align with Ghana's national curriculum standards
5. Ensure educational value and engagement
6. Generate a unique ID for the content

Generate the content now as a JSON object:`;
  }

  /**
   * Parse and clean the generated content
   */
  private parseGeneratedContent(text: string): NAANOContentResponse {
    try {
      // Clean the text to extract JSON
      let cleanedText = text.trim();
      
      // Remove any markdown code blocks
      cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      
      // Find JSON object in the text
      const jsonStart = cleanedText.indexOf('{');
      const jsonEnd = cleanedText.lastIndexOf('}') + 1;
      
      if (jsonStart === -1 || jsonEnd === 0) {
        throw new Error('No valid JSON found in generated content');
      }
      
      const jsonText = cleanedText.substring(jsonStart, jsonEnd);
      const parsed = JSON.parse(jsonText);
      
      // Ensure ID is present
      if (!parsed.id) {
        parsed.id = uuidv4();
      }
      
      return parsed;
      
    } catch (error) {
      console.error('Error parsing generated content:', error);
      console.error('Raw text:', text);
      throw new Error('Failed to parse generated content as valid JSON');
    }
  }

  /**
   * Generate multiple content items in batch
   */
  async generateBatch(requests: NAANOContentRequest[]): Promise<NAANOContentResponse[]> {
    const results: NAANOContentResponse[] = [];
    
    for (const request of requests) {
      try {
        const content = await this.generateContent(request);
        results.push(content);
        
        // Add small delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`Failed to generate content for request:`, request, error);
        // Continue with other requests even if one fails
      }
    }
    
    return results;
  }

  /**
   * Validate content against Ghana curriculum standards
   */
  async validateContent(content: NAANOContentResponse): Promise<boolean> {
    try {
      // Basic validation checks
      const basicValidation = validateNAANOContent(content);
      if (!basicValidation) {
        return false;
      }

      // Additional curriculum-specific validation
      const curriculumValidation = await this.validateAgainstCurriculum(content);
      
      return curriculumValidation;
      
    } catch (error) {
      console.error('Error validating content:', error);
      return false;
    }
  }

  /**
   * Validate content against curriculum standards
   */
  private async validateAgainstCurriculum(content: NAANOContentResponse): Promise<boolean> {
    try {
      // Get relevant curriculum context
      const curriculumContext = await getCurriculumContext(
        content.subject,
        content.grade,
        content.title
      );

      // Use AI to validate alignment with curriculum
      const validationPrompt = `
Validate if this educational content aligns with Ghana's national curriculum for ${content.subject} grade ${content.grade}:

CONTENT TO VALIDATE:
${JSON.stringify(content, null, 2)}

CURRICULUM CONTEXT:
${curriculumContext}

Respond with only "VALID" or "INVALID" followed by a brief reason.`;

      const { text } = await generateText({
        model: openai('gpt-4o'),
        system: 'You are an expert in Ghana\'s national curriculum standards. Validate educational content for alignment.',
        prompt: validationPrompt,
        temperature: 0.1, // Low temperature for consistent validation
      });

      return text.trim().toUpperCase().startsWith('VALID');
      
    } catch (error) {
      console.error('Error in curriculum validation:', error);
      return false; // Fail safe - reject if validation fails
    }
  }
}

// Export singleton instance
export const naanoAgent = new NAANOAgent();
