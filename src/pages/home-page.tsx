import { useNavigate, Link } from "react-router-dom";
import { BookOpen, BookText, Brain, Sparkles, TrendingUp, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth-store";
import { ThemeToggle } from "@/components/theme-toggle";
import { Logo } from "@/components/logo";

export function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden bg-gradient-to-br from-ghana-green/5 via-ghana-gold/5 to-white dark:from-gray-900 dark:via-gray-900 dark:to-gray-950">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-ghana-green/10 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>
      </div>

      {/* Header with Theme Toggle */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border-b border-white/20 dark:border-white/10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Logo size="md" />
          <div className="flex items-center gap-4">
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-32">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center text-center max-w-5xl mx-auto">
            {/* Badge */}
            <div className="mb-6 animate-slide-up">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 dark:bg-white/10 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-glass">
                <span className="w-2 h-2 rounded-full bg-ghana-green animate-pulse"></span>
                <span className="text-sm font-medium">Aligned with Ghana Curriculum</span>
              </div>
            </div>

            {/* Main Headline */}
            <h1 className="mb-6 animate-slide-up text-5xl md:text-7xl font-bold tracking-tight" style={{ animationDelay: '0.1s' }}>
              Learn Smarter with{" "}
              <span className="bg-gradient-to-r from-ghana-green via-ghana-gold to-ghana-red bg-clip-text text-transparent">
                Syto
              </span>
            </h1>

            {/* Subtitle */}
            <p className="mb-10 animate-slide-up max-w-3xl text-xl md:text-2xl text-muted-foreground leading-relaxed" style={{ animationDelay: '0.2s' }}>
              An AI-powered learning platform designed for Primary 4-6 students in Ghana.
              Master English and Mathematics with culturally relevant content.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-12 animate-slide-up" style={{ animationDelay: '0.3s' }}>
              {user ? (
                <Button
                  size="lg"
                  className="h-14 px-8 text-lg bg-gradient-to-r from-ghana-green to-ghana-green-light hover:from-ghana-green-dark hover:to-ghana-green text-white rounded-2xl shadow-xl hover:shadow-2xl transition-all"
                  onClick={() => navigate("/dashboard")}
                >
                  Go to Dashboard
                </Button>
              ) : (
                <Button
                  size="lg"
                  className="h-14 px-8 text-lg bg-gradient-to-r from-ghana-green to-ghana-green-light hover:from-ghana-green-dark hover:to-ghana-green text-white rounded-2xl shadow-xl hover:shadow-2xl transition-all"
                  onClick={() => navigate("/get-started")}
                >
                  Get Started Free
                </Button>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '0.4s' }}>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-ghana-green to-ghana-gold bg-clip-text text-transparent">1000+</div>
                <div className="text-sm text-muted-foreground mt-1">Students</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-ghana-green to-ghana-gold bg-clip-text text-transparent">95%</div>
                <div className="text-sm text-muted-foreground mt-1">Success Rate</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-ghana-green to-ghana-gold bg-clip-text text-transparent">24/7</div>
                <div className="text-sm text-muted-foreground mt-1">AI Support</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Why Students <span className="bg-gradient-to-r from-ghana-green to-ghana-gold bg-clip-text text-transparent">Love Syto</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Built specifically for Ghanaian students with cutting-edge AI technology
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
            {/* Feature 1 */}
            <div className="group bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/20 dark:border-white/10 shadow-glass hover:shadow-glass-xl transition-all duration-300 hover:scale-[1.02] animate-slide-up">
              <div className="mb-5 w-14 h-14 rounded-2xl bg-gradient-to-br from-ghana-green/20 to-ghana-green-light/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <BookOpen className="h-7 w-7 text-ghana-green" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Ghana Curriculum</h3>
              <p className="text-muted-foreground leading-relaxed">
                100% aligned with the official Ghanaian Primary 4-6 curriculum for English and Mathematics.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/20 dark:border-white/10 shadow-glass hover:shadow-glass-xl transition-all duration-300 hover:scale-[1.02] animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <div className="mb-5 w-14 h-14 rounded-2xl bg-gradient-to-br from-ghana-gold/20 to-ghana-gold-dark/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Sparkles className="h-7 w-7 text-ghana-gold-dark" />
              </div>
              <h3 className="text-2xl font-bold mb-3">AI Tutor - NAANO</h3>
              <p className="text-muted-foreground leading-relaxed">
                Get instant help 24/7 from NAANO, your friendly AI assistant who speaks your language.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/20 dark:border-white/10 shadow-glass hover:shadow-glass-xl transition-all duration-300 hover:scale-[1.02] animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <div className="mb-5 w-14 h-14 rounded-2xl bg-gradient-to-br from-ghana-red/20 to-ghana-red-light/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <BookText className="h-7 w-7 text-ghana-red" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Interactive Lessons</h3>
              <p className="text-muted-foreground leading-relaxed">
                Engaging quizzes and exercises with instant feedback to boost your learning.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="group bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/20 dark:border-white/10 shadow-glass hover:shadow-glass-xl transition-all duration-300 hover:scale-[1.02] animate-slide-up" style={{ animationDelay: '0.3s' }}>
              <div className="mb-5 w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-400/20 to-primary-600/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <TrendingUp className="h-7 w-7 text-primary-500" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Track Progress</h3>
              <p className="text-muted-foreground leading-relaxed">
                Monitor your growth with detailed analytics and personalized learning insights.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="group bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/20 dark:border-white/10 shadow-glass hover:shadow-glass-xl transition-all duration-300 hover:scale-[1.02] animate-slide-up" style={{ animationDelay: '0.4s' }}>
              <div className="mb-5 w-14 h-14 rounded-2xl bg-gradient-to-br from-success-400/20 to-success-600/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Brain className="h-7 w-7 text-success-500" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Cultural Context</h3>
              <p className="text-muted-foreground leading-relaxed">
                Learn with examples using Ghanaian names, places, and cultural references.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="group bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/20 dark:border-white/10 shadow-glass hover:shadow-glass-xl transition-all duration-300 hover:scale-[1.02] animate-slide-up" style={{ animationDelay: '0.5s' }}>
              <div className="mb-5 w-14 h-14 rounded-2xl bg-gradient-to-br from-warning-400/20 to-warning-600/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users className="h-7 w-7 text-warning-500" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Safe & Secure</h3>
              <p className="text-muted-foreground leading-relaxed">
                A safe learning environment built with student privacy and security in mind.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto bg-gradient-to-br from-ghana-green via-ghana-gold to-ghana-red p-1 rounded-3xl shadow-2xl">
            <div className="bg-white dark:bg-gray-950 rounded-3xl p-12 md:p-16 text-center">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Ready to Start Learning?
              </h2>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Join thousands of Ghanaian students already mastering English and Mathematics with Syto's AI-powered platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {user ? (
                  <Button
                    size="lg"
                    className="h-14 px-8 text-lg bg-gradient-to-r from-ghana-green to-ghana-green-light hover:from-ghana-green-dark hover:to-ghana-green text-white rounded-2xl shadow-xl hover:shadow-2xl transition-all"
                    onClick={() => navigate("/dashboard")}
                  >
                    Go to Dashboard
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    className="h-14 px-8 text-lg bg-gradient-to-r from-ghana-green to-ghana-green-light hover:from-ghana-green-dark hover:to-ghana-green text-white rounded-2xl shadow-xl hover:shadow-2xl transition-all"
                    onClick={() => navigate("/get-started")}
                  >
                    Get Started Free
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-white/20 dark:border-white/10 bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-12">
          <div className="grid gap-12 md:grid-cols-4">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="mb-4">
                <Logo size="md" />
              </div>
              <p className="text-muted-foreground mb-4 max-w-sm">
                Empowering Ghanaian Primary 4-6 students with AI-powered learning in English and Mathematics.
              </p>
              <p className="text-sm text-muted-foreground">
                © {new Date().getFullYear()} Syto. All rights reserved.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/english" className="text-muted-foreground hover:text-ghana-green transition-colors">English</Link></li>
                <li><Link to="/mathematics" className="text-muted-foreground hover:text-ghana-green transition-colors">Mathematics</Link></li>
                <li><Link to="/naano" className="text-muted-foreground hover:text-ghana-green transition-colors">AI Tutor</Link></li>
                <li><Link to="/dashboard" className="text-muted-foreground hover:text-ghana-green transition-colors">Dashboard</Link></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/profile" className="text-muted-foreground hover:text-ghana-green transition-colors">My Profile</Link></li>
                <li><Link to="/help" className="text-muted-foreground hover:text-ghana-green transition-colors">Help Center</Link></li>
                <li><Link to="/privacy" className="text-muted-foreground hover:text-ghana-green transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms" className="text-muted-foreground hover:text-ghana-green transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}