import { createClient } from '@supabase/supabase-js';
/**
 * Authentication middleware for Chale API
 * Integrates with Supabase authentication system
 */
// Create a Supabase client with fallback for testing
let supabase;
try {
    // Try to create a real client
    if (process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_ANON_KEY) {
        supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
    }
    else {
        console.warn('Supabase credentials not found, using mock implementation');
        // Create a mock implementation for testing
        supabase = {
            auth: {
                getUser: async () => ({ data: { user: null }, error: null }),
            },
            from: () => ({
                select: () => ({
                    eq: () => ({
                        single: async () => ({ data: null, error: null }),
                    }),
                }),
                insert: async () => ({ data: null, error: null }),
            }),
        };
    }
}
catch (error) {
    console.error('Error initializing Supabase client:', error);
    // Provide a fallback mock implementation
    supabase = {
        auth: {
            getUser: async () => ({ data: { user: null }, error: null }),
        },
        from: () => ({
            select: () => ({
                eq: () => ({
                    single: async () => ({ data: null, error: null }),
                }),
            }),
            insert: async () => ({ data: null, error: null }),
        }),
    };
}
/**
 * Middleware to verify JWT token and extract user information
 */
export const authenticateUser = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({
                error: 'Authentication required',
                message: 'Please provide a valid authentication token'
            });
            return;
        }
        const token = authHeader.substring(7); // Remove 'Bearer ' prefix
        // Verify the JWT token with Supabase
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error || !user) {
            res.status(401).json({
                error: 'Invalid authentication token',
                message: 'The provided token is invalid or expired'
            });
            return;
        }
        // Fetch user profile from database
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
        if (profileError) {
            console.warn('Could not fetch user profile:', profileError);
        }
        // Attach user information to request
        req.user = {
            id: user.id,
            email: user.email,
            grade_level: profile?.grade_level || 4,
            profile: profile
        };
        next();
    }
    catch (error) {
        console.error('Authentication error:', error);
        res.status(500).json({
            error: 'Authentication service error',
            message: 'Unable to verify authentication token'
        });
        return;
    }
};
/**
 * Optional authentication middleware - allows both authenticated and anonymous access
 */
export const optionalAuth = (req, res, next) => {
    console.log('Executing placeholder optionalAuth middleware.');
    next();
};
/**
 * Middleware to check if user has appropriate grade level for content
 */
export const validateGradeAccess = (req, res, next) => {
    const requestedGrade = Number(req.body.grade || req.query.grade);
    const userGrade = req.user?.grade_level;
    if (!requestedGrade || ![4, 5, 6].includes(requestedGrade)) {
        res.status(400).json({
            error: 'Invalid grade level',
            message: 'Grade must be 4, 5, or 6'
        });
        return;
    }
    // If user is authenticated, check if they can access this grade level
    if (req.user && userGrade) {
        // Allow access to current grade and one level above/below
        const allowedGrades = [userGrade - 1, userGrade, userGrade + 1].filter(g => g >= 4 && g <= 6);
        if (!allowedGrades.includes(requestedGrade)) {
            res.status(403).json({
                error: 'Grade access denied',
                message: `You can only access content for grades ${allowedGrades.join(', ')}`
            });
            return;
        }
    }
    next();
};
/**
 * Middleware to log user activity for analytics
 */
export const logUserActivity = async (req, res, next) => {
    try {
        if (req.user) {
            // Log the activity to Supabase (optional - for analytics)
            await supabase
                .from('user_activity')
                .insert({
                user_id: req.user.id,
                action: `${req.method} ${req.path}`,
                metadata: {
                    subject: req.body.subject,
                    grade: req.body.grade,
                    content_type: req.body.type || req.body.contentType,
                    timestamp: new Date().toISOString()
                }
            });
        }
    }
    catch (error) {
        // Don't fail the request if logging fails
        console.warn('Failed to log user activity:', error);
    }
    next();
};
