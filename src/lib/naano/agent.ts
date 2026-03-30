import Anthropic from '@anthropic-ai/sdk';
import { NAANO_BASE_SYSTEM_PROMPT, QUESTION_GENERATION_PROMPT, CHAT_TUTOR_PROMPT, CONCEPT_EXPLANATION_PROMPT } from './prompts/base-system-prompt.js';
import { NAANO_CONFIG, validateNAANOConfig } from './config.js';
import { curriculumSearchTool, handleCurriculumSearch } from './tools/curriculum-search.js';
import { questionGeneratorTool, handleQuestionGeneration } from './tools/question-generator.js';
import { progressTrackerTool, handleProgressTracking, getStudentProgressTool, handleGetStudentProgress } from './tools/supabase-tools.js';
import type { NAANORequest, NAANOResponse, AnthropicMessageParam, AnthropicToolUseBlock, AnthropicTextBlock } from './types.js';

/**
 * NAANO AI Agent
 * Claude-powered educational assistant for Ghanaian primary students
 */
interface StudentContext {
  studentName: string;
  grade: number;
  curriculumSummary: string;
}

interface ModuleWithTopics {
  title: string;
  topics?: { title: string }[];
}

export class NAANOAgent {
  private client: Anthropic;
  private conversationHistory: AnthropicMessageParam[] = [];
  private systemPrompt: string;
  private studentContext?: StudentContext;

