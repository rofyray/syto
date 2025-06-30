import { v4 as uuidv4 } from 'uuid';
/**
 * Convert Chale module content to Syto module format
 */
export function formatModuleForSyto(chaleContent) {
    if (chaleContent.type !== 'module') {
        throw new Error('Content type must be "module" for module formatting');
    }
    const now = new Date().toISOString();
    return {
        id: chaleContent.id,
        title: chaleContent.title,
        description: chaleContent.description,
        subject: chaleContent.subject,
        grade: chaleContent.grade,
        difficulty: chaleContent.metadata.difficulty,
        estimatedDuration: chaleContent.metadata.estimatedDuration,
        learningObjectives: chaleContent.metadata.learningObjectives,
        prerequisites: chaleContent.metadata.prerequisites,
        culturalContext: chaleContent.metadata.culturalContext,
        createdAt: now,
        updatedAt: now,
        isActive: true,
        metadata: {
            ...chaleContent.content,
            ghanaianContext: chaleContent.metadata.ghanaianContext,
            generatedBy: 'chale-ai',
            version: '1.0'
        }
    };
}
/**
 * Convert Chale topic content to Syto topic format
 */
export function formatTopicForSyto(chaleContent, moduleId, order = 1) {
    if (chaleContent.type !== 'topic') {
        throw new Error('Content type must be "topic" for topic formatting');
    }
    const now = new Date().toISOString();
    return {
        id: chaleContent.id,
        moduleId,
        title: chaleContent.title,
        description: chaleContent.description,
        subject: chaleContent.subject,
        grade: chaleContent.grade,
        difficulty: chaleContent.metadata.difficulty,
        order,
        learningObjectives: chaleContent.metadata.learningObjectives,
        content: chaleContent.content,
        estimatedDuration: chaleContent.metadata.estimatedDuration,
        createdAt: now,
        updatedAt: now,
        isActive: true,
        metadata: {
            culturalContext: chaleContent.metadata.culturalContext,
            prerequisites: chaleContent.metadata.prerequisites,
            ghanaianContext: chaleContent.metadata.ghanaianContext,
            generatedBy: 'chale-ai',
            version: '1.0'
        }
    };
}
/**
 * Convert Chale exercise content to Syto exercise format
 */
export function formatExerciseForSyto(chaleContent, topicId, order = 1) {
    if (chaleContent.type !== 'exercise') {
        throw new Error('Content type must be "exercise" for exercise formatting');
    }
    const now = new Date().toISOString();
    // Extract instructions from content
    const instructions = chaleContent.content.instructions || chaleContent.description;
    const assessmentCriteria = chaleContent.content.assessmentCriteria || chaleContent.metadata.learningObjectives;
    return {
        id: chaleContent.id,
        topicId,
        title: chaleContent.title,
        description: chaleContent.description,
        subject: chaleContent.subject,
        grade: chaleContent.grade,
        difficulty: chaleContent.metadata.difficulty,
        order,
        instructions,
        content: chaleContent.content,
        assessmentCriteria,
        estimatedDuration: chaleContent.metadata.estimatedDuration,
        createdAt: now,
        updatedAt: now,
        isActive: true,
        metadata: {
            culturalContext: chaleContent.metadata.culturalContext,
            prerequisites: chaleContent.metadata.prerequisites,
            learningObjectives: chaleContent.metadata.learningObjectives,
            ghanaianContext: chaleContent.metadata.ghanaianContext,
            generatedBy: 'chale-ai',
            version: '1.0'
        }
    };
}
/**
 * Convert Chale question content to Syto question format
 */
export function formatQuestionForSyto(chaleContent, exerciseId, order = 1) {
    if (chaleContent.type !== 'question') {
        throw new Error('Content type must be "question" for question formatting');
    }
    const now = new Date().toISOString();
    // Extract question details from content
    const questionText = chaleContent.content.questionText || chaleContent.title;
    const questionType = chaleContent.content.questionType || 'multiple_choice';
    const options = chaleContent.content.options || [];
    const correctAnswer = chaleContent.content.correctAnswer || chaleContent.content.answer;
    const explanation = chaleContent.content.explanation || '';
    const points = chaleContent.content.points || getDefaultPoints(chaleContent.metadata.difficulty);
    return {
        id: chaleContent.id,
        exerciseId,
        title: chaleContent.title,
        questionText,
        questionType,
        subject: chaleContent.subject,
        grade: chaleContent.grade,
        difficulty: chaleContent.metadata.difficulty,
        order,
        options: options.length > 0 ? options : undefined,
        correctAnswer,
        explanation,
        points,
        estimatedDuration: chaleContent.metadata.estimatedDuration,
        createdAt: now,
        updatedAt: now,
        isActive: true,
        metadata: {
            culturalContext: chaleContent.metadata.culturalContext,
            learningObjectives: chaleContent.metadata.learningObjectives,
            ghanaianContext: chaleContent.metadata.ghanaianContext,
            generatedBy: 'chale-ai',
            version: '1.0'
        }
    };
}
/**
 * Get default points based on difficulty level
 */
function getDefaultPoints(difficulty) {
    switch (difficulty) {
        case 'easy': return 1;
        case 'medium': return 2;
        case 'hard': return 3;
        default: return 1;
    }
}
export function formatLearningPathForSyto(learningPath) {
    // Format module
    const sytoModule = formatModuleForSyto(learningPath.module);
    // Format topics with proper ordering
    const sytoTopics = learningPath.topics.map((topic, index) => formatTopicForSyto(topic, sytoModule.id, index + 1));
    // Format exercises with proper topic association and ordering
    const sytoExercises = [];
    let exerciseOrder = 1;
    for (const topic of sytoTopics) {
        const topicExercises = learningPath.exercises.filter(exercise => exercise.title.includes(topic.title) || exercise.description.includes(topic.title));
        for (const exercise of topicExercises) {
            sytoExercises.push(formatExerciseForSyto(exercise, topic.id, exerciseOrder++));
        }
    }
    // Format questions with proper exercise association and ordering
    const sytoQuestions = [];
    let questionOrder = 1;
    for (const exercise of sytoExercises) {
        const exerciseQuestions = learningPath.questions.filter(question => question.title.includes(exercise.title) || question.description.includes(exercise.title));
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
export function validateSytoContent(content, type) {
    try {
        const requiredFields = {
            module: ['id', 'title', 'description', 'subject', 'grade', 'difficulty'],
            topic: ['id', 'moduleId', 'title', 'description', 'subject', 'grade', 'order'],
            exercise: ['id', 'topicId', 'title', 'description', 'subject', 'grade', 'order'],
            question: ['id', 'exerciseId', 'title', 'questionText', 'questionType', 'correctAnswer']
        };
        const fields = requiredFields[type];
        return fields.every(field => content[field] !== undefined && content[field] !== null);
    }
    catch (error) {
        console.error(`Error validating ${type} content:`, error);
        return false;
    }
}
/**
 * Batch format multiple content items
 */
export function batchFormatForSyto(chaleContents, parentIds = {}) {
    const modules = [];
    const topics = [];
    const exercises = [];
    const questions = [];
    let topicOrder = 1;
    let exerciseOrder = 1;
    let questionOrder = 1;
    for (const content of chaleContents) {
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
        }
        catch (error) {
            console.error(`Error formatting ${content.type} content:`, error);
        }
    }
    return { modules, topics, exercises, questions };
}
