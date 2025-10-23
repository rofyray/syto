import Anthropic from '@anthropic-ai/sdk';
import { supabase } from '../../supabase.js';
import { ProgressTrackerToolSchema, type ProgressTrackingResult } from '../types.js';

/**
 * Progress Tracker Tool Definition
 * Allows NAANO to record student progress in the database
 */
export const progressTrackerTool: Anthropic.Tool = {
  name: 'track_progress',
  description: `Record student learning progress in the database to track their educational journey.

**When to use this tool:**
- When a student completes a quiz or exercise
- After they finish practicing questions you generated
- When they complete a learning activity or topic
- To record their performance and progress

**What gets tracked:**
- Student's score on the activity (0-100 percentage)
- Whether they completed the module/exercise
- Timestamp of completion (automatically recorded)
- Module/topic they worked on

**Why tracking matters:**
- Helps students see their progress over time
- Allows personalized teaching based on their strengths/weaknesses
- Enables teachers and parents to monitor learning
- Motivates students by showing improvement
- Identifies areas where students need more support

**When NOT to use:**
- During exploratory chat conversations (no assessment)
- When explaining concepts without testing (no completion)
- When student is just asking questions (not completing an activity)

**Note:** Only use this when you have actual student assessment data to record. Don't use it for hypothetical or example scenarios.`,
  input_schema: {
    type: 'object',
    properties: {
      studentId: {
        type: 'string',
        description: 'The student\'s unique user ID (UUID format). This identifies which student\'s progress to track. You should have this from the conversation context.',
      },
      moduleId: {
        type: 'string',
        description: 'The unique ID of the module, topic, or exercise the student completed. This identifies what they worked on. Format: typically a UUID or structured identifier like "math-grade5-fractions".',
      },
      score: {
        type: 'number',
        description: 'The student\'s score as a percentage (0-100). Examples: If they got 4 out of 5 questions correct, score is 80. If they got 9 out of 10 correct, score is 90. Calculate: (correct answers / total questions) × 100.',
      },
      completed: {
        type: 'boolean',
        description: 'Whether the student completed the module/exercise. Set to true if they finished all questions/activities. Set to false if they started but didn\'t finish, or if this is a partial progress update.',
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
  description: `Retrieve student's learning history, progress, and performance analytics from the database.

**When to use this tool:**
- When a student asks "How am I doing?" or "What's my progress?"
- To personalize your teaching based on their strengths and weaknesses
- When you want to identify topics they've mastered vs. topics they struggle with
- To provide encouragement by showing their improvement over time
- When recommending what they should study next based on past performance

**What information you'll get:**
- List of all activities/modules the student has completed
- Their scores on each activity (to identify patterns)
- Which topics they've completed vs. not started
- Average performance across subjects
- Completion statistics

**How to use the results:**
- Celebrate their achievements and progress
- Identify weak areas where they need more practice
- Recommend specific topics to review
- Personalize difficulty of new questions based on past performance
- Provide targeted encouragement for areas they're improving in

**Example usage scenarios:**
- Student: "What should I study today?" → Check their progress to see what they haven't completed or struggled with
- Student: "Am I getting better at fractions?" → Check their progress in math/fractions to show improvement over time
- Before generating questions → Check what they've already practiced to avoid repetition
- After they complete questions → Compare to previous performance to show growth

**Privacy note:** Progress data is private to each student. Only use it to help that specific student learn better.`,
  input_schema: {
    type: 'object',
    properties: {
      studentId: {
        type: 'string',
        description: 'The student\'s unique user ID (UUID format). This identifies whose progress to retrieve. You should have this from the conversation context with the student.',
      },
      subject: {
        type: 'string',
        enum: ['english', 'mathematics', 'all'],
        description: 'Filter results by subject. Choose "mathematics" to see only math progress, "english" to see only English progress, or "all" to see progress across both subjects. Use "all" when providing overall progress summary. Use specific subject when student asks about performance in that subject.',
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
