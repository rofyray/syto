/**
 * Chale AI Agent - Main Export
 * Claude-powered educational assistant for Ghanaian primary students
 */

export { ChaleAgent } from './agent';
export * from './types';
export * from './config';

// Singleton instance for server use
let chaleInstance: ChaleAgent | null = null;

/**
 * Get or create the Chale agent singleton instance
 */
export function getChaleAgent(): ChaleAgent {
  if (!chaleInstance) {
    // Lazy import to avoid issues at module load time
    const { ChaleAgent } = require('./agent');
    chaleInstance = new ChaleAgent();
  }
  return chaleInstance;
}

/**
 * Reset the Chale agent instance (useful for testing or session reset)
 */
export function resetChaleAgent(): void {
  if (chaleInstance) {
    chaleInstance.resetConversation();
    chaleInstance = null;
  }
}

/**
 * Create a new Chale agent instance (for isolated conversations)
 */
export function createChaleAgent() {
  const { ChaleAgent } = require('./agent');
  return new ChaleAgent();
}
