import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { rateLimiter } from './middleware/rate-limiter.js';
import { errorHandler } from './middleware/error-handler.js';
import { optionalAuth, logUserActivity } from './middleware/auth-middleware.js';
import { cacheMiddleware, smartCache, getCacheStats, warmCache } from './middleware/cache.js';
import { sanitizeInput } from './middleware/validation.js';
import naanoRoutes from './routes/naano-routes.js';

/**
 * NAANO AI API Server
 * Express server providing educational content generation endpoints
 */

const app = express();
const PORT = process.env.API_PORT || 3001;

// Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// CORS configuration
const corsOptions = {
  origin: [
    process.env.VITE_FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:5173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// Global middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security and logging middleware
app.use(sanitizeInput);
app.use(rateLimiter);

// Request logging
app.use((req: Request, _res: Response, next: NextFunction): void => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint (no auth required)
app.get('/health', cacheMiddleware(5 * 60 * 1000), (_req: Request, res: Response, _next: NextFunction) => {
  res.json({
    status: 'healthy',
    service: 'naano-api-server',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
  return;
});

// Cache statistics endpoint (no auth required)
app.get('/cache-stats', getCacheStats);

// API routes with authentication and activity logging
app.use('/api/naano', 
  optionalAuth,           // Optional authentication
  logUserActivity,        // Log user activity
  smartCache,            // Smart caching based on content type
  naanoRoutes            // Main NAANO routes
);



// 404 handler
app.use('*', (req: Request, res: Response, _next: NextFunction) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: `The requested endpoint ${req.method} ${req.originalUrl} does not exist. The primary endpoint is POST /api/naano.`
  });
  return;
});

// Global error handler (must be last)
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start server
const startServer = async () => {
  try {
    // Warm cache with common requests
    await warmCache();
    
    app.listen(PORT, () => {
      console.log(`🚀 NAANO AI API Server running on port ${PORT}`);
      console.log(`📚 Educational content generation ready`);
      console.log(`🌍 CORS enabled for: ${corsOptions.origin.join(', ')}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`📈 Cache stats: http://localhost:${PORT}/cache-stats`);
      console.log(`🎓 NAANO API: http://localhost:${PORT}/api/naano/*`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

export default app;
