import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/stores/auth-store";
import { Header } from "./header";
import { Footer } from "./footer";

interface AppLayoutProps {
  children: ReactNode;
  requireAuth?: boolean;
}

export function AppLayout({ children, requireAuth = true }: AppLayoutProps) {
  const { user, loading, initialized } = useAuthStore();
  const location = useLocation();

  // Wait for auth to be initialized before making auth decisions
  if (!initialized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-4 text-ghana-green dark:text-ghana-gold">
            Loading...
          </h2>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ghana-green dark:border-ghana-gold mx-auto"></div>
        </div>
      </div>
    );
  }

  // Check if user is authenticated after initialization is complete
  if (requireAuth && !loading && !user) {
    // Redirect to login page and save the location they tried to access
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-ghana-green/5 via-ghana-gold/5 to-ghana-red/5 dark:from-gray-900 dark:via-gray-900 dark:to-gray-950">
      <Header />
      <main className="flex-1 pt-16">{children}</main>
      <Footer />
    </div>
  );
}