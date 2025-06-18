import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth-store';

// Pages
import { HomePage } from '@/pages/home-page';
import { LoginPage } from '@/pages/login-page';
import { SignupPage } from '@/pages/signup-page';
import { ResetPasswordPage } from '@/pages/reset-password-page';
import { DashboardPage } from '@/pages/dashboard-page';
import { ProfilePage } from '@/pages/profile-page';
import { EnglishPage } from '@/pages/english-page';
import { MathematicsPage } from '@/pages/mathematics-page';
import { ChalePage } from '@/pages/chale-page';
import { NotFoundPage } from '@/pages/not-found-page';

// Loading component
function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-ghana-green border-t-transparent mx-auto"></div>
        <p className="text-muted-foreground">Loading your session...</p>
      </div>
    </div>
  );
}

function App() {
  const { initialize, initialized, loading } = useAuthStore();

  useEffect(() => {
    if (!initialized) {
      initialize();
    }
  }, [initialize, initialized]);

  // Show loading screen while auth is initializing
  if (!initialized || loading) {
    return <LoadingScreen />;
  }

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/english" element={<EnglishPage />} />
      <Route path="/mathematics" element={<MathematicsPage />} />
      <Route path="/chale" element={<ChalePage />} />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;