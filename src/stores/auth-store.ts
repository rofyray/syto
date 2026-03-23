import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import { useNaanoStore } from "@/stores/naano-store";

interface AuthState {
  user: any | null;
  profile: any | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
  
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, userData: any) => Promise<void>;
  logout: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  updateProfile: (data: any) => Promise<void>;
}

const createDefaultProfile = async (userId: string, userEmail: string, userMetadata?: any) => {
  const defaultProfile = {
    id: userId,
    first_name: userMetadata?.first_name || userEmail?.split('@')[0] || 'New',
    last_name: userMetadata?.last_name || '',
    username: userMetadata?.first_name
      ? `${userMetadata.first_name} ${userMetadata.last_name || ''}`.trim()
      : userEmail?.split('@')[0] || 'New User',
    grade_level: userMetadata?.grade_level || 4,
    created_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('profiles')
    .insert([defaultProfile])
    .select()
    .single();

  if (error) {
    console.error('Error creating default profile:', error);
    return null;
  }

  return data;
};

const fetchOrCreateProfile = async (userId: string, userEmail: string, userMetadata?: any) => {
  // First try to fetch existing profile
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  // If profile exists, return it
  if (profile && !error) {
    return profile;
  }

  // If no profile exists (PGRST116 error), create a default one
  if (error && error.code === 'PGRST116') {
    console.log('No profile found for user, creating default profile...');
    return await createDefaultProfile(userId, userEmail, userMetadata);
  }

  // If there's a different error, log it and return null
  if (error) {
    console.error('Error fetching profile:', error);
  }

  return null;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  loading: false,
  error: null,
  initialized: false,

  initialize: async () => {
    try {
      console.log('AUTH STORE: Beginning initialization');
      set({ error: null });
      
      // Get current session first
      console.log('AUTH STORE: Fetching session');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('AUTH STORE: Error getting session:', sessionError);
        set({ error: sessionError.message });
        return; // finally block will still set initialized: true
      }
      
      if (session?.user) {
        console.log('AUTH STORE: Found existing session for user:', session.user.email);
        set({ user: session.user });
        
        // Fetch or create user profile
        console.log('AUTH STORE: Fetching or creating profile');
        const profile = await fetchOrCreateProfile(session.user.id, session.user.email || '', session.user.user_metadata);
        console.log('AUTH STORE: Profile data:', profile);
        set({ profile });
      } else {
        console.log('AUTH STORE: No existing session found, proceeding as guest');
        set({ user: null, profile: null });
      }

      console.log('AUTH STORE: Initialization complete');
    } catch (error: any) {
      console.error('AUTH STORE: Error initializing auth:', error);
      set({ error: error.message });
    } finally {
      set({ initialized: true });
    }
    
    // Set up auth state change listener AFTER initial session check
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email || 'no user');

      const user = session?.user || null;

      // Handle sign out events
      if (event === 'SIGNED_OUT') {
        console.log('User signed out, clearing state');
        set({ user: null, profile: null });
        return;
      }

      // Handle token refresh failures
      if (event === 'TOKEN_REFRESHED' && !session) {
        console.warn('Token refresh failed, session expired');
        set({ user: null, profile: null });
        return;
      }

      // Update user state without blocking
      set({ user });

      if (user) {
        // Fetch or create user profile - let it take as long as needed
        try {
          const profile = await fetchOrCreateProfile(user.id, user.email || '', user.user_metadata);
          set({ profile });
        } catch (error) {
          console.error('Error fetching profile after auth change:', error);
          // Set profile to null but keep user logged in
          // Supabase will handle session expiry automatically
          set({ profile: null });
        }
      } else {
        set({ profile: null });
      }
    });
    
    // Store subscription for cleanup if needed
    (window as any).__authSubscription = subscription;
  },
  
  login: async (email, password) => {
    try {
      set({ loading: true, error: null });
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      console.log('Login successful for:', email);
      set({ user: data.user });
      
      // Fetch or create profile after login
      const profile = await fetchOrCreateProfile(data.user.id, data.user.email || '', data.user.user_metadata);
      set({ profile });
    } catch (error: any) {
      console.error('Login error:', error);
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },
  
  signup: async (email, password, userData) => {
    try {
      set({ loading: true, error: null });
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData,
        },
      });
      
      if (error) throw error;
      
      console.log('Signup successful for:', email);
      
      // Profile is auto-created by database trigger on auth.users insert
      if (data.user) {
        set({ user: data.user });
        await get().fetchProfile();
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },
  
  logout: async () => {
    try {
      set({ loading: true, error: null });
      console.log('Logging out user');

      // Sign out with timeout to prevent hanging
      const signOutPromise = supabase.auth.signOut();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Logout timeout')), 5000)
      );

      try {
        await Promise.race([signOutPromise, timeoutPromise]);
      } catch (error) {
        console.warn('Logout may have timed out, clearing local state anyway:', error);
      }

      // Always clear local state regardless of API response
      set({ user: null, profile: null, loading: false });
      useNaanoStore.getState().clearMessages();

      // Force redirect to login page
      window.location.href = '/login';
    } catch (error: any) {
      console.error('Logout error:', error);
      // Even on error, clear state and redirect
      set({ user: null, profile: null, error: error.message, loading: false });
      window.location.href = '/login';
    }
  },
  
  fetchProfile: async () => {
    const { user } = get();
    if (!user) return;
    
    try {
      const profile = await fetchOrCreateProfile(user.id, user.email || '', user.user_metadata);
      set({ profile });
    } catch (error: any) {
      console.error('Error fetching profile:', error);
    }
  },
  
  updateProfile: async (data) => {
    const { user } = get();
    if (!user) return;
    
    try {
      set({ loading: true, error: null });
      
      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', user.id);
      
      if (error) throw error;
      
      await get().fetchProfile();
    } catch (error: any) {
      console.error('Update profile error:', error);
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },
}));