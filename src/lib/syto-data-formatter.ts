import { NAANOContentResponse } from './naano-config.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Syto App Data Model Formatters
 * Converts NAANO-generated content to match Syto's database schema
 */

/**
 * Syto database schema interfaces
 */
export interface SytoModule {
  id: string;
  title: string;
  description: string;
  subject: 'english' | 'mathematics';
  grade: 4 | 5 | 6;
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedDuration: string;
  learningObjectives: string[];
  prerequisites: string[];
  culturalContext: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  metadata: Record<string, any>;
}

export interface SytoTopic {
  id: string;
  moduleId: string;
  title: string;
  description: string;
  subject: 'english' | 'mathematics';
  grade: 4 | 5 | 6;
  difficulty: 'easy' | 'medium' | 'hard';
  order: number;
  learningObjectives: string[];
  content: Record<string, any>;
  estimatedDuration: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  metadata: Record<string, any>;
}

export interface SytoExercise {
  id: string;
  topicId: string;
  title: string;
  description: string;
  subject: 'english' | 'mathematics';
  grade: 4 | 5 | 6;
  difficulty: 'easy' | 'medium' | 'hard';
  order: number;
  instructions: string;
  content: Record<string, any>;
  assessmentCriteria: string[];
  estimatedDuration: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  metadata: Record<string, any>;
}

export interface SytoQuestion {
  id: string;
  exerciseId: string;
  title: string;
  questionText: string;
  questionType: 'multiple_choice' | 'short_answer' | 'essay' | 'true_false' | 'fill_blank';
  subject: 'english' | 'mathematics';
  grade: 4 | 5 | 6;
  difficulty: 'easy' | 'medium' | 'hard';
  order: number;
  options?: string[];
  correctAnswer: string | string[];
  explanation: string;
  points: number;
  estimatedDuration: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  metadata: Record<string, any>;
}

/**
 * Convert NAANO module content to Syto module format
 */
export function formatModuleForSyto(naanoContent: NAANOContentResponse): SytoModule {
  if (naanoContent.type !== 'module') {
    throw new Error('Content type must be "module" for module formatting');
  }

  const now = new Date().toISOString();

  return {
    id: naanoContent.id,
    title: naanoContent.title,
    description: naanoContent.description,
    subject: naanoContent.subject,
    grade: naanoContent.grade,
    difficulty: naanoContent.metadata.difficulty,
    estimatedDuration: naanoContent.metadata.estimatedDuration,
    learningObjectives: naanoContent.metadata.learningObjectives,
    prerequisites: naanoContent.metadata.prerequisites,
    culturalContext: naanoContent.metadata.culturalContext,
    createdAt: now,
    updatedAt: now,
    isActive: true,
    metadata: {
      ...naanoContent.content,
      ghanaianContext: naanoContent.metadata.ghanaianContext,
      generatedBy: 'naano-ai',
      version: '1.0'
    }
  };
}

/**
 * Convert NAANO topic content to Syto topic format
 */
export function formatTopicForSyto(
  naanoContent: NAANOContentResponse, 
  moduleId: string, 
  order: number = 1
): SytoTopic {
  if (naanoContent.type !== 'topic') {
    throw new Error('Content type must be "topic" for topic formatting');
  }

  const now = new Date().toISOString();

  return {
    id: naanoContent.id,
    moduleId,
    title: naanoContent.title,
    description: naanoContent.description,
    subject: naanoContent.subject,
    grade: naanoContent.grade,
    difficulty: naanoContent.metadata.difficulty,
    order,
    learningObjectives: naanoContent.metadata.learningObjectives,
    content: naanoContent.content,
    estimatedDuration: naanoContent.metadata.estimatedDuration,
    createdAt: now,
    updatedAt: now,
    isActive: true,
    metadata: {
      culturalContext: naanoContent.metadata.culturalContext,
      prerequisites: naanoContent.metadata.prerequisites,
      ghanaianContext: naanoContent.metadata.ghanaianContext,
      generatedBy: 'naano-ai',
      version: '1.0'
    }
  };
}

/**
 * Convert NAANO exercise content to Syto exercise format
 */
export function formatExerciseForSyto(
  naanoContent: NAANOContentResponse, 
  topicId: string, 
  order: number = 1
): SytoExercise {
  if (naanoContent.type !== 'exercise') {
    throw new Error('Content type must be "exercise" for exercise formatting');
  }

  const now = new Date().toISOString();

  // Extract instructions from content
  const instructions = naanoContent.content.instructions || naanoContent.description;
  const assessmentCriteria = naanoContent.content.assessmentCriteria || naanoContent.metadata.learningObjectives;

  return {
    id: naanoContent.id,
    topicId,
    title: naanoContent.title,
    description: naanoContent.description,
    subject: naanoContent.subject,
    grade: naanoContent.grade,
    difficulty: naanoContent.metadata.difficulty,
    order,
    instructions,
    content: naanoContent.content,
    assessmentCriteria,
    estimatedDuration: naanoContent.metadata.estimatedDuration,
    createdAt: now,
    updatedAt: now,
    isActive: true,
    metadata: {
      culturalContext: naanoContent.metadata.culturalContext,
      prerequisites: naanoContent.metadata.prerequisites,
      learningObjectives: naanoContent.metadata.learningObjectives,
      ghanaianContext: naanoContent.metadata.ghanaianContext,
      generatedBy: 'naano-ai',
      version: '1.0'
    }
  };
}

/**
 * Convert NAANO question content to Syto question format
 */
