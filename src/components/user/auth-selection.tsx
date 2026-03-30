import { useNavigate, Link } from "react-router-dom";
import { LogIn, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Logo } from "@/components/logo";

export function AuthSelection() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-ghana-green/10 via-ghana-gold/5 to-ghana-red/10 dark:from-gray-900 dark:via-gray-900 dark:to-gray-950">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -right-1/4 w-96 h-96 bg-ghana-gold/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-1/2 -left-1/4 w-96 h-96 bg-ghana-green/20 rounded-full blur-3xl"></div>
      </div>

      {/* Theme Toggle */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      {/* Logo - Top Left */}
      <div className="fixed top-4 left-4 z-50">
        <Link to="/" className="cursor-pointer hover:opacity-80 transition-opacity">
          <Logo />
        </Link>
      </div>

      {/* Content */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center p-4">
        <div className="w-full max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12 animate-slide-up">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-ghana-green to-ghana-gold bg-clip-text text-transparent">
              Access Your Profile
            </h1>
            <p className="text-lg text-muted-foreground">
              Please log in or sign up to access your Profile.
            </p>
          </div>

          {/* Cards Container */}
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Login Card */}
            <div
              className="group relative animate-scale-in"
              style={{ animationDelay: '0.1s' }}
            >
              {/* Glass card with border */}
              <div className="relative bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/20 dark:border-white/10 shadow-glass-lg hover:shadow-glass-xl transition-all duration-300 hover:scale-[1.02]">
                {/* Inner glow effect */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                <div className="relative z-10 flex flex-col items-center text-center">
                  {/* Icon */}
                  <div className="mb-6 p-4 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 text-white shadow-lg">
                    <LogIn size={32} />
                  </div>

                  {/* Title */}
                  <h2 className="text-3xl font-bold mb-3">Login</h2>

                  {/* Description */}
                  <p className="text-muted-foreground mb-6">
                    Already have an account?<br />
                    Log in to access your learning content.
                  </p>

                  {/* Button */}
                  <Button
                    size="lg"
                    className="w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                    onClick={() => navigate("/login")}
                  >
                    Go to Login
                  </Button>
                </div>
              </div>
            </div>

            {/* Sign Up Card */}
            <div
              className="group relative animate-scale-in"
              style={{ animationDelay: '0.2s' }}
            >
              {/* Glass card with border */}
              <div className="relative bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/20 dark:border-white/10 shadow-glass-lg hover:shadow-glass-xl transition-all duration-300 hover:scale-[1.02]">
                {/* Inner glow effect */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                <div className="relative z-10 flex flex-col items-center text-center">
                  {/* Icon */}
                  <div className="mb-6 p-4 rounded-2xl bg-gradient-to-br from-success-400 to-success-600 text-white shadow-lg">
                    <UserPlus size={32} />
                  </div>

                  {/* Title */}
                  <h2 className="text-3xl font-bold mb-3">Sign Up</h2>

                  {/* Description */}
                  <p className="text-muted-foreground mb-6">
                    New here? Create an account and<br />
                    start your learning journey.
                  </p>

                  {/* Button */}
                  <Button
                    size="lg"
                    className="w-full bg-gradient-to-r from-success-500 to-success-600 hover:from-success-600 hover:to-success-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                    onClick={() => navigate("/signup")}
                  >
                    Create Account
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
