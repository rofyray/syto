import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from "@/stores/auth-store";

// Import real page components
import { HomePage } from '@/pages/home-page';
import { DashboardPage } from '@/pages/dashboard-page';
import { EnglishPage } from '@/pages/english-page';
import { MathematicsPage } from "@/pages/mathematics-page";
import { QuestionsPage } from "@/pages/questions-page";

import { LoginPage } from '@/pages/login-page';
import { SignupPage } from '@/pages/signup-page';
import { ResetPasswordPage } from '@/pages/reset-password-page';
import { ProfilePage } from '@/pages/profile-page';
import { NotFoundPage } from '@/pages/not-found-page';
import { ChalePage } from '@/pages/chale-page';

// Auth protection wrapper component
interface ProtectedRouteProps {
  element: React.ReactNode;
}

function ProtectedRoute({ element }: ProtectedRouteProps) {
  const { user, initialized } = useAuthStore();
  
  // If auth is still initializing, show nothing
  if (!initialized) {
    return null;
  }
  
  // If not logged in, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // Otherwise, render the protected component
  return <>{element}</>;
}

function App() {
  // Add auth initialization
  const { initialize, initialized } = useAuthStore();
  const [initAttempted, setInitAttempted] = useState(false);
  
  useEffect(() => {
    if (!initialized && !initAttempted) {
      console.log('App: Initializing auth store...');
      initialize();
      setInitAttempted(true);
    }
  }, [initialize, initialized, initAttempted]);
  
  console.log('App rendering - Auth initialized:', initialized);
  
  return (
    <div className="min-h-screen bg-background theme-transition">
      {!initialized && (
        <div className="fixed inset-0 flex items-center justify-center bg-background/90 backdrop-blur-sm theme-transition">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="mt-2 text-muted-foreground">Initializing application...</p>
          </div>
        </div>
      )}
      
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        
        {/* Protected routes */}
        <Route path="/dashboard" element={<ProtectedRoute element={<DashboardPage />} />} />
        <Route path="/english" element={<ProtectedRoute element={<EnglishPage />} />} />
        <Route path="/mathematics" element={<ProtectedRoute element={<MathematicsPage />} />} />
        <Route path="/questions" element={<ProtectedRoute element={<QuestionsPage />} />} />

        <Route path="/profile" element={<ProtectedRoute element={<ProfilePage />} />} />
        <Route path="/chale" element={<ProtectedRoute element={<ChalePage />} />} />
        
        {/* 404 route */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </div>
  );
}

export default App;