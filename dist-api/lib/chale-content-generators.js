import { chaleAgent } from './chale-agent.js';
/**
 * Specialized content generation functions for different educational content types
 * Each function provides tailored generation logic for specific content types
 */
/**
 * Generate a learning module
 */
export async function generateModule(subject, grade, moduleTitle, difficulty = 'medium') {
    const request = {
        type: 'module',
        subject,
        grade,
        title: moduleTitle,
        topic: moduleTitle,
        difficulty,
        context: `Create a comprehensive learning module for ${subject} grade ${grade} students focusing on ${moduleTitle}`
    };
    return await chaleAgent.generateContent(request);
}
/**
 * Generate a topic within a module
 */
export async function generateTopic(subject, grade, moduleTitle, topicTitle, moduleContext, difficulty = 'medium') {
    const contextInfo = moduleContext
        ? `This topic is part of the module: ${moduleContext}`
        : `This topic is part of the module: ${moduleTitle}`;
    const request = {
        type: 'topic',
        subject,
        grade,
        title: topicTitle,
        topic: topicTitle,
        difficulty,
        context: `Create a focused topic on ${topicTitle} for ${subject} grade ${grade}. ${contextInfo}`
    };
    return await chaleAgent.generateContent(request);
}
/**
 * Generate an interactive exercise
 */
export async function generateExercise(subject, grade, topicTitle, exerciseTitle, topicContext, difficulty = 'medium') {
    const contextInfo = topicContext
        ? `This exercise should reinforce learning from the topic: ${topicContext}`
        : '';
    const request = {
        type: 'exercise',
        subject,
        grade,
        title: exerciseTitle,
        topic: topicTitle,
        difficulty,
        context: `Create an engaging exercise on ${exerciseTitle} for ${subject} grade ${grade}. ${contextInfo}`
    };
    return await chaleAgent.generateContent(request);
}
/**
 * Generate a practice question
 */
export async function generateQuestion(subject, grade, exerciseTitle, questionTitle, exerciseContext, difficulty = 'medium') {
    const contextInfo = exerciseContext
        ? `This question is part of the exercise: ${exerciseContext}`
        : '';
    const request = {
        type: 'question',
        subject,
        grade,
        title: questionTitle,
        topic: exerciseTitle,
        difficulty,
        context: `Create a practice question about ${questionTitle} for ${subject} grade ${grade}. ${contextInfo}`
    };
    return await chaleAgent.generateContent(request);
}
/**
 * Generate a complete learning path (Module → Topics → Exercises → Questions)
 */
export async function generateLearningPath(subject, grade, pathTitle, topicsCount = 3, exercisesPerTopic = 2, questionsPerExercise = 3) {
    try {
        // Generate the main module
        const module = await generateModule(subject, grade, pathTitle);
        // Generate topics for the module
        const topics = [];
        for (let i = 0; i < topicsCount; i++) {
            const topicTitle = `${pathTitle} - Topic ${i + 1}`;
            const topic = await generateTopic(subject, grade, pathTitle, topicTitle, module.title);
            topics.push(topic);
        }
        // Generate exercises for each topic
        const exercises = [];
        for (const topic of topics) {
            for (let i = 0; i < exercisesPerTopic; i++) {
                const exerciseTitle = `${topic.title} - Exercise ${i + 1}`;
                const exercise = await generateExercise(subject, grade, topic.title, exerciseTitle, topic.title);
                exercises.push(exercise);
            }
        }
        // Generate questions for each exercise
        const questions = [];
        for (const exercise of exercises) {
            for (let i = 0; i < questionsPerExercise; i++) {
                const questionTitle = `${exercise.title} - Question ${i + 1}`;
                const question = await generateQuestion(subject, grade, exercise.title, questionTitle, exercise.title);
                questions.push(question);
            }
        }
        return {
            module,
            topics,
            exercises,
            questions
        };
    }
    catch (error) {
        console.error('Error generating learning path:', error);
        throw new Error(`Failed to generate complete learning path: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
/**
 * Generate content based on curriculum alignment
 */
export async function generateCurriculumAlignedContent(subject, grade, curriculumTopic, contentType = 'topic') {
    const request = {
        type: contentType,
        subject,
        grade,
        title: `${contentType.charAt(0).toUpperCase() + contentType.slice(1)}: ${curriculumTopic}`,
        topic: curriculumTopic,
        context: `Generate ${contentType} content strictly aligned with Ghana's national curriculum for ${subject} grade ${grade}, focusing on ${curriculumTopic}`
    };
    const content = await chaleAgent.generateContent(request);
    // Validate curriculum alignment
    const isValid = await chaleAgent.validateContent(content);
    if (!isValid) {
        throw new Error(`Generated content does not meet Ghana curriculum standards for ${curriculumTopic}`);
    }
    return content;
}
/**
 * Generate culturally contextualized content
 */
export async function generateGhanaianContextContent(subject, grade, topic, culturalContext, contentType = 'exercise') {
    const request = {
        type: contentType,
        subject,
        grade,
        title: `${contentType.charAt(0).toUpperCase() + contentType.slice(1)}: ${topic}`,
        topic,
        context: `Create ${contentType} content about ${topic} with strong Ghanaian cultural context: ${culturalContext}. Include local references, names, foods, places, and customs naturally.`
    };
    return await chaleAgent.generateContent(request);
}
/**
 * Generate assessment content
 */
export async function generateAssessment(subject, grade, assessmentTopic, questionCount = 5, difficulty = 'medium') {
    const questions = [];
    for (let i = 0; i < questionCount; i++) {
        const questionTitle = `${assessmentTopic} - Assessment Question ${i + 1}`;
        const question = await generateQuestion(subject, grade, assessmentTopic, questionTitle, `Assessment on ${assessmentTopic}`, difficulty);
        questions.push(question);
        // Small delay between questions
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    return questions;
}
/**
 * Generate progressive difficulty content
 */
export async function generateProgressiveContent(subject, grade, topic, contentType = 'exercise') {
    const [easy, medium, hard] = await Promise.all([
        chaleAgent.generateContent({
            type: contentType,
            subject,
            grade,
            title: `Easy ${contentType}: ${topic}`,
            topic,
            difficulty: 'easy'
        }),
        chaleAgent.generateContent({
            type: contentType,
            subject,
            grade,
            title: `Medium ${contentType}: ${topic}`,
            topic,
            difficulty: 'medium'
        }),
        chaleAgent.generateContent({
            type: contentType,
            subject,
            grade,
            title: `Hard ${contentType}: ${topic}`,
            topic,
            difficulty: 'hard'
        })
    ]);
    return { easy, medium, hard };
}
/**
 * Batch generate content with error handling
 */
export async function batchGenerateContent(requests) {
    const successful = [];
    const failed = [];
    for (const request of requests) {
        try {
            const content = await chaleAgent.generateContent(request);
            successful.push(content);
            // Small delay between requests
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        catch (error) {
            failed.push({
                request,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    return { successful, failed };
}
