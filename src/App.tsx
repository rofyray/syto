import { useEffect } from 'react';
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
import { NAANOPage } from '@/pages/naano-page';
import { HelpCenterPage } from '@/pages/help-center-page';
import { PrivacyPolicyPage } from '@/pages/privacy-policy-page';
import { TermsOfServicePage } from '@/pages/terms-of-service-page';
import { AuthSelectionPage } from '@/pages/auth-selection-page';

// Auth protection wrapper component
interface ProtectedRouteProps {
  element: React.ReactNode;
}

function ProtectedRoute({ element }: ProtectedRouteProps) {
  const { user, initialized } = useAuthStore();

  if (!initialized) {
    return null; // Wait for auth check before deciding
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{element}</>;
}

function App() {
  // Initialize auth immediately on mount
  const { initialize } = useAuthStore();

  useEffect(() => {
    // Run initialization immediately, don't wait
    initialize();
  }, [initialize]);

  return (
    <div className="min-h-screen bg-background theme-transition">
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/get-started" element={<AuthSelectionPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/help" element={<HelpCenterPage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/terms" element={<TermsOfServicePage />} />

        {/* Protected routes */}
        <Route path="/dashboard" element={<ProtectedRoute element={<DashboardPage />} />} />
        <Route path="/english" element={<ProtectedRoute element={<EnglishPage />} />} />
        <Route path="/mathematics" element={<ProtectedRoute element={<MathematicsPage />} />} />
        <Route path="/questions" element={<ProtectedRoute element={<QuestionsPage />} />} />

        <Route path="/profile" element={<ProtectedRoute element={<ProfilePage />} />} />
        <Route path="/naano" element={<ProtectedRoute element={<NAANOPage />} />} />
        
        {/* 404 route */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </div>
  );
}

export default App;