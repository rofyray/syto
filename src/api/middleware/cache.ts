import { Request, Response, NextFunction, RequestHandler } from 'express';
import { cacheGet, cacheSet, requestCacheKey, getRedisStats } from '../../lib/redis.js';

/**
 * Redis-backed cache for API responses
 * Replaces the old in-memory MemoryCache which was ineffective in serverless (Netlify Functions).
 * Uses Upstash Redis (HTTP-based) for persistent caching across function invocations.
 *
 * Falls back gracefully if Redis is not configured — requests just pass through uncached.
 */

/**
 * Cache middleware for GET requests
 */
export const cacheMiddleware = (ttl: number = 30 * 60 * 1000): RequestHandler => {
  const ttlSeconds = Math.floor(ttl / 1000);

  return async (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests and specific POST requests that are idempotent
    const cacheable = req.method === 'GET' ||
      (req.method === 'POST' && req.path.includes('/health'));

    if (!cacheable) {
      return next();
    }

    const key = requestCacheKey(req.method, req.path, req.body, req.query);

    try {
      const cachedData = await cacheGet<any>(key);

      if (cachedData) {
        console.log(`Cache hit for ${req.method} ${req.path}`);
        res.json({
          ...cachedData,
          cached: true,
          cacheTimestamp: new Date().toISOString()
        });
        return;
      }
    } catch {
      // Redis error — proceed without cache
    }

    // Store original res.json to intercept response
    const originalJson = res.json.bind(res);

    res.json = function(data: any): Response {
      // Cache successful responses (non-blocking)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cacheSet(key, data, ttlSeconds).catch(err =>
          console.error('Failed to cache response:', err)
        );
        console.log(`Cached response for ${req.method} ${req.path}`);
      }
      return originalJson(data);
    };

    next();
  };
};

/**
 * Smart cache middleware for content generation
 * Uses different TTL based on content type and complexity
 */
export const smartCache: RequestHandler = async (req, res, next) => {
  const { type } = req.body;

  // Determine TTL based on content type
  let ttlSeconds = 1800; // Default 30 minutes

  switch (type) {
    case 'question':
      ttlSeconds = 3600; // 1 hour
      break;
    case 'exercise':
      ttlSeconds = 2700; // 45 minutes
      break;
    case 'topic':
      ttlSeconds = 7200; // 2 hours
      break;
    case 'module':
      ttlSeconds = 14400; // 4 hours
      break;
  }

  const key = requestCacheKey(req.method, req.path, req.body, req.query);

  try {
    const cachedData = await cacheGet<any>(key);

    if (cachedData) {
      console.log(`Smart cache hit for ${type} generation`);
      res.json({
        ...cachedData,
        cached: true,
        cacheTimestamp: new Date().toISOString()
      });
      return;
    }
  } catch {
    // Redis error — proceed without cache
  }

  // Store original res.json to intercept response
  const originalJson = res.json.bind(res);

  res.json = function(data: any): Response {
    // Cache successful responses (non-blocking)
    if (res.statusCode >= 200 && res.statusCode < 300) {
      cacheSet(key, data, ttlSeconds).catch(err =>
        console.error('Failed to smart cache response:', err)
      );
      console.log(`Smart cached ${type} generation for ${ttlSeconds}s`);
    }
    return originalJson(data);
  };

  next();
};

/**
 * Cache warming middleware - preload common requests
 */
export const warmCache = async () => {
  console.log('Warming cache with common educational content...');

  // Common requests to pre-cache
  const commonRequests = [
    { subject: 'english', grade: 4, type: 'module' },
    { subject: 'english', grade: 5, type: 'module' },
    { subject: 'english', grade: 6, type: 'module' },
    { subject: 'mathematics', grade: 4, type: 'module' },
    { subject: 'mathematics', grade: 5, type: 'module' },
    { subject: 'mathematics', grade: 6, type: 'module' }
  ];

  // This would typically make actual API calls to warm the cache
  console.log(`Would warm cache with ${commonRequests.length} common requests`);
};

/**
 * Cache invalidation middleware
 */
export const invalidateCache = (_pattern?: string) => {
  return (_req: Request, _res: Response, next: NextFunction) => {
    // Redis doesn't support pattern-based invalidation via REST easily.
    // For now, log the intent — specific key invalidation is done via cacheDel().
    if (_pattern) {
      console.log(`Would invalidate cache pattern: ${_pattern}`);
    }
    next();
  };
};

/**
 * Cache statistics endpoint
 */
export const getCacheStats = async (_req: Request, res: Response): Promise<void> => {
  const stats = await getRedisStats();

  res.json({
    cache: {
      ...stats,
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime()
    },
    timestamp: new Date().toISOString()
  });
};
