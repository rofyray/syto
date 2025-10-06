import Anthropic from '@anthropic-ai/sdk';
import { supabase } from '../../supabase';
import { ProgressTrackerToolSchema, type ProgressTrackingResult } from '../types';

/**
 * Progress Tracker Tool Definition
 * Allows NAANO to record student progress in the database
 */
export const progressTrackerTool: Anthropic.Tool = {
  name: 'track_progress',
  description: 'Record student learning progress in the database. Use this when a student completes a quiz, exercise, or learning activity.',
  input_schema: {
    type: 'object',
    properties: {
      studentId: {
        type: 'string',
        description: 'Student user ID (UUID)',
      },
      moduleId: {
        type: 'string',
        description: 'Module ID being studied',
      },
      score: {
        type: 'number',
        description: 'Score achieved (0-100)',
      },
      completed: {
        type: 'boolean',
        description: 'Whether the exercise/module was completed',
      },
    },
    required: ['studentId', 'moduleId', 'score', 'completed'],
  },
};

/**
 * Handle progress tracking tool execution
 */
export async function handleProgressTracking(input: unknown): Promise<string> {
  try {
    // Validate input
    const params = ProgressTrackerToolSchema.parse(input);

    // Update progress in Supabase
    const { error } = await supabase
      .from('user_progress')
      .upsert({
        user_id: params.studentId,
        module_id: params.moduleId,
        score: params.score,
        completed: params.completed,
        completion_date: params.completed ? new Date().toISOString() : null,
      }, {
        onConflict: 'user_id,module_id',
      });

    if (error) {
      const result: ProgressTrackingResult = {
        success: false,
        error: error.message,
      };
      return JSON.stringify(result);
    }

    const result: ProgressTrackingResult = {
      success: true,
      message: `Progress recorded successfully for student ${params.studentId}`,
    };

    return JSON.stringify(result);
  } catch (error) {
    console.error('Error tracking progress:', error);
    return JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
}

/**
 * Get Student Progress Tool (optional, for querying)
 */
export const getStudentProgressTool: Anthropic.Tool = {
  name: 'get_student_progress',
  description: 'Retrieve student learning progress and analytics from the database',
  input_schema: {
    type: 'object',
    properties: {
      studentId: {
        type: 'string',
        description: 'Student user ID (UUID)',
      },
      subject: {
        type: 'string',
        enum: ['english', 'mathematics', 'all'],
        description: 'Filter by subject (optional)',
      },
    },
    required: ['studentId'],
  },
};

/**
 * Handle getting student progress
 */
export async function handleGetStudentProgress(input: any): Promise<string> {
  try {
    const { studentId, subject } = input;

    let query = supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', studentId);

    if (subject && subject !== 'all') {
      query = query.like('module_id', `${subject}%`);
    }

    const { data, error } = await query;

    if (error) {
      return JSON.stringify({
        success: false,
        error: error.message,
      });
    }

    // Calculate statistics
    const completed = data?.filter(p => p.completed).length || 0;
    const averageScore = data && data.length > 0
      ? data.reduce((sum, p) => sum + (p.score || 0), 0) / data.length
      : 0;

    return JSON.stringify({
      success: true,
      studentId,
      totalActivities: data?.length || 0,
      completed,
      averageScore: Math.round(averageScore),
      progress: data || [],
    });
  } catch (error) {
    console.error('Error getting student progress:', error);
    return JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
}