  constructor(private modelOverride?: string) {
    // Validate configuration
    if (!validateNAANOConfig()) {
      throw new Error('Invalid NAANO configuration. Please check environment variables.');
    }

    // Initialize Anthropic client with timeout and retries
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
      timeout: 23_000,
      maxRetries: NAANO_CONFIG.errorHandling.maxRetries,
    });

    // Set base system prompt
    this.systemPrompt = NAANO_BASE_SYSTEM_PROMPT;
  }

  /**
   * Get the appropriate model for a given request type
   * Primary (Sonnet 4.6): structured output, question generation, validation
   * Fast (Haiku 4.5): chat, explanations, streaming text
   */
  private getModel(requestType: NAANORequest['type']): string {
    if (this.modelOverride) return this.modelOverride;
    switch (requestType) {
      case 'generate_questions':
      case 'validate_answer':
        return NAANO_CONFIG.models.primary;
      default:
        return NAANO_CONFIG.models.fast;
    }
  }

  /**
   * Get the appropriate max_tokens for a given request type
   */
  private getMaxTokens(requestType: NAANORequest['type']): number {
    return NAANO_CONFIG.maxTokensByType[requestType] || NAANO_CONFIG.maxTokens;
  }

  /**
   * Set student context (name, grade, curriculum) for personalized responses
   */
  setStudentContext(ctx: {
    studentName: string;
    grade: number;
    mathModules: ModuleWithTopics[];
    englishModules: ModuleWithTopics[];
  }): void {
    const formatModules = (modules: ModuleWithTopics[]) =>
      modules.map(m => {
        const topicNames = m.topics?.map(t => t.title).join(', ') || 'No topics';
        return `  - ${m.title}: ${topicNames}`;
      }).join('\n');

    const mathSection = formatModules(ctx.mathModules) || '  (none available)';
    const englishSection = formatModules(ctx.englishModules) || '  (none available)';

    this.studentContext = {
      studentName: ctx.studentName,
      grade: ctx.grade,
      curriculumSummary: `Mathematics modules:\n${mathSection}\n\nEnglish modules:\n${englishSection}`,
    };
  }

  /**
   * Get system prompt as content blocks with cache_control
   * Base prompt is cached (ephemeral, 5-min TTL) to reduce input token costs
   */
  private getSystemPromptBlocks(requestType: NAANORequest['type']): Anthropic.TextBlockParam[] {
    const baseBlock: Anthropic.TextBlockParam = {
      type: 'text',
      text: NAANO_BASE_SYSTEM_PROMPT,
      cache_control: { type: 'ephemeral', ttl: '1h' },
    };

    let rolePrompt: string;
    switch (requestType) {
      case 'generate_questions':
        rolePrompt = QUESTION_GENERATION_PROMPT;
        break;
      case 'chat':
        rolePrompt = CHAT_TUTOR_PROMPT;
        break;
      case 'explain_concept':
        rolePrompt = CONCEPT_EXPLANATION_PROMPT;
        break;
      default:
        return [baseBlock];
    }

    const blocks: Anthropic.TextBlockParam[] = [
      baseBlock,
      { type: 'text', text: rolePrompt },
    ];

    if (this.studentContext) {
      blocks.push({
        type: 'text',
        text: `## CURRENT STUDENT CONTEXT
You are currently helping ${this.studentContext.studentName}, a Primary ${this.studentContext.grade} student.
Do NOT ask the student what grade they are in — you already know they are in Primary ${this.studentContext.grade}.
Address them by name occasionally to make the conversation personal.

## AVAILABLE CURRICULUM FOR PRIMARY ${this.studentContext.grade}
The following modules and topics are available in the student's curriculum. Use this to guide your responses and keep content at the appropriate level:

${this.studentContext.curriculumSummary}

When suggesting topics to study or offering practice, refer to these specific modules and topics.`,
      });
    }

    return blocks;
  }

  /**
   * Process a request with NAANO (non-streaming)
   */
  async processRequest(request: NAANORequest): Promise<NAANOResponse> {
    const startTime = Date.now();
    const toolsUsed: string[] = [];

    try {
      // Get model and system prompt blocks for this request type
      const model = this.getModel(request.type);
      const systemBlocks = this.getSystemPromptBlocks(request.type);

      // Add user message to history
      this.conversationHistory.push({
        role: 'user',
        content: request.content,
      });

      // Create message with tools
      let response = await this.client.messages.create({
        model,
        max_tokens: NAANO_CONFIG.maxTokens,
        temperature: NAANO_CONFIG.temperature,
        system: systemBlocks,
        messages: this.conversationHistory,
        tools: this.getEnabledTools(),
      });

      // Handle tool calls in a loop
      while (response.stop_reason === 'tool_use') {
        const toolUseBlocks = response.content.filter(
          (block) => block.type === 'tool_use'
        ) as AnthropicToolUseBlock[];

        if (toolUseBlocks.length === 0) break;

        // Execute all tools and collect results
        const toolResults = [];
        for (const toolUseBlock of toolUseBlocks) {
          toolsUsed.push(toolUseBlock.name);
          const toolResult = await this.executeTool(toolUseBlock.name, toolUseBlock.input);
          toolResults.push({
            type: 'tool_result' as const,
            tool_use_id: toolUseBlock.id,
            content: toolResult,
          });
        }

        // Add assistant response and ALL tool results to history
        this.conversationHistory.push({
          role: 'assistant',
          content: response.content,
        });

        this.conversationHistory.push({
          role: 'user',
          content: toolResults,
        });

        // Continue conversation with tool results
        response = await this.client.messages.create({
          model,
          max_tokens: NAANO_CONFIG.maxTokens,
          temperature: NAANO_CONFIG.temperature,
          system: systemBlocks,
          messages: this.conversationHistory,
          tools: this.getEnabledTools(),
        });
      }

      // Extract final text response
      const textBlock = response.content.find(
        (block) => block.type === 'text'
      ) as AnthropicTextBlock | undefined;

      const processingTime = Date.now() - startTime;

      // Add assistant's final response to history
      this.conversationHistory.push({
        role: 'assistant',
        content: response.content,
      });

      return {
        id: response.id,
        type: this.mapRequestTypeToResponseType(request.type),
        content: textBlock?.text || '',
        metadata: {
          modelUsed: response.model,
          tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
          processingTime,
          toolsUsed,
        },
      };
    } catch (error) {
      // If an error occurs, reset conversation to avoid corrupted state
      console.error('Error in processRequest, resetting conversation:', error);
      this.resetConversation();
      throw error;
    }
  }

  /**
   * Generate a response without tools (single LLM call, no tool use loop).
   * Used for question generation where curriculum context is pre-fetched.
   */
  async generateDirect(content: string, requestType: NAANORequest['type'] = 'generate_questions'): Promise<NAANOResponse> {
    const startTime = Date.now();
    const model = this.getModel(requestType);
    const systemBlocks = this.getSystemPromptBlocks(requestType);

    const maxTokens = this.getMaxTokens(requestType);

    const response = await this.client.messages.create({
      model,
      max_tokens: maxTokens,
      temperature: NAANO_CONFIG.temperature,
      system: systemBlocks,
      messages: [{ role: 'user', content }],
    });

    const textBlock = response.content.find(
      (block) => block.type === 'text'
    ) as AnthropicTextBlock | undefined;

    return {
      id: response.id,
      type: this.mapRequestTypeToResponseType(requestType),
      content: textBlock?.text || '',
      metadata: {
        modelUsed: response.model,
        tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
        processingTime: Date.now() - startTime,
        toolsUsed: [],
      },
    };
  }

  /**
   * Generate a response without tools, streaming text chunks.
   * Used for question generation to enable progressive delivery.
   */
  async *generateDirectStream(content: string, requestType: NAANORequest['type'] = 'generate_questions'): AsyncGenerator<string> {
    const model = this.getModel(requestType);
    const systemBlocks = this.getSystemPromptBlocks(requestType);
    const maxTokens = this.getMaxTokens(requestType);

    const stream = this.client.messages.stream({
      model,
      max_tokens: maxTokens,
      temperature: NAANO_CONFIG.temperature,
      system: systemBlocks,
      messages: [{ role: 'user', content }],
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        yield event.delta.text;
      }
    }
  }

  /**
   * Process request with streaming
   */
  async *processRequestStream(request: NAANORequest): AsyncGenerator<string> {
    // Get model and system prompt blocks for this request type
    const model = this.getModel(request.type);
    const systemBlocks = this.getSystemPromptBlocks(request.type);

    // Add user message to history
    this.conversationHistory.push({
      role: 'user',
      content: request.content,
    });

    try {
      // Stream the response
      const stream = this.client.messages.stream({
        model,
        max_tokens: NAANO_CONFIG.maxTokens,
        temperature: NAANO_CONFIG.temperature,
        system: systemBlocks,
        messages: this.conversationHistory,
        tools: this.getEnabledTools(),
      });

      for await (const event of stream) {
        if (event.type === 'content_block_delta') {
          if (event.delta.type === 'text_delta') {
            yield event.delta.text;
          }
        }

        // Handle tool use
        if (event.type === 'content_block_start' && event.content_block.type === 'tool_use') {
          const toolBlock = event.content_block as AnthropicToolUseBlock;
          // Tool execution would need to be handled separately
          console.log(`Tool called: ${toolBlock.name}`);
        }
      }

      // Get the final message
      const finalMessage = await stream.finalMessage();

      // Add to history
      this.conversationHistory.push({
        role: 'assistant',
        content: finalMessage.content,
      });
    } catch (error) {
      console.error('Error in processRequestStream:', error);
      this.resetConversation();
      throw error;
    }
  }

  /**
   * Execute a tool based on its name
   */
  private async executeTool(toolName: string, input: unknown): Promise<string> {
    try {
      switch (toolName) {
        case 'search_curriculum':
          return await handleCurriculumSearch(input);
        case 'generate_questions':
          return await handleQuestionGeneration(input);
        case 'track_progress':
          return await handleProgressTracking(input);
        case 'get_student_progress':
          return await handleGetStudentProgress(input);
        default:
          return JSON.stringify({ error: `Unknown tool: ${toolName}` });
      }
    } catch (error) {
      console.error(`Error executing tool ${toolName}:`, error);
      return JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get enabled tools based on configuration
   */
  private getEnabledTools(): Anthropic.Tool[] {
    const tools: Anthropic.Tool[] = [];

    if (NAANO_CONFIG.tools.curriculumSearch.enabled) {
      tools.push(curriculumSearchTool);
    }

    if (NAANO_CONFIG.tools.questionGenerator.enabled) {
      tools.push(questionGeneratorTool);
    }

    if (NAANO_CONFIG.tools.progressTracker.enabled) {
      tools.push(progressTrackerTool);
      tools.push(getStudentProgressTool);
    }

    return tools;
  }

  /**
   * Map request type to response type
   */
  private mapRequestTypeToResponseType(
    requestType: NAANORequest['type']
  ): NAANOResponse['type'] {
    switch (requestType) {
      case 'generate_questions':
        return 'questions';
      case 'explain_concept':
        return 'explanation';
      case 'validate_answer':
        return 'validation';
      default:
        return 'chat';
    }
  }

  /**
   * Reset conversation history
   */
  resetConversation(): void {
    this.conversationHistory = [];
  }

  /**
   * Get conversation history
   */
  getConversationHistory(): AnthropicMessageParam[] {
    return [...this.conversationHistory];
  }

  /**
   * Set custom system prompt (advanced usage)
   */
  setSystemPrompt(prompt: string): void {
    this.systemPrompt = prompt;
  }
}
