import { Handler } from '@netlify/functions';
import serverless from 'serverless-http';
import express, { Request, Response } from 'express';
import cors from 'cors';
import { rateLimiter } from '../middleware/rate-limiter';
import { errorHandler } from '../middleware/error-handler';
import { authenticateUser, optionalAuth, logUserActivity } from '../middleware/auth-middleware';
import { cacheMiddleware, smartCache } from '../middleware/cache';
import { sanitizeInput } from '../middleware/validation';
import chaleRoutes from '../routes/chale-routes';

// Initialize Express app
const app = express();

// CORS configuration
const corsOptions = {
  origin: '*', // In production, this should be restricted
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// Global middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security and logging middleware
app.use(sanitizeInput as express.RequestHandler);
app.use(rateLimiter as express.RequestHandler);

// Health check endpoint (no auth required)
app.get('/health', cacheMiddleware(5 * 60 * 1000) as express.RequestHandler, (_req: Request, res: Response): void => {
  res.json({
    status: 'healthy',
    service: 'chale-api-server',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'production'
  });
});

// API routes with authentication and activity logging
app.use('/api/chale', 
  optionalAuth as express.RequestHandler,           // Optional authentication
  logUserActivity as express.RequestHandler,        // Log user activity
  smartCache as express.RequestHandler,            // Smart caching based on content type
  chaleRoutes            // Main Chale routes
);

// Protected routes that require authentication
app.use('/api/chale/protected',
  authenticateUser as express.RequestHandler,       // Require authentication
  logUserActivity as express.RequestHandler,        // Log user activity
  chaleRoutes            // Main Chale routes
);

// Global error handler (must be last)
app.use(errorHandler);

// Wrap the Express app with serverless-http for Netlify Functions
const serverlessHandler = serverless(app);

// Export the handler for Netlify Functions
export const handler: Handler = async (event, context) => {
  // Return the serverless handler
  const result = await serverlessHandler(event, context);
  // Ensure we return a valid HandlerResponse
  if (!result) {
    return {
      statusCode: 404,
      body: JSON.stringify({ error: 'Not found' })
    };
  }
  // Ensure the result has the required HandlerResponse properties
  if (typeof result === 'object' && result !== null && 'statusCode' in result) {
    return result as any; // Safe to cast as we've verified it has statusCode
  }
  // Fallback if result is not a valid HandlerResponse
  return {
    statusCode: 200,
    body: typeof result === 'string' ? result : JSON.stringify(result)
  };
};
