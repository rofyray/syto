class MemoryCache {
    constructor(maxSize) {
        this.cache = new Map();
        this.maxSize = 1000; // Maximum number of cached entries
        if (maxSize)
            this.maxSize = maxSize;
        // Clean up expired entries every 5 minutes
        setInterval(() => this.cleanup(), 5 * 60 * 1000);
    }
    /**
     * Generate cache key from request
     */
    generateKey(req) {
        const { method, path, body, query } = req;
        const keyData = {
            method,
            path,
            body: this.sanitizeForKey(body),
            query: this.sanitizeForKey(query)
        };
        return JSON.stringify(keyData);
    }
    /**
     * Sanitize data for cache key generation
     */
    sanitizeForKey(data) {
        if (!data)
            return data;
        // Remove sensitive fields that shouldn't affect caching
        const sanitized = { ...data };
        delete sanitized.timestamp;
        delete sanitized.requestId;
        delete sanitized.userId;
        return sanitized;
    }
    /**
     * Check if entry is expired
     */
    isExpired(entry) {
        return Date.now() - entry.timestamp > entry.ttl;
    }
    /**
     * Get cached data
     */
    get(req) {
        const key = this.generateKey(req);
        const entry = this.cache.get(key);
        if (!entry || this.isExpired(entry)) {
            if (entry)
                this.cache.delete(key);
            return null;
        }
        return entry.data;
    }
    /**
     * Set cached data
     */
    set(req, data, ttl = 30 * 60 * 1000) {
        const key = this.generateKey(req);
        // Remove oldest entries if cache is full
        if (this.cache.size >= this.maxSize) {
            const oldestKey = this.cache.keys().next().value;
            if (oldestKey) {
                this.cache.delete(oldestKey);
            }
        }
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl
        });
    }
    /**
     * Clear expired entries
     */
    cleanup() {
        const now = Date.now();
        for (const [key, entry] of this.cache.entries()) {
            if (now - entry.timestamp > entry.ttl) {
                this.cache.delete(key);
            }
        }
    }
    /**
     * Clear all cache entries
     */
    clear() {
        this.cache.clear();
    }
    /**
     * Get cache statistics
     */
    getStats() {
        return {
            size: this.cache.size,
            maxSize: this.maxSize
        };
    }
}
// Global cache instance
const cache = new MemoryCache(1000);
/**
 * Cache middleware for GET requests
 */
export const cacheMiddleware = (ttl = 30 * 60 * 1000) => {
    return (req, res, next) => {
        // Only cache GET requests and specific POST requests that are idempotent
        const cacheable = req.method === 'GET' ||
            (req.method === 'POST' && req.path.includes('/health'));
        if (!cacheable) {
            return next();
        }
        const cachedData = cache.get(req);
        if (cachedData) {
            console.log(`Cache hit for ${req.method} ${req.path}`);
            res.json({
                ...cachedData,
                cached: true,
                cacheTimestamp: new Date().toISOString()
            });
            return;
        }
        // Store original res.json to intercept response
        const originalJson = res.json.bind(res);
        res.json = function (data) {
            // Cache successful responses
            if (res.statusCode >= 200 && res.statusCode < 300) {
                cache.set(req, data, ttl);
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
export const smartCache = (req, res, next) => {
    const { type } = req.body;
    // Determine TTL based on content type
    let ttl = 30 * 60 * 1000; // Default 30 minutes
    switch (type) {
        case 'question':
            ttl = 60 * 60 * 1000; // 1 hour - questions change less frequently
            break;
        case 'exercise':
            ttl = 45 * 60 * 1000; // 45 minutes
            break;
        case 'topic':
            ttl = 2 * 60 * 60 * 1000; // 2 hours - topics are more stable
            break;
        case 'module':
            ttl = 4 * 60 * 60 * 1000; // 4 hours - modules are most stable
            break;
    }
    // Check cache first
    const cachedData = cache.get(req);
    if (cachedData) {
        console.log(`Smart cache hit for ${type} generation`);
        res.json({
            ...cachedData,
            cached: true,
            cacheTimestamp: new Date().toISOString()
        });
        return;
        return;
    }
    // Store original res.json to intercept response
    const originalJson = res.json.bind(res);
    res.json = function (data) {
        // Cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
            cache.set(req, data, ttl);
            console.log(`Smart cached ${type} generation for ${ttl}ms`);
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
    // For now, we'll just log the intention
    console.log(`Would warm cache with ${commonRequests.length} common requests`);
};
/**
 * Cache invalidation middleware
 */
export const invalidateCache = (pattern) => {
    return (_req, _res, next) => {
        if (pattern) {
            // Invalidate specific pattern (not implemented in simple version)
            console.log(`Would invalidate cache pattern: ${pattern}`);
        }
        else {
            // Clear all cache
            cache.clear();
            console.log('Cache cleared');
        }
        next();
    };
};
/**
 * Cache statistics endpoint
 */
export const getCacheStats = (_req, res) => {
    const stats = cache.getStats();
    res.json({
        cache: {
            ...stats,
            memoryUsage: process.memoryUsage(),
            uptime: process.uptime()
        },
        timestamp: new Date().toISOString()
    });
};
export { cache };
