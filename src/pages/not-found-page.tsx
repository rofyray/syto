import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { useAuthStore } from "@/stores/auth-store";
import { useEffect, useState } from "react";

export function NotFoundPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [canGoBack, setCanGoBack] = useState(false);

  useEffect(() => {
    // Check if there's history to go back to
    // window.history.length > 1 means there are previous pages
    setCanGoBack(window.history.length > 1);
  }, []);

  const handleGoBack = () => {
    // Try to go back in browser history
    if (canGoBack) {
      navigate(-1);
    } else {
      // Fallback: If no history, go to appropriate default page
      if (user) {
        navigate("/dashboard");
      } else {
        navigate("/");
      }
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
      <Logo size="lg" />
      <h1 className="mt-6 text-4xl font-bold">Page Not Found</h1>
      <p className="mt-2 text-muted-foreground">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <div className="mt-8 flex space-x-4">
        <Button variant="ghana" onClick={() => navigate("/")}>
          Go Home
        </Button>
        <Button variant="outline" onClick={handleGoBack}>
          {canGoBack ? "Go Back" : user ? "Go to Dashboard" : "Go Home"}
        </Button>
      </div>
    </div>
  );
}