import { Request, Response, NextFunction } from 'express';

/**
 * Validation middleware for NAANO API requests
 * Ensures all requests meet the required standards for educational content generation
 */

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

/**
 * Validate basic content generation request
 */
export const validateContentRequest = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors: ValidationError[] = [];
  const { subject, grade, type } = req.body;

  // Validate subject
  if (!subject) {
    errors.push({
      field: 'subject',
      message: 'Subject is required',
      code: 'REQUIRED_FIELD'
    });
  } else if (!['english', 'mathematics'].includes(subject)) {
    errors.push({
      field: 'subject',
      message: 'Subject must be "english" or "mathematics"',
      code: 'INVALID_VALUE'
    });
  }

  // Validate grade
  if (!grade) {
    errors.push({
      field: 'grade',
      message: 'Grade is required',
      code: 'REQUIRED_FIELD'
    });
  } else if (![4, 5, 6].includes(Number(grade))) {
    errors.push({
      field: 'grade',
      message: 'Grade must be 4, 5, or 6',
      code: 'INVALID_VALUE'
    });
  }

  // Validate content type if provided
  if (type && !['module', 'topic', 'exercise', 'question'].includes(type)) {
    errors.push({
      field: 'type',
      message: 'Content type must be "module", "topic", "exercise", or "question"',
      code: 'INVALID_VALUE'
    });
  }

  // Validate difficulty if provided
  if (req.body.difficulty && !['easy', 'medium', 'hard'].includes(req.body.difficulty)) {
    errors.push({
      field: 'difficulty',
      message: 'Difficulty must be "easy", "medium", or "hard"',
      code: 'INVALID_VALUE'
    });
  }

  if (errors.length > 0) {
    res.status(400).json({
      error: 'Validation failed',
      message: 'Request contains invalid or missing fields',
      details: errors
    });
    return;
  }

  next();
};

/**
 * Validate module generation request
 */
export const validateModuleRequest = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors: ValidationError[] = [];
  const { title } = req.body;

  if (!title) {
    errors.push({
      field: 'title',
      message: 'Module title is required',
      code: 'REQUIRED_FIELD'
    });
  } else if (title.length < 3) {
    errors.push({
      field: 'title',
      message: 'Module title must be at least 3 characters long',
      code: 'MIN_LENGTH'
    });
  } else if (title.length > 100) {
    errors.push({
      field: 'title',
      message: 'Module title must not exceed 100 characters',
      code: 'MAX_LENGTH'
    });
  }

  if (errors.length > 0) {
    res.status(400).json({
      error: 'Module validation failed',
      message: 'Module request contains invalid fields',
      details: errors
    });
    return;
  }

  next();
};

/**
 * Validate topic generation request
 */
export const validateTopicRequest = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors: ValidationError[] = [];
  const { title, moduleId } = req.body;

  if (!title) {
    errors.push({
      field: 'title',
      message: 'Topic title is required',
      code: 'REQUIRED_FIELD'
    });
  } else if (title.length < 3) {
    errors.push({
      field: 'title',
      message: 'Topic title must be at least 3 characters long',
      code: 'MIN_LENGTH'
    });
  }

  // moduleId is optional but if provided should be valid UUID format
  if (moduleId && !isValidUUID(moduleId)) {
    errors.push({
      field: 'moduleId',
      message: 'Module ID must be a valid UUID',
      code: 'INVALID_FORMAT'
    });
  }

  if (errors.length > 0) {
    res.status(400).json({
      error: 'Topic validation failed',
      message: 'Topic request contains invalid fields',
      details: errors
    });
    return;
  }

  next();
};

/**
 * Validate exercise generation request
 */
export const validateExerciseRequest = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors: ValidationError[] = [];
  const { title, topicId } = req.body;

  if (!title) {
    errors.push({
      field: 'title',
      message: 'Exercise title is required',
      code: 'REQUIRED_FIELD'
    });
  } else if (title.length < 3) {
    errors.push({
      field: 'title',
      message: 'Exercise title must be at least 3 characters long',
      code: 'MIN_LENGTH'
    });
  }

  // topicId is optional but if provided should be valid UUID format
  if (topicId && !isValidUUID(topicId)) {
    errors.push({
      field: 'topicId',
      message: 'Topic ID must be a valid UUID',
      code: 'INVALID_FORMAT'
    });
  }

  if (errors.length > 0) {
    res.status(400).json({
      error: 'Exercise validation failed',
      message: 'Exercise request contains invalid fields',
      details: errors
    });
    return;
  }

  next();
};

/**
 * Validate question generation request
 */
export const validateQuestionRequest = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors: ValidationError[] = [];
  const { topic, exerciseId } = req.body;

  if (!topic) {
    errors.push({
      field: 'topic',
      message: 'Question topic is required',
      code: 'REQUIRED_FIELD'
    });
  } else if (topic.length < 3) {
    errors.push({
      field: 'topic',
      message: 'Question topic must be at least 3 characters long',
      code: 'MIN_LENGTH'
    });
  }

  // exerciseId is optional but if provided should be valid UUID format
  if (exerciseId && !isValidUUID(exerciseId)) {
    errors.push({
      field: 'exerciseId',
      message: 'Exercise ID must be a valid UUID',
      code: 'INVALID_FORMAT'
    });
  }

  if (errors.length > 0) {
    res.status(400).json({
      error: 'Question validation failed',
      message: 'Question request contains invalid fields',
      details: errors
    });
    return;
  }

  next();
};

/**
 * Validate learning path generation request
 */
