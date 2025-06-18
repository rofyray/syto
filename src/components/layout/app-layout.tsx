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
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-ghana-green border-t-transparent mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
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
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 pt-16">{children}</main>
      <Footer />
    </div>
  );
}