/**
 * NAANO AI Agent - Main Export
 * Claude-powered educational assistant for Ghanaian primary students
 */

import { NAANOAgent } from './agent.js';
export { NAANOAgent } from './agent.js';
export * from './types.js';
export * from './config.js';

// Singleton instance for server use
let naanoInstance: NAANOAgent | null = null;

/**
 * Get or create the NAANO agent singleton instance
 */
export function getNAANOAgent(): NAANOAgent {
  if (!naanoInstance) {
    naanoInstance = new NAANOAgent();
  }
  return naanoInstance;
}

/**
 * Reset the NAANO agent instance (useful for testing or session reset)
 */
export function resetNAANOAgent(): void {
  if (naanoInstance) {
    naanoInstance.resetConversation();
    naanoInstance = null;
  }
}

/**
 * Create a new NAANO agent instance (for isolated conversations)
 */
export function createNAANOAgent() {
  return new NAANOAgent();
}
