/**
 * Supabase Database Service for Chale AI Integration
 * Handles all database operations for student-specific content and progress tracking
 */
import { supabase } from './supabase.js';
// ============================================================================
// STUDENT MODULE OPERATIONS
// ============================================================================
export class ChaleSupabaseService {
    /**
     * Save a generated module for a student
     */
    static async saveStudentModule(studentId, moduleData, requestData, generationPrompt) {
        const moduleRecord = {
            student_id: studentId,
            title: moduleData.title,
            description: moduleData.description,
            subject: requestData.subject,
            grade_level: requestData.grade,
            difficulty: requestData.difficulty || 'medium',
            cultural_context: requestData.culturalContext,
            curriculum_alignment: requestData.curriculumTopic,
            generated_by: 'chale-ai',
            generation_prompt: generationPrompt,
            chale_response: moduleData,
            syto_formatted: moduleData,
            updated_at: new Date().toISOString()
        };
        const { data, error } = await supabase
            .from('student_modules')
            .insert(moduleRecord)
            .select()
            .single();
        if (error) {
            throw new Error(`Failed to save student module: ${error.message}`);
        }
        return data;
    }
    /**
     * Get all modules for a student
     */
    static async getStudentModules(studentId, subject, gradeLevel) {
        let query = supabase
            .from('student_modules')
            .select('*')
            .eq('student_id', studentId)
            .order('created_at', { ascending: false });
        if (subject) {
            query = query.eq('subject', subject);
        }
        if (gradeLevel) {
            query = query.eq('grade_level', gradeLevel);
        }
        const { data, error } = await query;
        if (error) {
            throw new Error(`Failed to fetch student modules: ${error.message}`);
        }
        return data || [];
    }
    /**
     * Save a generated topic for a student
     */
    static async saveStudentTopic(studentId, moduleId, topicData, requestData, generationPrompt, orderIndex) {
        const topicRecord = {
            student_id: studentId,
            student_module_id: moduleId,
            title: topicData.title,
            description: topicData.description,
            content: topicData.content || '',
            order_index: orderIndex,
            difficulty: requestData.difficulty || 'medium',
            cultural_context: requestData.culturalContext,
            curriculum_alignment: requestData.curriculumTopic,
            generated_by: 'chale-ai',
            generation_prompt: generationPrompt,
            chale_response: topicData,
            syto_formatted: topicData,
            updated_at: new Date().toISOString()
        };
        const { data, error } = await supabase
            .from('student_topics')
            .insert(topicRecord)
            .select()
            .single();
        if (error) {
            throw new Error(`Failed to save student topic: ${error.message}`);
        }
        return data;
    }
    /**
     * Get all topics for a student module
     */
    static async getStudentTopics(studentId, moduleId) {
        const { data, error } = await supabase
            .from('student_topics')
            .select('*')
            .eq('student_id', studentId)
            .eq('student_module_id', moduleId)
            .order('order_index', { ascending: true });
        if (error) {
            throw new Error(`Failed to fetch student topics: ${error.message}`);
        }
        return data || [];
    }
    /**
     * Save a generated exercise for a student
     */
    static async saveStudentExercise(studentId, topicId, exerciseData, requestData, generationPrompt, orderIndex) {
        const exerciseRecord = {
            student_id: studentId,
            student_topic_id: topicId,
            title: exerciseData.title,
            description: exerciseData.description,
            type: exerciseData.type || 'multiple-choice',
            order_index: orderIndex,
            difficulty: requestData.difficulty || 'medium',
            cultural_context: requestData.culturalContext,
            curriculum_alignment: requestData.curriculumTopic,
            generated_by: 'chale-ai',
            generation_prompt: generationPrompt,
            chale_response: exerciseData,
            syto_formatted: exerciseData,
            updated_at: new Date().toISOString()
        };
        const { data, error } = await supabase
            .from('student_exercises')
            .insert(exerciseRecord)
            .select()
            .single();
        if (error) {
            throw new Error(`Failed to save student exercise: ${error.message}`);
        }
        return data;
    }
    /**
     * Get all exercises for a student topic
     */
    static async getStudentExercises(studentId, topicId) {
        const { data, error } = await supabase
            .from('student_exercises')
            .select('*')
            .eq('student_id', studentId)
            .eq('student_topic_id', topicId)
            .order('order_index', { ascending: true });
        if (error) {
            throw new Error(`Failed to fetch student exercises: ${error.message}`);
        }
        return data || [];
    }
    /**
     * Save a generated question for a student
     */
    static async saveStudentQuestion(studentId, exerciseId, questionData, requestData, generationPrompt, orderIndex) {
        const questionRecord = {
            student_id: studentId,
            student_exercise_id: exerciseId,
            question_text: questionData.question_text,
            question_type: questionData.question_type || 'multiple-choice',
            options: questionData.options,
            correct_answer: questionData.correct_answer,
            explanation: questionData.explanation,
            hints: questionData.hints || [],
            order_index: orderIndex,
            difficulty: requestData.difficulty || 'medium',
            cultural_context: requestData.culturalContext,
            curriculum_alignment: requestData.curriculumTopic,
            generated_by: 'chale-ai',
            generation_prompt: generationPrompt,
            chale_response: questionData,
            syto_formatted: questionData,
            updated_at: new Date().toISOString()
        };
        const { data, error } = await supabase
            .from('student_questions')
            .insert(questionRecord)
            .select()
            .single();
        if (error) {
            throw new Error(`Failed to save student question: ${error.message}`);
        }
        return data;
    }
    /**
     * Get all questions for a student exercise
     */
    static async getStudentQuestions(studentId, exerciseId) {
        const { data, error } = await supabase
            .from('student_questions')
            .select('*')
            .eq('student_id', studentId)
            .eq('student_exercise_id', exerciseId)
            .order('order_index', { ascending: true });
        if (error) {
            throw new Error(`Failed to fetch student questions: ${error.message}`);
        }
        return data || [];
    }
    /**
     * Get a specific question by ID for a student
     */
    static async getQuestionById(studentId, questionId) {
        const { data, error } = await supabase
            .from('student_questions')
            .select('*')
            .eq('student_id', studentId)
            .eq('id', questionId)
            .single();
        if (error) {
            console.error('Error getting question by ID:', error);
            return null;
        }
        return data;
    }
    /**
     * Get next question for student to work on
     */
    static async getNextQuestion(studentId, subject) {
        // Find the first incomplete question for the student
        const { data, error } = await supabase
            .from('student_questions')
            .select(`
        *,
        student_exercises!inner(
          student_topics!inner(
            student_modules!inner(subject)
          )
        )
      `)
            .eq('student_id', studentId)
            .eq('student_exercises.student_topics.student_modules.subject', subject)
            .not('id', 'in', `(
        SELECT student_question_id 
        FROM student_progress 
        WHERE student_id = '${studentId}' 
        AND status = 'completed'
        AND student_question_id IS NOT NULL
      )`)
            .order('created_at', { ascending: true })
            .limit(1)
            .single();
        if (error) {
            console.error('Error getting next question:', error);
            return null;
        }
        return data;
    }
    // ============================================================================
    // PROGRESS TRACKING
    // ============================================================================
    /**
     * Record student progress on a question
     */
    static async recordQuestionProgress(studentId, questionId, answer, isCorrect, timeSpent, hintsUsed = 0) {
        const progressRecord = {
            student_id: studentId,
            student_question_id: questionId,
            status: isCorrect ? 'completed' : 'needs_review',
            score: isCorrect ? 100 : 0,
            attempts: 1,
            time_spent_seconds: timeSpent,
            student_answer: answer,
            is_correct: isCorrect,
            hints_used: hintsUsed,
            started_at: new Date().toISOString(),
            completed_at: new Date().toISOString(),
            last_accessed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        const { data, error } = await supabase
            .from('student_progress')
            .upsert(progressRecord, {
            onConflict: 'student_id,student_question_id',
            ignoreDuplicates: false
        })
            .select()
            .single();
        if (error) {
            throw new Error(`Failed to record question progress: ${error.message}`);
        }
        return data;
    }
    /**
     * Get student's progress for a specific module
     */
    static async getModuleProgress(studentId, moduleId) {
        const { data, error } = await supabase
            .rpc('get_student_learning_path_progress', {
            student_uuid: studentId,
            subject_name: 'english' // This would need to be dynamic based on module
        });
        if (error) {
            throw new Error(`Failed to get module progress: ${error.message}`);
        }
        // Process the data to return summary statistics
        const moduleData = data?.find((item) => item.module_id === moduleId);
        return {
            totalQuestions: moduleData?.total_questions || 0,
            completedQuestions: moduleData?.questions_completed || 0,
            averageScore: moduleData?.average_score || 0,
            timeSpent: 0 // Would need to calculate from progress records
        };
    }
    /**
     * Get student's learning analytics
     */
    static async getLearningAnalytics(studentId, subject) {
        let query = supabase
            .from('student_learning_analytics')
            .select('*')
            .eq('student_id', studentId);
        if (subject) {
            query = query.eq('subject', subject);
        }
        const { data, error } = await query;
        if (error) {
            throw new Error(`Failed to fetch learning analytics: ${error.message}`);
        }
        return data || [];
    }
    // ============================================================================
    // GENERATION LOGGING
    // ============================================================================
    /**
     * Log a content generation request
     */
    static async logGeneration(studentId, generationType, requestData, generationPrompt, chaleResponse, sytoFormatted, success = true, errorMessage, generationTimeMs, tokensUsed) {
        const logRecord = {
            student_id: studentId,
            generation_type: generationType,
            request_data: requestData,
            generation_prompt: generationPrompt,
            chale_response: chaleResponse,
            syto_formatted: sytoFormatted,
            generation_success: success,
            error_message: errorMessage,
            generation_time_ms: generationTimeMs,
            tokens_used: tokensUsed
        };
        const { data, error } = await supabase
            .from('chale_generation_log')
            .insert(logRecord)
            .select()
            .single();
        if (error) {
            throw new Error(`Failed to log generation: ${error.message}`);
        }
        return data;
    }
    /**
     * Get generation history for a student
     */
    static async getGenerationHistory(studentId, generationType, limit = 50) {
        let query = supabase
            .from('chale_generation_log')
            .select('*')
            .eq('student_id', studentId)
            .order('created_at', { ascending: false })
            .limit(limit);
        if (generationType) {
            query = query.eq('generation_type', generationType);
        }
        const { data, error } = await query;
        if (error) {
            throw new Error(`Failed to fetch generation history: ${error.message}`);
        }
        return data || [];
    }
    // ============================================================================
    // UTILITY FUNCTIONS
    // ============================================================================
    /**
     * Check if student has existing content for a subject/grade
     */
    static async hasExistingContent(studentId, subject, gradeLevel) {
        const { data, error } = await supabase
            .from('student_modules')
            .select('id')
            .eq('student_id', studentId)
            .eq('subject', subject)
            .eq('grade_level', gradeLevel)
            .limit(1);
        if (error) {
            console.error('Error checking existing content:', error);
            return false;
        }
        return (data?.length || 0) > 0;
    }
    /**
     * Get student's current learning streak
     */
    static async getLearningStreak(studentId) {
        const { data, error } = await supabase
            .from('student_learning_analytics')
            .select('learning_streak_days')
            .eq('student_id', studentId)
            .order('updated_at', { ascending: false })
            .limit(1)
            .single();
        if (error || !data) {
            return 0;
        }
        return data.learning_streak_days || 0;
    }
}
