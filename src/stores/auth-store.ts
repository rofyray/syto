import { create } from "zustand";
import { supabase } from "@/lib/supabase";

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

const createDefaultProfile = async (userId: string, userEmail: string) => {
  const defaultProfile = {
    id: userId,
    first_name: userEmail?.split('@')[0] || 'New',
    last_name: 'User',
    username: userEmail?.split('@')[0] || 'New User',
    grade_level: 4, // Default to grade 4
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

const fetchOrCreateProfile = async (userId: string, userEmail: string) => {
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
    return await createDefaultProfile(userId, userEmail);
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
  loading: true,
  error: null,
  initialized: false,
  
  initialize: async () => {
    try {
      set({ loading: true, error: null });
      
      // Get current session first
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Error getting session:', sessionError);
        set({ error: sessionError.message, loading: false, initialized: true });
        return;
      }
      
      if (session?.user) {
        console.log('Found existing session for user:', session.user.email);
        set({ user: session.user });
        
        // Fetch or create user profile
        const profile = await fetchOrCreateProfile(session.user.id, session.user.email || '');
        set({ profile });
      } else {
        console.log('No existing session found');
        set({ user: null, profile: null });
      }
      
      set({ loading: false, initialized: true });
    } catch (error: any) {
      console.error('Error initializing auth:', error);
      set({ error: error.message, loading: false, initialized: true });
    }
    
    // Set up auth state change listener AFTER initial session check
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email || 'no user');
      
      const user = session?.user || null;
      
      // Only set loading to true if we're transitioning between auth states
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        set({ user, loading: true });
      } else {
        set({ user });
      }
      
      if (user) {
        // Fetch or create user profile
        try {
          const profile = await fetchOrCreateProfile(user.id, user.email || '');
          set({ profile, loading: false });
        } catch (error) {
          console.error('Error fetching profile after auth change:', error);
          set({ profile: null, loading: false });
        }
      } else {
        set({ profile: null, loading: false });
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
      const profile = await fetchOrCreateProfile(data.user.id, data.user.email || '');
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
      
      // Create profile
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: data.user.id,
              first_name: userData.first_name,
              last_name: userData.last_name,
              username: userData.username || `${userData.first_name} ${userData.last_name}`.trim(),
              grade_level: userData.grade_level,
              created_at: new Date().toISOString(),
            },
          ]);
        
        if (profileError) throw profileError;
        
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
      await supabase.auth.signOut();
      set({ user: null, profile: null });
    } catch (error: any) {
      console.error('Logout error:', error);
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },
  
  fetchProfile: async () => {
    const { user } = get();
    if (!user) return;
    
    try {
      const profile = await fetchOrCreateProfile(user.id, user.email || '');
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