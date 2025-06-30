import { createClient } from '@supabase/supabase-js';
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-supabase-url.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key';
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
// Queries
export async function getUserProfile(userId) {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
    if (error) {
        console.error('Error fetching user profile:', error);
        return null;
    }
    return data;
}
export async function getModulesByGradeAndSubject(grade, subject) {
    const { data, error } = await supabase
        .from('modules')
        .select('*')
        .eq('grade_level', grade)
        .eq('subject', subject);
    if (error) {
        console.error('Error fetching modules:', error);
        return [];
    }
    return data;
}
export async function getTopicsByModuleId(moduleId) {
    const { data, error } = await supabase
        .from('topics')
        .select('*')
        .eq('module_id', moduleId);
    if (error) {
        console.error('Error fetching topics:', error);
        return [];
    }
    return data;
}
export async function getExercisesByTopicId(topicId) {
    const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .eq('topic_id', topicId);
    if (error) {
        console.error('Error fetching exercises:', error);
        return [];
    }
    return data;
}
export async function getQuestionsByExerciseId(exerciseId) {
    const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('exercise_id', exerciseId);
    if (error) {
        console.error('Error fetching questions:', error);
        return [];
    }
    return data;
}
export async function getUserProgressByUserId(userId) {
    const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId);
    if (error) {
        console.error('Error fetching user progress:', error);
        return [];
    }
    return data;
}
export async function updateUserProgress(progress) {
    const { error } = await supabase
        .from('user_progress')
        .upsert(progress);
    if (error) {
        console.error('Error updating user progress:', error);
        return false;
    }
    return true;
}
// Functions to save Chale-generated content
export async function saveModule(module) {
    const { data, error } = await supabase
        .from('modules')
        .insert(module)
        .select('id')
        .single();
    if (error) {
        console.error('Error saving module:', error);
        return null;
    }
    return data.id;
}
export async function saveTopic(topic) {
    const { data, error } = await supabase
        .from('topics')
        .insert(topic)
        .select('id')
        .single();
    if (error) {
        console.error('Error saving topic:', error);
        return null;
    }
    return data.id;
}
export async function saveExercise(exercise) {
    const { data, error } = await supabase
        .from('exercises')
        .insert(exercise)
        .select('id')
        .single();
    if (error) {
        console.error('Error saving exercise:', error);
        return null;
    }
    return data.id;
}
export async function saveQuestion(question) {
    const { data, error } = await supabase
        .from('questions')
        .insert(question)
        .select('id')
        .single();
    if (error) {
        console.error('Error saving question:', error);
        return null;
    }
    return data.id;
}
export async function saveQuestions(questions) {
    const { error } = await supabase
        .from('questions')
        .insert(questions);
    if (error) {
        console.error('Error saving questions:', error);
        return false;
    }
    return true;
}
// Helper function to save complete module with all nested content
export async function saveCompleteModule(moduleData) {
    try {
        // Save the module first
        const moduleId = await saveModule(moduleData.module);
        if (!moduleId)
            return false;
        // Save topics and their exercises/questions
        for (const topicData of moduleData.topics) {
            const topicId = await saveTopic({
                ...topicData.topic,
                module_id: moduleId
            });
            if (!topicId)
                return false;
            // Save exercises for this topic
            for (const exerciseData of topicData.exercises) {
                const exerciseId = await saveExercise({
                    ...exerciseData.exercise,
                    topic_id: topicId
                });
                if (!exerciseId)
                    return false;
                // Save questions for this exercise
                const questionsWithExerciseId = exerciseData.questions.map(q => ({
                    ...q,
                    exercise_id: exerciseId
                }));
                const questionsSuccess = await saveQuestions(questionsWithExerciseId);
                if (!questionsSuccess)
                    return false;
            }
        }
        return true;
    }
    catch (error) {
        console.error('Error saving complete module:', error);
        return false;
    }
}
