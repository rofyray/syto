/**
 * Type definitions for Chale AI integration
 */
// Utility functions to transform ChaleContentResponse to specific response types
export function transformToModuleResponse(content, request) {
    return {
        id: content.id || `chale_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: content.title || request.title,
        description: content.description || '',
        subject: request.subject,
        grade: request.grade,
        difficulty: request.difficulty || 'medium',
        culturalContext: request.culturalContext,
        topics: content.topics || [],
        metadata: content.metadata,
        image_url: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };
}
export function transformToTopicResponse(content, request) {
    return {
        id: content.id || `chale_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: content.title || request.title,
        description: content.description || '',
        content: typeof content.content === 'string' ? content.content : JSON.stringify(content.content || {}),
        exercises: content.exercises || [],
        metadata: content.metadata,
        module_id: request.moduleId,
        order_index: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };
}
export function transformToExerciseResponse(content, request) {
    return {
        id: content.id || `chale_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: content.title || request.title,
        description: content.description,
        type: content.type || 'multiple-choice',
        instructions: content.instructions || 'Complete the following exercise.',
        topic_id: request.topicId,
        order_index: 1,
        questions: content.questions || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };
}
export function transformToQuestionResponse(content, request) {
    return {
        id: content.id || `chale_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        question_text: content.question || content.title || 'Sample question',
        question_type: content.type || 'multiple-choice',
        options: content.options,
        correct_answer: content.answer || 'A',
        explanation: content.explanation,
        hints: content.hints || [],
        exercise_id: request.exerciseId,
        order_index: 1,
        points: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };
}
export function transformToLearningPathResponse(content, request) {
    return {
        module: {
            id: content.id || `chale_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            title: content.title || `Learning Path for ${request.subject} Grade ${request.grade}`,
            description: content.description || '',
            subject: request.subject,
            grade: request.grade,
            difficulty: request.difficulty || 'medium',
            culturalContext: request.culturalContext,
            topics: content.topics || [],
            metadata: content.metadata,
            image_url: '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        },
        topics: []
    };
}
