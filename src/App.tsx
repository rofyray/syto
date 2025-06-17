import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth-store';

// Pages
import { HomePage } from '@/pages/home-page';
import { LoginPage } from '@/pages/login-page';
import { SignupPage } from '@/pages/signup-page';
import { ResetPasswordPage } from '@/pages/reset-password-page';
import { DashboardPage } from '@/pages/dashboard-page';
import { EnglishPage } from '@/pages/english-page';
import { MathematicsPage } from '@/pages/mathematics-page';
import { ChalePage } from '@/pages/chale-page';
import { NotFoundPage } from '@/pages/not-found-page';


function App() {
  const { initialize, initialized } = useAuthStore();

  useEffect(() => {
    if (!initialized) {
      initialize();
    }
  }, [initialize, initialized]);

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/english" element={<EnglishPage />} />
      <Route path="/mathematics" element={<MathematicsPage />} />
      <Route path="/chale" element={<ChalePage />} />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;