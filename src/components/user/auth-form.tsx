import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";

interface AuthFormProps {
  isLogin?: boolean;
}

export function AuthForm({ isLogin = true }: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword] = useState("");
  const [name, setName] = useState("");
  const [grade, setGrade] = useState<number>(4);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    return () => {
      setLoading(false);
    };
  }, []);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const navigate = useNavigate();
  


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (showForgotPassword) {
        // Handle password reset with correct redirect URL
        // Determine the correct redirect URL based on environment
        const isProduction = window.location.hostname !== 'localhost';
        const redirectUrl = isProduction 
          ? 'https://syto.online/reset-password'
          : `${window.location.origin}/reset-password`;
        
        console.log('Sending password reset with redirect URL:', redirectUrl);
        
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: redirectUrl,
        });

        if (error) throw error;
        
        setSuccess("Password reset email sent! Please check your inbox and follow the instructions.");
        setShowForgotPassword(false);
      } else if (isLogin) {
        // Sign in
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        setSuccess("Login successful!");
        navigate("/dashboard");
      } else {
        if (!email || !password || !confirmPassword || !name) {
          setError("Please fill in all required fields");
          setLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          setError("Passwords do not match");
          setLoading(false);
          return;
        }
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: name,
              grade_level: grade,
            },
          },
        });
        if (error) throw error;
        setSuccess("Signup successful! Check your email for verification.");
        if (data.user) {
          const { error: profileError } = await supabase.from("profiles").insert([
            {
              id: data.user.id,
              username: name,
              grade_level: grade,
              created_at: new Date().toISOString(),
            },
          ]);
          if (profileError) throw profileError;
        }
        navigate("/dashboard");
      }
    } catch (error: any) {
      setError(error.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setShowForgotPassword(false);
    setError(null);
    setSuccess(null);
    setEmail("");
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      {/* Theme Toggle */}
      <div className="fixed top-0 left-0 right-0 z-50 border-b bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-end">
          <ThemeToggle />
        </div>
      </div>

      <div className="mx-auto w-full max-w-md space-y-8 rounded-xl border bg-card p-8 shadow-lg">
        <div className="flex flex-col items-center justify-center space-y-2 text-center">
          <Logo size="lg" />
          <h1 className="text-2xl font-bold">
            {showForgotPassword
              ? "Reset Your Password"
              : isLogin
              ? "Welcome back to Syto"
              : "Join Syto Learning Platform"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {showForgotPassword
              ? "Enter your email address and we'll send you a link to reset your password"
              : isLogin
              ? "Sign in to continue your learning journey"
              : "Create an account to start learning"}
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-error-100 p-3 text-sm text-error-600 dark:bg-error-900/30 dark:text-error-400">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-md bg-success-100 p-3 text-sm text-success-600 dark:bg-success-900/30 dark:text-success-400">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && !showForgotPassword && (
            <div className="space-y-2">
              <label
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                htmlFor="name"
              >
                Full Name
              </label>
              <input
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                id="name"
                placeholder="John Doe"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}

          <div className="space-y-2">
            <label
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              htmlFor="email"
            >
              Email
            </label>
            <input
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              id="email"
              type="email"
              placeholder="student@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {!showForgotPassword && (
            <div className="space-y-2">
              <label
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                htmlFor="password"
              >
                Password
              </label>
              <input
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          )}

          {!isLogin && !showForgotPassword && (
            <div className="space-y-2">
              <label
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                htmlFor="grade"
              >
                Grade Level
              </label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                id="grade"
                value={grade}
                onChange={(e) => setGrade(Number(e.target.value))}
              >
                <option value={4}>Primary 4</option>
                <option value={5}>Primary 5</option>
                <option value={6}>Primary 6</option>
              </select>
            </div>
          )}

          <Button
            type="submit"
            className="w-full bg-ghana-green hover:bg-ghana-green-dark dark:bg-ghana-green-dark dark:hover:bg-ghana-green text-white"
            variant="ghana"
            disabled={loading || !!success}
          >
            {/* Only show spinner if loading and no success message */}
            {loading && !success ? (
              <span className="flex items-center gap-2">
                <svg
                  className="h-4 w-4 animate-spin"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Signing In...
              </span>
            ) : showForgotPassword ? (
              "Send Reset Email"
            ) : isLogin ? (
              "Sign In"
            ) : (
              "Create Account"
            )}
          </Button>


        </form>

        <div className="mt-4 text-center text-sm space-y-2">
          {showForgotPassword ? (
            <button
              type="button"
              onClick={handleBackToLogin}
              className="font-medium text-ghana-green hover:text-ghana-green-dark dark:text-ghana-green dark:hover:text-ghana-green transition-colors"
            >
              Back to Sign In
            </button>
          ) : isLogin ? (
            <>
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="font-medium text-ghana-green hover:text-ghana-green-dark dark:text-ghana-green dark:hover:text-ghana-green transition-colors"
              >
                Forgot Password?
              </button>
              <p className="mt-2">
                Don't have an account?{" "}
                <a
                  href="/signup"
                  className="font-medium text-ghana-green hover:text-ghana-green-dark dark:text-ghana-green dark:hover:text-ghana-green transition-colors"
                >
                  Create one
                </a>
              </p>
            </>
          ) : (
            <p>
              Already have an account?{" "}
              <a
                href="/login"
                className="font-medium text-ghana-green hover:text-ghana-green-dark dark:text-ghana-green dark:hover:text-ghana-green transition-colors"
              >
                Sign in
              </a>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}