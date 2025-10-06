import { useEffect, useState } from "react";
import { BookOpen, BookText, Award, MessageSquare } from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth-store";
import { getUserProgressByUserId, getModulesByGradeAndSubject } from "@/lib/supabase";
import { calculateCompletion, getTimeBasedGreeting } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface RecentModule {
  id: string;
  title: string;
  subject: "english" | "mathematics";
  progress: number;
  lastAccessed: string;
}

export function DashboardPage() {
  const { user, profile } = useAuthStore();
  const [englishProgress, setEnglishProgress] = useState(0);
  const [mathProgress, setMathProgress] = useState(0);
  const [recentModules, setRecentModules] = useState<RecentModule[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      // If user exists but no profile yet, wait a bit for profile to load
      if (!profile) {
        const timeout = setTimeout(() => {
          setLoading(false);
        }, 3000); // Max 3 seconds wait for profile
        return () => clearTimeout(timeout);
      }

      try {
        // Fetch user progress
        const progress = await getUserProgressByUserId(user.id);

        // Calculate subject progress
        const englishCompleted = progress.filter(p => p.module_id.startsWith('eng') && p.completed).length;
        const mathCompleted = progress.filter(p => p.module_id.startsWith('math') && p.completed).length;

        // Fetch modules to get total count
        const englishModules = await getModulesByGradeAndSubject(profile.grade_level, 'english');
        const mathModules = await getModulesByGradeAndSubject(profile.grade_level, 'mathematics');

        // Calculate percentages
        setEnglishProgress(calculateCompletion(englishCompleted, englishModules.length || 1));
        setMathProgress(calculateCompletion(mathCompleted, mathModules.length || 1));

        // Get recent modules with progress
        const allModules = [...englishModules, ...mathModules];
        const recentModulesWithProgress = allModules
          .map(module => {
            const moduleProgress = progress.filter(p => p.module_id === module.id);
            const completedTopics = moduleProgress.filter(p => p.completed).length;
            const totalTopics = moduleProgress.length || 1;
            const progressPercentage = Math.round((completedTopics / totalTopics) * 100);

            // Get the most recent access date
            const lastAccessed = moduleProgress.length > 0
              ? Math.max(...moduleProgress.map(p => new Date(p.created_at || '').getTime()))
              : 0;

            return {
              id: module.id,
              title: module.title,
              subject: module.subject,
              progress: progressPercentage,
              lastAccessed: new Date(lastAccessed).toISOString()
            };
          })
          .filter(module => module.progress > 0) // Only show modules with some progress
          .sort((a, b) => new Date(b.lastAccessed).getTime() - new Date(a.lastAccessed).getTime())
          .slice(0, 3); // Get top 3 recent modules

        setRecentModules(recentModulesWithProgress);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, profile]);

  if (loading) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center">
              <div className="h-12 w-12 rounded-full border-4 border-ghana-gold border-t-transparent animate-spin"></div>
              <p className="mt-4 text-muted-foreground">Loading your dashboard...</p>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8 bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/20 dark:border-white/10 shadow-glass-lg animate-slide-up">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-ghana-green to-ghana-gold bg-clip-text text-transparent">
            {getTimeBasedGreeting()}, {profile?.first_name || "Student"}!
          </h1>
          <p className="text-muted-foreground">
            Welcome to your learning dashboard. Here's your current progress.
          </p>
        </div>

        {/* Overall Progress */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/20 dark:border-white/10 shadow-glass-lg hover:shadow-glass-xl transition-all animate-slide-up" style={{animationDelay: '0.1s'}}>
            <div className="pb-2">
              <div className="flex items-center mb-1">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-ghana-green/20 to-ghana-green-light/20 flex items-center justify-center mr-3">
                  <BookOpen className="h-5 w-5 text-ghana-green" />
                </div>
                <h3 className="text-xl font-bold">English Language</h3>
              </div>
              <p className="text-sm text-muted-foreground">Your progress in English modules</p>
            </div>
            <div className="space-y-3 mt-4">
              <div className="bg-ghana-green/10 dark:bg-ghana-green/20 border-2 border-ghana-green/30 rounded-xl p-4 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wide text-ghana-green">Overall Completion</span>
                <span className="text-2xl font-bold text-ghana-green">{englishProgress}%</span>
              </div>
              <Progress value={englishProgress} variant="ghana" className="h-3" />
              <Button
                className="w-full mt-4 h-12 bg-gradient-to-r from-ghana-green to-ghana-green-light hover:from-ghana-green-dark hover:to-ghana-green text-white rounded-xl shadow-lg hover:shadow-xl transition-all"
                onClick={() => navigate("/english")}
              >
                <BookOpen className="mr-2 h-5 w-5" />
                {englishProgress === 0 ? "Start Learning" : "Continue Learning"}
              </Button>
            </div>
          </div>

          <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/20 dark:border-white/10 shadow-glass-lg hover:shadow-glass-xl transition-all animate-slide-up" style={{animationDelay: '0.2s'}}>
            <div className="pb-2">
              <div className="flex items-center mb-1">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-ghana-gold/20 to-ghana-gold-dark/20 flex items-center justify-center mr-3">
                  <BookText className="h-5 w-5 text-ghana-gold-dark" />
                </div>
                <h3 className="text-xl font-bold">Mathematics</h3>
              </div>
              <p className="text-sm text-muted-foreground">Your progress in Mathematics modules</p>
            </div>
            <div className="space-y-3 mt-4">
              <div className="bg-ghana-gold/10 dark:bg-ghana-gold/20 border-2 border-ghana-gold/30 rounded-xl p-4 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wide text-ghana-gold-dark">Overall Completion</span>
                <span className="text-2xl font-bold text-ghana-gold-dark">{mathProgress}%</span>
              </div>
              <Progress value={mathProgress} variant="ghana" className="h-3" />
              <Button
                className="w-full mt-4 h-12 bg-gradient-to-r from-ghana-gold to-ghana-gold-dark hover:from-ghana-gold-dark hover:to-ghana-gold text-white rounded-xl shadow-lg hover:shadow-xl transition-all"
                onClick={() => navigate("/mathematics")}
              >
                <BookText className="mr-2 h-5 w-5" />
                {mathProgress === 0 ? "Start Learning" : "Continue Learning"}
              </Button>
            </div>
          </div>
        </div>

        {/* Recent Modules */}
        <h2 className="text-2xl font-bold mb-4">Recent Modules</h2>
        {recentModules.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-3 mb-8">
            {recentModules.map((module, index) => (
              <div key={module.id} className="bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/20 dark:border-white/10 shadow-glass hover:shadow-glass-xl transition-all animate-slide-up" style={{animationDelay: `${(index + 3) * 0.1}s`}}>
                <div className="pb-2">
                  <div className="flex items-center mb-2">
                    <div className={`w-10 h-10 rounded-xl ${module.subject === "english" ? "bg-gradient-to-br from-ghana-green/20 to-ghana-green-light/20" : "bg-gradient-to-br from-ghana-gold/20 to-ghana-gold-dark/20"} flex items-center justify-center mr-3`}>
                      {module.subject === "english" ? (
                        <BookOpen className="h-5 w-5 text-ghana-green" />
                      ) : (
                        <BookText className="h-5 w-5 text-ghana-gold-dark" />
                      )}
                    </div>
                    <h3 className="text-lg font-bold">{module.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {module.subject === "english" ? "English" : "Mathematics"}
                  </p>
                </div>
                <div className="space-y-2 mt-4">
                  <div className={`${module.subject === "english" ? "bg-ghana-green/10 dark:bg-ghana-green/20 border-2 border-ghana-green/30" : "bg-ghana-gold/10 dark:bg-ghana-gold/20 border-2 border-ghana-gold/30"} rounded-lg p-3 flex items-center justify-between`}>
                    <span className={`text-xs font-bold uppercase tracking-wide ${module.subject === "english" ? "text-ghana-green" : "text-ghana-gold-dark"}`}>Progress</span>
                    <span className={`text-xl font-bold ${module.subject === "english" ? "text-ghana-green" : "text-ghana-gold-dark"}`}>{module.progress}%</span>
                  </div>
                  <Progress
                    value={module.progress}
                    variant={module.subject === "english" ? "success" : "ghana"}
                    className="h-2"
                  />
                  <Button
                    className={`w-full mt-3 h-11 ${module.subject === "english" ? "bg-gradient-to-r from-ghana-green to-ghana-green-light hover:from-ghana-green-dark hover:to-ghana-green" : "bg-gradient-to-r from-ghana-gold to-ghana-gold-dark hover:from-ghana-gold-dark hover:to-ghana-gold"} text-white rounded-xl shadow-lg hover:shadow-xl transition-all`}
                    onClick={() => navigate(`/${module.subject}/${module.id}`)}
                  >
                    Continue
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center">
              <p className="text-muted-foreground">No recent modules available.</p>
            </div>
          </div>
        )}

        {/* AI Assistant */}
        <div className="mb-8 bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/20 dark:border-white/10 shadow-glass-lg text-center animate-slide-up">
          <div className="mb-4">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-ghana-green/20 to-ghana-gold/20 flex items-center justify-center">
                <Award className="h-6 w-6 text-ghana-green" />
              </div>
              <h3 className="text-2xl font-bold">Need Help? Ask NAANO!</h3>
            </div>
            <p className="text-muted-foreground">
              NAANO is your AI learning assistant that can help answer questions and guide your learning.
            </p>
          </div>
          <Button
            size="lg"
            className="h-14 px-8 bg-gradient-to-r from-ghana-green to-ghana-gold hover:from-ghana-green-dark hover:to-ghana-gold-dark text-white rounded-xl shadow-lg hover:shadow-xl transition-all"
            onClick={() => navigate("/naano")}
          >
            <MessageSquare className="mr-2 h-5 w-5" />
            Chat with NAANO
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}