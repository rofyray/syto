import { Request, Response, NextFunction } from 'express';

/**
 * Error handling middleware for Chale API
 * Provides consistent error responses and logging
 */

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
}

export const errorHandler = (
  error: ApiError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  console.error('API Error:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Default error response
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal server error';
  let code = error.code || 'INTERNAL_ERROR';

  // Handle specific error types
  if (error.message.includes('PICA_SECRET_KEY')) {
    statusCode = 500;
    message = 'AI service configuration error';
    code = 'CONFIG_ERROR';
  } else if (error.message.includes('rate limit')) {
    statusCode = 429;
    code = 'RATE_LIMIT_EXCEEDED';
  } else if (error.message.includes('validation')) {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
  } else if (error.message.includes('curriculum')) {
    statusCode = 422;
    message = 'Content does not meet curriculum standards';
    code = 'CURRICULUM_VALIDATION_ERROR';
  } else if (error.message.includes('Weaviate') || error.message.includes('database')) {
    statusCode = 503;
    message = 'Curriculum database temporarily unavailable';
    code = 'DATABASE_ERROR';
  }

  // Send error response
  res.status(statusCode).json({
    error: {
      code,
      message,
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] || 'unknown'
    }
  });
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
