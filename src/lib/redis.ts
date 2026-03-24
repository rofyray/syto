/**
 * Upstash Redis Client
 * Serverless-native Redis for caching embeddings, search results, and API responses.
 * Uses HTTP-based client — no persistent TCP connections, works on Netlify Functions.
 */

import { Redis } from '@upstash/redis';

let redisClient: Redis | null = null;

/**
 * Get or create the Redis client singleton
 */
export function getRedisClient(): Redis | null {
  if (redisClient) return redisClient;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.warn('Upstash Redis not configured (UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN missing). Caching disabled.');
    return null;
  }

  redisClient = new Redis({ url, token });
  return redisClient;
}

// ============================================================================
// TYPED CACHE HELPERS
// ============================================================================

/**
 * Get a cached value by key. Returns null on miss or if Redis is unavailable.
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  const redis = getRedisClient();
  if (!redis) return null;

  try {
    const value = await redis.get<T>(key);
    return value;
  } catch (error) {
    console.error(`Redis GET error for key ${key}:`, error);
    return null;
  }
}

/**
 * Set a cached value with TTL (in seconds).
 */
export async function cacheSet<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;

  try {
    await redis.set(key, value, { ex: ttlSeconds });
  } catch (error) {
    console.error(`Redis SET error for key ${key}:`, error);
  }
}

/**
 * Delete a cached value.
 */
export async function cacheDel(key: string): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;

  try {
    await redis.del(key);
  } catch (error) {
    console.error(`Redis DEL error for key ${key}:`, error);
  }
}

// ============================================================================
// EMBEDDING CACHE
// ============================================================================

const EMBEDDING_TTL = 86400; // 24 hours

/**
 * Generate a cache key for an embedding query
 */
function embeddingKey(text: string): string {
  // Use a simple hash for the key — we import createHash in curriculum-search
  // Here we use a simpler approach since we're just building keys
  const hash = Buffer.from(text).toString('base64url').slice(0, 64);
  return `emb:${hash}`;
}

/**
 * Get cached embedding for a query string
 */
export async function getCachedEmbedding(text: string): Promise<number[] | null> {
  return cacheGet<number[]>(embeddingKey(text));
}

/**
 * Cache an embedding for a query string
 */
export async function setCachedEmbedding(text: string, embedding: number[]): Promise<void> {
  await cacheSet(embeddingKey(text), embedding, EMBEDDING_TTL);
}

// ============================================================================
// CURRICULUM SEARCH RESULTS CACHE
// ============================================================================

const SEARCH_RESULTS_TTL = 14400; // 4 hours

/**
 * Generate a cache key for curriculum search results
 */
function searchResultsKey(subject: string, grade: number, query: string): string {
  const hash = Buffer.from(query).toString('base64url').slice(0, 64);
  return `curr:${subject}:${grade}:${hash}`;
}

/**
 * Get cached curriculum search results
 */
export async function getCachedSearchResults<T>(
  subject: string,
  grade: number,
  query: string
): Promise<T | null> {
  return cacheGet<T>(searchResultsKey(subject, grade, query));
}

/**
 * Cache curriculum search results
 */
export async function setCachedSearchResults<T>(
  subject: string,
  grade: number,
  query: string,
  results: T
): Promise<void> {
  await cacheSet(searchResultsKey(subject, grade, query), results, SEARCH_RESULTS_TTL);
}

// ============================================================================
// TRANSLATION CACHE (Khaya AI)
// ============================================================================

const TRANSLATION_TTL = 86400; // 24 hours

function translationKey(text: string, lang: string): string {
  const hash = Buffer.from(text).toString('base64url').slice(0, 64);
  return `trans:${lang}:${hash}`;
}

export async function getCachedTranslation(text: string, lang: string): Promise<string | null> {
  return cacheGet<string>(translationKey(text, lang));
}

export async function setCachedTranslation(text: string, lang: string, translation: string): Promise<void> {
  cacheSet(translationKey(text, lang), translation, TRANSLATION_TTL).catch(err =>
    console.error('Translation cache set error:', err)
  );
}

// ============================================================================
// GENERIC REQUEST CACHE (for middleware)
// ============================================================================

/**
 * Generate a cache key from an HTTP request
 */
export function requestCacheKey(method: string, path: string, body?: any, query?: any): string {
  const sanitized = { ...body };
  if (sanitized) {
    delete sanitized.timestamp;
    delete sanitized.requestId;
    delete sanitized.userId;
  }
  const keyData = JSON.stringify({ method, path, body: sanitized, query });
  const hash = Buffer.from(keyData).toString('base64url').slice(0, 128);
  return `req:${hash}`;
}

/**
 * Get Redis cache stats
 */
export async function getRedisStats(): Promise<{
  connected: boolean;
  provider: string;
}> {
  const redis = getRedisClient();
  return {
    connected: redis !== null,
    provider: 'upstash',
  };
}