export const validateLearningPathRequest = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors: ValidationError[] = [];
  const { title, topicsCount, exercisesPerTopic, questionsPerExercise } = req.body;

  if (!title) {
    errors.push({
      field: 'title',
      message: 'Learning path title is required',
      code: 'REQUIRED_FIELD'
    });
  } else if (title.length < 5) {
    errors.push({
      field: 'title',
      message: 'Learning path title must be at least 5 characters long',
      code: 'MIN_LENGTH'
    });
  }

  // Validate counts
  if (topicsCount && (topicsCount < 1 || topicsCount > 10)) {
    errors.push({
      field: 'topicsCount',
      message: 'Topics count must be between 1 and 10',
      code: 'OUT_OF_RANGE'
    });
  }

  if (exercisesPerTopic && (exercisesPerTopic < 1 || exercisesPerTopic > 5)) {
    errors.push({
      field: 'exercisesPerTopic',
      message: 'Exercises per topic must be between 1 and 5',
      code: 'OUT_OF_RANGE'
    });
  }

  if (questionsPerExercise && (questionsPerExercise < 1 || questionsPerExercise > 10)) {
    errors.push({
      field: 'questionsPerExercise',
      message: 'Questions per exercise must be between 1 and 10',
      code: 'OUT_OF_RANGE'
    });
  }

  if (errors.length > 0) {
    res.status(400).json({
      error: 'Learning path validation failed',
      message: 'Learning path request contains invalid fields',
      details: errors
    });
    return;
  }

  next();
};

/**
 * Validate batch generation request
 */
export const validateBatchRequest = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors: ValidationError[] = [];
  const { requests } = req.body;

  if (!requests) {
    errors.push({
      field: 'requests',
      message: 'Requests array is required',
      code: 'REQUIRED_FIELD'
    });
  } else if (!Array.isArray(requests)) {
    errors.push({
      field: 'requests',
      message: 'Requests must be an array',
      code: 'INVALID_TYPE'
    });
  } else if (requests.length === 0) {
    errors.push({
      field: 'requests',
      message: 'Requests array must not be empty',
      code: 'EMPTY_ARRAY'
    });
  } else if (requests.length > 10) {
    errors.push({
      field: 'requests',
      message: 'Maximum 10 requests allowed per batch',
      code: 'ARRAY_TOO_LARGE'
    });
  } else {
    // Validate each request in the batch
    requests.forEach((request: any, index: number) => {
      if (!request.subject || !['english', 'mathematics'].includes(request.subject)) {
        errors.push({
          field: `requests[${index}].subject`,
          message: 'Each request must have a valid subject (english or mathematics)',
          code: 'INVALID_VALUE'
        });
      }
      if (!request.grade || ![4, 5, 6].includes(Number(request.grade))) {
        errors.push({
          field: `requests[${index}].grade`,
          message: 'Each request must have a valid grade (4, 5, or 6)',
          code: 'INVALID_VALUE'
        });
      }
      if (!request.type || !['module', 'topic', 'exercise', 'question'].includes(request.type)) {
        errors.push({
          field: `requests[${index}].type`,
          message: 'Each request must have a valid type',
          code: 'INVALID_VALUE'
        });
      }
    });
  }

  if (errors.length > 0) {
    res.status(400).json({
      error: 'Batch validation failed',
      message: 'Batch request contains invalid fields',
      details: errors
    });
    return;
  }

  next();
};

/**
 * Validate cultural context request
 */
export const validateCulturalContextRequest = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors: ValidationError[] = [];
  const { topic, culturalContext } = req.body;

  if (!topic) {
    errors.push({
      field: 'topic',
      message: 'Topic is required',
      code: 'REQUIRED_FIELD'
    });
  }

  if (!culturalContext) {
    errors.push({
      field: 'culturalContext',
      message: 'Cultural context is required',
      code: 'REQUIRED_FIELD'
    });
  } else if (culturalContext.length < 10) {
    errors.push({
      field: 'culturalContext',
      message: 'Cultural context must be at least 10 characters long',
      code: 'MIN_LENGTH'
    });
  }

  if (errors.length > 0) {
    res.status(400).json({
      error: 'Cultural context validation failed',
      message: 'Cultural context request contains invalid fields',
      details: errors
    });
    return;
  }

  next();
};

/**
 * Validate assessment generation request
 */
export const validateAssessmentRequest = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors: ValidationError[] = [];
  const { topic, questionCount } = req.body;

  if (!topic) {
    errors.push({
      field: 'topic',
      message: 'Assessment topic is required',
      code: 'REQUIRED_FIELD'
    });
  }

  if (questionCount && (questionCount < 1 || questionCount > 20)) {
    errors.push({
      field: 'questionCount',
      message: 'Question count must be between 1 and 20',
      code: 'OUT_OF_RANGE'
    });
  }

  if (errors.length > 0) {
    res.status(400).json({
      error: 'Assessment validation failed',
      message: 'Assessment request contains invalid fields',
      details: errors
    });
    return;
  }

  next();
};

/**
 * Helper function to validate UUID format
 */
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Sanitize input to prevent XSS and injection attacks
 */
export const sanitizeInput = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const sanitizeString = (str: string): string => {
    if (typeof str !== 'string') return str;
    
    // Remove potentially dangerous characters
    return str
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]*>/g, '')
      .trim();
  };

  // Sanitize common fields
  if (req.body.title) req.body.title = sanitizeString(req.body.title);
  if (req.body.topic) req.body.topic = sanitizeString(req.body.topic);
  if (req.body.culturalContext) req.body.culturalContext = sanitizeString(req.body.culturalContext);
  if (req.body.moduleContext) req.body.moduleContext = sanitizeString(req.body.moduleContext);
  if (req.body.topicContext) req.body.topicContext = sanitizeString(req.body.topicContext);
  if (req.body.exerciseContext) req.body.exerciseContext = sanitizeString(req.body.exerciseContext);

  next();
};
