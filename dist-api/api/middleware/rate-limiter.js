import rateLimit from 'express-rate-limit';
/**
 * Rate limiting middleware for Chale API
 * Prevents abuse and ensures fair usage of AI content generation
 */
export const rateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
        error: 'Too many requests',
        message: 'You have exceeded the rate limit. Please try again later.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
export const strictRateLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 10, // Limit each IP to 10 requests per 5 minutes for intensive operations
    message: {
        error: 'Rate limit exceeded for content generation',
        message: 'Content generation is limited to 10 requests per 5 minutes. Please wait before making more requests.',
        retryAfter: '5 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
});
