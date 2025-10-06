import Anthropic from '@anthropic-ai/sdk';
import { CHALE_BASE_SYSTEM_PROMPT, QUESTION_GENERATION_PROMPT, CHAT_TUTOR_PROMPT, CONCEPT_EXPLANATION_PROMPT } from './prompts/base-system-prompt';
import { CHALE_CONFIG, validateNAANOConfig } from './config';
import { curriculumSearchTool, handleCurriculumSearch } from './tools/curriculum-search';
import { questionGeneratorTool, handleQuestionGeneration } from './tools/question-generator';
import { progressTrackerTool, handleProgressTracking, getStudentProgressTool, handleGetStudentProgress } from './tools/supabase-tools';
import type { NAANORequest, NAANOResponse, AnthropicMessageParam, AnthropicToolUseBlock, AnthropicTextBlock } from './types';

/**
 * NAANO AI Agent
 * Claude-powered educational assistant for Ghanaian primary students
 */
export class NAANOAgent {
  private client: Anthropic;
  private conversationHistory: AnthropicMessageParam[] = [];
  private systemPrompt: string;

  constructor() {
    // Validate configuration
    if (!validateNAANOConfig()) {
      throw new Error('Invalid NAANO configuration. Please check environment variables.');
    }

    // Initialize Anthropic client
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    });

    // Set base system prompt
    this.systemPrompt = CHALE_BASE_SYSTEM_PROMPT;
  }

  /**
   * Process a request with NAANO (non-streaming)
   */
  async processRequest(request: NAANORequest): Promise<NAANOResponse> {
    const startTime = Date.now();
    const toolsUsed: string[] = [];

    // Customize system prompt based on request type
    const systemPrompt = this.getSystemPrompt(request.type);

    // Add user message to history
    this.conversationHistory.push({
      role: 'user',
      content: request.content,
    });

    // Create message with tools
    let response = await this.client.messages.create({
      model: CHALE_CONFIG.model,
      max_tokens: CHALE_CONFIG.maxTokens,
      temperature: CHALE_CONFIG.temperature,
      system: systemPrompt,
      messages: this.conversationHistory,
      tools: this.getEnabledTools(),
    });

    // Handle tool calls in a loop
    while (response.stop_reason === 'tool_use') {
      const toolUseBlock = response.content.find(
        (block) => block.type === 'tool_use'
      ) as AnthropicToolUseBlock | undefined;

      if (!toolUseBlock) break;

      toolsUsed.push(toolUseBlock.name);

      // Execute tool
      const toolResult = await this.executeTool(toolUseBlock.name, toolUseBlock.input);

      // Add assistant response and tool result to history
      this.conversationHistory.push({
        role: 'assistant',
        content: response.content,
      });

      this.conversationHistory.push({
        role: 'user',
        content: [
          {
            type: 'tool_result',
            tool_use_id: toolUseBlock.id,
            content: toolResult,
          },
        ],
      });

      // Continue conversation with tool result
      response = await this.client.messages.create({
        model: CHALE_CONFIG.model,
        max_tokens: CHALE_CONFIG.maxTokens,
        temperature: CHALE_CONFIG.temperature,
        system: systemPrompt,
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
  }

  /**
   * Process request with streaming
   */
  async *processRequestStream(request: NAANORequest): AsyncGenerator<string> {
    // Customize system prompt based on request type
    const systemPrompt = this.getSystemPrompt(request.type);

    // Add user message to history
    this.conversationHistory.push({
      role: 'user',
      content: request.content,
    });

    // Stream the response
    const stream = this.client.messages.stream({
      model: CHALE_CONFIG.model,
      max_tokens: CHALE_CONFIG.maxTokens,
      temperature: CHALE_CONFIG.temperature,
      system: systemPrompt,
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

    if (CHALE_CONFIG.tools.curriculumSearch.enabled) {
      tools.push(curriculumSearchTool);
    }

    if (CHALE_CONFIG.tools.questionGenerator.enabled) {
      tools.push(questionGeneratorTool);
    }

    if (CHALE_CONFIG.tools.progressTracker.enabled) {
      tools.push(progressTrackerTool);
      tools.push(getStudentProgressTool);
    }

    return tools;
  }

  /**
   * Get system prompt based on request type
   */
  private getSystemPrompt(requestType: NAANORequest['type']): string {
    switch (requestType) {
      case 'generate_questions':
        return `${CHALE_BASE_SYSTEM_PROMPT}\n\n${QUESTION_GENERATION_PROMPT}`;
      case 'chat':
        return `${CHALE_BASE_SYSTEM_PROMPT}\n\n${CHAT_TUTOR_PROMPT}`;
      case 'explain_concept':
        return `${CHALE_BASE_SYSTEM_PROMPT}\n\n${CONCEPT_EXPLANATION_PROMPT}`;
      default:
        return CHALE_BASE_SYSTEM_PROMPT;
    }
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
