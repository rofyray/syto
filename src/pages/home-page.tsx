import { useNavigate } from "react-router-dom";
import { BookOpen, BookText, Brain, Code } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth-store";
import { ThemeToggle } from "@/components/theme-toggle";

export function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header with Theme Toggle */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-end">
          <ThemeToggle />
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-24 pb-16 md:pt-32 md:pb-24">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center text-center">
            <div className="animate-fade-in mb-8 inline-flex items-center rounded-full border bg-background px-3 py-1 text-sm shadow-sm">
              <span className="mr-1 text-ghana-green dark:text-ghana-green">✓</span>
              <span>Aligned with Ghanaian Curriculum</span>
            </div>
            
            <h1 className="mb-6 animate-fade-in text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
              Learn with <span className="text-ghana-green dark:text-ghana-green">Syto</span>, your digital education companion
            </h1>
            
            <p className="animate-fade-in mb-8 max-w-2xl text-lg text-muted-foreground md:text-xl">
              An interactive learning platform designed specifically for Primary 4-6 students in Ghana, 
              making English Language and Mathematics engaging, fun, and culturally relevant.
            </p>
            
            <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
              {user ? (
                <Button
                  size="lg"
                  variant="ghana"
                  className="animate-fade-in bg-ghana-green hover:bg-ghana-green-dark dark:bg-ghana-green-dark dark:hover:bg-ghana-green text-white"
                  onClick={() => navigate("/dashboard")}
                >
                  Go to Dashboard
                </Button>
              ) : (
                <>
                  <Button
                    size="lg"
                    variant="ghana"
                    className="animate-fade-in"
                    onClick={() => navigate("/signup")}
                  >
                    Get Started
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="animate-fade-in hover:bg-ghana-green/10 dark:hover:bg-ghana-green-dark/10"
                    onClick={() => navigate("/login")}
                  >
                    Sign In
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="mb-12 text-center text-3xl font-bold tracking-tight md:text-4xl">
            Why Choose Syto?
          </h2>
          
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col items-center rounded-lg bg-card p-6 text-center shadow-sm transition-all hover:shadow-md">
              <div className="mb-4 rounded-full bg-ghana-green/10 p-3 text-ghana-green dark:bg-ghana-green-dark/20 dark:text-ghana-green">
                <BookOpen size={24} />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Curriculum Aligned</h3>
              <p className="text-muted-foreground">
                Perfectly matches the Ghanaian Primary 4-6 syllabi for English Language and Mathematics.
              </p>
            </div>
            
            <div className="flex flex-col items-center rounded-lg bg-card p-6 text-center shadow-sm transition-all hover:shadow-md">
              <div className="mb-4 rounded-full bg-ghana-gold/10 p-3 text-ghana-gold dark:bg-ghana-gold-dark/20 dark:text-ghana-gold-dark">
                <Brain size={24} />
              </div>
              <h3 className="mb-2 text-xl font-semibold">AI Assistant Chale</h3>
              <p className="text-muted-foreground">
                Get personalized help from Chale, your AI tutor with a friendly face and voice.
              </p>
            </div>
            
            <div className="flex flex-col items-center rounded-lg bg-card p-6 text-center shadow-sm transition-all hover:shadow-md">
              <div className="mb-4 rounded-full bg-ghana-red/10 p-3 text-ghana-red dark:bg-ghana-red-dark/20 dark:text-ghana-red-dark">
                <BookText size={24} />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Interactive Learning</h3>
              <p className="text-muted-foreground">
                Engage with dynamic exercises, quizzes, and culturally relevant content.
              </p>
            </div>
            
            <div className="flex flex-col items-center rounded-lg bg-card p-6 text-center shadow-sm transition-all hover:shadow-md">
              <div className="mb-4 rounded-full bg-ghana-green/10 p-3 text-ghana-green dark:bg-ghana-green-dark/20 dark:text-ghana-green">
                <Code size={24} />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Progress Tracking</h3>
              <p className="text-muted-foreground">
                Monitor your learning journey with detailed progress reports and achievements.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Subjects Overview */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="mb-12 text-center text-3xl font-bold tracking-tight md:text-4xl">
            What You'll Learn
          </h2>
          
          <div className="grid gap-8 md:grid-cols-2">
            <div className="rounded-lg bg-card p-8 shadow-sm transition-all hover:shadow-md">
              <h3 className="mb-4 text-2xl font-semibold text-ghana-green dark:text-ghana-green">English Language</h3>
              <ul className="mb-6 space-y-2">
                <li className="flex items-center">
                  <span className="mr-2 text-ghana-green dark:text-ghana-green">✓</span>
                  Reading comprehension with Ghanaian stories
                </li>
                <li className="flex items-center">
                  <span className="mr-2 text-ghana-green dark:text-ghana-green">✓</span>
                  Grammar and vocabulary building
                </li>
                <li className="flex items-center">
                  <span className="mr-2 text-ghana-green dark:text-ghana-green">✓</span>
                  Writing skills and creative expression
                </li>
                <li className="flex items-center">
                  <span className="mr-2 text-ghana-green dark:text-ghana-green">✓</span>
                  Interactive exercises and quizzes
                </li>
              </ul>
              <Button 
                variant="outline" 
                className="w-full hover:bg-ghana-green/10 dark:hover:bg-ghana-green-dark/10" 
                onClick={() => navigate("/english")}
              >
                Explore English Modules
              </Button>
            </div>
            
            <div className="rounded-lg bg-card p-8 shadow-sm transition-all hover:shadow-md">
              <h3 className="mb-4 text-2xl font-semibold text-ghana-gold dark:text-ghana-gold-dark">Mathematics</h3>
              <ul className="mb-6 space-y-2">
                <li className="flex items-center">
                  <span className="mr-2 text-ghana-gold dark:text-ghana-gold-dark">✓</span>
                  Number operations and basic algebra
                </li>
                <li className="flex items-center">
                  <span className="mr-2 text-ghana-gold dark:text-ghana-gold-dark">✓</span>
                  Geometry and measurement
                </li>
                <li className="flex items-center">
                  <span className="mr-2 text-ghana-gold dark:text-ghana-gold-dark">✓</span>
                  Problem-solving with real-world examples
                </li>
                <li className="flex items-center">
                  <span className="mr-2 text-ghana-gold dark:text-ghana-gold-dark">✓</span>
                  Visual learning tools and step-by-step guidance
                </li>
              </ul>
              <Button 
                variant="outline" 
                className="w-full hover:bg-ghana-gold/10 dark:hover:bg-ghana-gold-dark/10" 
                onClick={() => navigate("/mathematics")}
              >
                Explore Mathematics Modules
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-ghana-green/90 dark:bg-ghana-green-dark/80 theme-transition">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-6 text-3xl font-bold tracking-tight text-white md:text-4xl">
            Start Your Learning Journey Today
          </h2>
          <p className="mb-8 mx-auto max-w-2xl text-lg text-white/80">
            Join thousands of Ghanaian students already improving their skills with Syto's
            interactive and culturally relevant learning platform.
          </p>
          <div className="flex flex-col space-y-4 sm:flex-row sm:justify-center sm:space-y-0 sm:space-x-4">
            {user ? (
              <Button
                size="lg"
                variant="accent"
                className="bg-ghana-gold hover:bg-ghana-gold-dark dark:bg-ghana-gold-dark dark:hover:bg-ghana-gold text-white"
                onClick={() => navigate("/dashboard")}
              >
                Go to Dashboard
              </Button>
            ) : (
              <>
                <Button
                  size="lg"
                  variant="accent"
                  className="bg-ghana-gold hover:bg-ghana-gold-dark dark:bg-ghana-gold-dark dark:hover:bg-ghana-gold text-white"
                  onClick={() => navigate("/signup")}
                >
                  Create Free Account
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-transparent text-white border-white hover:bg-white/10"
                  onClick={() => navigate("/login")}
                >
                  Sign In
                </Button>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}