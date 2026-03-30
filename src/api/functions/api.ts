import { Handler } from '@netlify/functions';
import serverless from 'serverless-http';
import express, { Request, Response } from 'express';
import cors from 'cors';
import { rateLimiter } from '../middleware/rate-limiter.js';
import { errorHandler } from '../middleware/error-handler.js';
import { authenticateUser, optionalAuth, logUserActivity } from '../middleware/auth-middleware.js';
import { cacheMiddleware, smartCache } from '../middleware/cache.js';
import { sanitizeInput } from '../middleware/validation.js';
import naanoRoutes from '../routes/naano-routes.js';
import khayaRoutes from '../routes/khaya-routes.js';

// Initialize Express app
const app = express();

// CORS configuration — explicit origins required when credentials are enabled
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:3000',
].filter(Boolean) as string[];

const corsOptions = {
  origin: allowedOrigins.length > 0 ? allowedOrigins : '*',
  credentials: allowedOrigins.length > 0,
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
    service: 'naano-api-server',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'production'
  });
});

// API routes with authentication and activity logging
app.use('/api/naano', 
  optionalAuth as express.RequestHandler,           // Optional authentication
  logUserActivity as express.RequestHandler,        // Log user activity
  smartCache as express.RequestHandler,            // Smart caching based on content type
  naanoRoutes            // Main NAANO routes
);

// Khaya AI language translation and TTS routes
app.use('/api/khaya',
  optionalAuth as express.RequestHandler,
  logUserActivity as express.RequestHandler,
  khayaRoutes
);

// Protected routes that require authentication
app.use('/api/naano/protected',
  authenticateUser as express.RequestHandler,       // Require authentication
  logUserActivity as express.RequestHandler,        // Log user activity
  naanoRoutes            // Main NAANO routes
);

// Global error handler (must be last)
app.use(errorHandler);

// Wrap the Express app with serverless-http for Netlify Functions
const serverlessHandler = serverless(app);

// Export the handler for Netlify Functions
export const handler: Handler = async (event, context) => {
  const start = Date.now();

  console.log(JSON.stringify({
    level: 'info',
    type: 'request_start',
    method: event.httpMethod,
    path: event.path,
    timestamp: new Date().toISOString(),
  }));

  const result = await serverlessHandler(event, context);

  const statusCode = (typeof result === 'object' && result !== null && 'statusCode' in result)
    ? (result as any).statusCode
    : result ? 200 : 404;

  console.log(JSON.stringify({
    level: statusCode >= 400 ? 'error' : 'info',
    type: 'request_end',
    method: event.httpMethod,
    path: event.path,
    statusCode,
    durationMs: Date.now() - start,
    timestamp: new Date().toISOString(),
  }));

  if (!result) {
    return {
      statusCode: 404,
      body: JSON.stringify({ error: true, message: 'Not found' })
    };
  }
  if (typeof result === 'object' && result !== null && 'statusCode' in result) {
    return result as any;
  }
  return {
    statusCode: 200,
    body: typeof result === 'string' ? result : JSON.stringify(result)
  };
};