export function formatQuestionForSyto(
  naanoContent: NAANOContentResponse, 
  exerciseId: string, 
  order: number = 1
): SytoQuestion {
  if (naanoContent.type !== 'question') {
    throw new Error('Content type must be "question" for question formatting');
  }

  const now = new Date().toISOString();

  // Extract question details from content
  const questionText = naanoContent.content.questionText || naanoContent.title;
  const questionType = naanoContent.content.questionType || 'multiple_choice';
  const options = naanoContent.content.options || [];
  const correctAnswer = naanoContent.content.correctAnswer || naanoContent.content.answer;
  const explanation = naanoContent.content.explanation || '';
  const points = naanoContent.content.points || getDefaultPoints(naanoContent.metadata.difficulty);

  return {
    id: naanoContent.id,
    exerciseId,
    title: naanoContent.title,
    questionText,
    questionType,
    subject: naanoContent.subject,
    grade: naanoContent.grade,
    difficulty: naanoContent.metadata.difficulty,
    order,
    options: options.length > 0 ? options : undefined,
    correctAnswer,
    explanation,
    points,
    estimatedDuration: naanoContent.metadata.estimatedDuration,
    createdAt: now,
    updatedAt: now,
    isActive: true,
    metadata: {
      culturalContext: naanoContent.metadata.culturalContext,
      learningObjectives: naanoContent.metadata.learningObjectives,
      ghanaianContext: naanoContent.metadata.ghanaianContext,
      generatedBy: 'naano-ai',
      version: '1.0'
    }
  };
}

/**
 * Get default points based on difficulty level
 */
function getDefaultPoints(difficulty: 'easy' | 'medium' | 'hard'): number {
  switch (difficulty) {
    case 'easy': return 1;
    case 'medium': return 2;
    case 'hard': return 3;
    default: return 1;
  }
}

/**
 * Format complete learning path for Syto database
 */
export interface SytoLearningPath {
  module: SytoModule;
  topics: SytoTopic[];
  exercises: SytoExercise[];
  questions: SytoQuestion[];
}

export function formatLearningPathForSyto(learningPath: {
  module: NAANOContentResponse;
  topics: NAANOContentResponse[];
  exercises: NAANOContentResponse[];
  questions: NAANOContentResponse[];
}): SytoLearningPath {
  // Format module
  const sytoModule = formatModuleForSyto(learningPath.module);

  // Format topics with proper ordering
  const sytoTopics = learningPath.topics.map((topic, index) => 
    formatTopicForSyto(topic, sytoModule.id, index + 1)
  );

  // Format exercises with proper topic association and ordering
  const sytoExercises: SytoExercise[] = [];
  let exerciseOrder = 1;
  
  for (const topic of sytoTopics) {
    const topicExercises = learningPath.exercises.filter(exercise => 
      exercise.title.includes(topic.title) || exercise.description.includes(topic.title)
    );
    
    for (const exercise of topicExercises) {
      sytoExercises.push(formatExerciseForSyto(exercise, topic.id, exerciseOrder++));
    }
  }

  // Format questions with proper exercise association and ordering
  const sytoQuestions: SytoQuestion[] = [];
  let questionOrder = 1;
  
  for (const exercise of sytoExercises) {
    const exerciseQuestions = learningPath.questions.filter(question => 
      question.title.includes(exercise.title) || question.description.includes(exercise.title)
    );
    
    for (const question of exerciseQuestions) {
      sytoQuestions.push(formatQuestionForSyto(question, exercise.id, questionOrder++));
    }
  }

  return {
    module: sytoModule,
    topics: sytoTopics,
    exercises: sytoExercises,
    questions: sytoQuestions
  };
}

/**
 * Validate Syto-formatted content
 */
export function validateSytoContent(content: any, type: 'module' | 'topic' | 'exercise' | 'question'): boolean {
  try {
    const requiredFields = {
      module: ['id', 'title', 'description', 'subject', 'grade', 'difficulty'],
      topic: ['id', 'moduleId', 'title', 'description', 'subject', 'grade', 'order'],
      exercise: ['id', 'topicId', 'title', 'description', 'subject', 'grade', 'order'],
      question: ['id', 'exerciseId', 'title', 'questionText', 'questionType', 'correctAnswer']
    };

    const fields = requiredFields[type];
    return fields.every(field => content[field] !== undefined && content[field] !== null);
    
  } catch (error) {
    console.error(`Error validating ${type} content:`, error);
    return false;
  }
}

/**
 * Batch format multiple content items
 */
export function batchFormatForSyto(
  naanoContents: NAANOContentResponse[],
  parentIds: { [key: string]: string } = {}
): {
  modules: SytoModule[];
  topics: SytoTopic[];
  exercises: SytoExercise[];
  questions: SytoQuestion[];
} {
  const modules: SytoModule[] = [];
  const topics: SytoTopic[] = [];
  const exercises: SytoExercise[] = [];
  const questions: SytoQuestion[] = [];

  let topicOrder = 1;
  let exerciseOrder = 1;
  let questionOrder = 1;

  for (const content of naanoContents) {
    try {
      switch (content.type) {
        case 'module':
          modules.push(formatModuleForSyto(content));
          break;
          
        case 'topic':
          const moduleId = parentIds[content.id] || modules[modules.length - 1]?.id || uuidv4();
          topics.push(formatTopicForSyto(content, moduleId, topicOrder++));
          break;
          
        case 'exercise':
          const topicId = parentIds[content.id] || topics[topics.length - 1]?.id || uuidv4();
          exercises.push(formatExerciseForSyto(content, topicId, exerciseOrder++));
          break;
          
        case 'question':
          const exerciseId = parentIds[content.id] || exercises[exercises.length - 1]?.id || uuidv4();
          questions.push(formatQuestionForSyto(content, exerciseId, questionOrder++));
          break;
      }
    } catch (error) {
      console.error(`Error formatting ${content.type} content:`, error);
    }
  }

  return { modules, topics, exercises, questions };
}
