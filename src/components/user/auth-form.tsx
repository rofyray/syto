import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
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
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
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
        if (!email || !password || !confirmPassword || !firstName || !lastName) {
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
              first_name: firstName,
              last_name: lastName,
              grade_level: grade,
            },
          },
        });
        if (error) throw error;
        setSuccess("Signup successful! Check your email for verification.");
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
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-ghana-green/10 via-ghana-gold/5 to-ghana-red/10 dark:from-gray-900 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -right-1/4 w-96 h-96 bg-ghana-gold/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-1/2 -left-1/4 w-96 h-96 bg-ghana-green/20 rounded-full blur-3xl"></div>
      </div>

      {/* Theme Toggle */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-md animate-scale-in">
        {/* Glass card */}
        <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/20 dark:border-white/10 shadow-glass-xl">
          <div className="flex flex-col items-center justify-center space-y-2 text-center mb-6">
            <Link to="/" className="cursor-pointer hover:opacity-80 transition-opacity">
              <Logo size="lg" />
            </Link>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-ghana-green to-ghana-gold bg-clip-text text-transparent">
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
            <div className="rounded-2xl bg-error-100/80 dark:bg-error-900/30 backdrop-blur-sm p-3 text-sm text-error-600 dark:text-error-400 border border-error-200 dark:border-error-800 mb-4">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-2xl bg-success-100/80 dark:bg-success-900/30 backdrop-blur-sm p-3 text-sm text-success-600 dark:text-success-400 border border-success-200 dark:border-success-800 mb-4">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && !showForgotPassword && (
              <div className="space-y-2">
                <label
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  htmlFor="firstName"
                >
                  First Name
                </label>
                <input
                  className="flex h-11 w-full rounded-xl border border-white/20 dark:border-white/10 bg-white/50 dark:bg-white/5 backdrop-blur-sm px-4 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ghana-green dark:focus:ring-ghana-green-light focus:border-transparent transition-all"
                  id="firstName"
                  type="text"
                  placeholder="Enter your first name"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
            )}

            {!isLogin && !showForgotPassword && (
              <div className="space-y-2">
                <label
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  htmlFor="lastName"
                >
                  Last Name
                </label>
                <input
                  className="flex h-11 w-full rounded-xl border border-white/20 dark:border-white/10 bg-white/50 dark:bg-white/5 backdrop-blur-sm px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ghana-green dark:focus:ring-ghana-green-light focus:border-transparent transition-all"
                  id="lastName"
                  type="text"
                  placeholder="Enter your last name"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
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
                className="flex h-11 w-full rounded-xl border border-white/20 dark:border-white/10 bg-white/50 dark:bg-white/5 backdrop-blur-sm px-4 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ghana-green dark:focus:ring-ghana-green-light focus:border-transparent transition-all"
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
                  className="flex h-11 w-full rounded-xl border border-white/20 dark:border-white/10 bg-white/50 dark:bg-white/5 backdrop-blur-sm px-4 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ghana-green dark:focus:ring-ghana-green-light focus:border-transparent transition-all"
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
                  htmlFor="confirmPassword"
                >
                  Confirm Password
                </label>
                <input
                  className="flex h-11 w-full rounded-xl border border-white/20 dark:border-white/10 bg-white/50 dark:bg-white/5 backdrop-blur-sm px-4 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ghana-green dark:focus:ring-ghana-green-light focus:border-transparent transition-all"
                  id="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
                  className="flex h-11 w-full rounded-xl border border-white/20 dark:border-white/10 bg-white/50 dark:bg-white/5 backdrop-blur-sm px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ghana-green dark:focus:ring-ghana-green-light focus:border-transparent transition-all cursor-pointer"
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
              size="lg"
              className="w-full h-12 mt-6 bg-gradient-to-r from-ghana-green to-ghana-green-light hover:from-ghana-green-dark hover:to-ghana-green text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 font-semibold"
              disabled={loading || !!success}
            >
              {/* Only show spinner if loading and no success message */}
              {loading && !success ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="h-5 w-5 animate-spin"
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

          <div className="mt-6 text-center text-sm space-y-2">
            {showForgotPassword ? (
              <button
                type="button"
                onClick={handleBackToLogin}
                className="font-medium text-ghana-green hover:text-ghana-gold dark:text-ghana-green-light dark:hover:text-ghana-gold transition-colors"
              >
                Back to Sign In
              </button>
            ) : isLogin ? (
              <>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="font-medium text-ghana-green hover:text-ghana-gold dark:text-ghana-green-light dark:hover:text-ghana-gold transition-colors"
                >
                  Forgot Password?
                </button>
                <p className="mt-2">
                  Don't have an account?{" "}
                  <a
                    href="/signup"
                    className="font-medium text-ghana-green hover:text-ghana-gold dark:text-ghana-green-light dark:hover:text-ghana-gold transition-colors"
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
                  className="font-medium text-ghana-green hover:text-ghana-gold dark:text-ghana-green-light dark:hover:text-ghana-gold transition-colors"
                >
                  Sign in
                </a>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}