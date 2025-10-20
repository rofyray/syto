import { useEffect, useState } from "react";
import { BookOpen, BookText, Award, MessageSquare } from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth-store";
import {
  getUserProgressByUserId,
  getModulesByGradeAndSubject,
  getRecentModules,
  getSubjectCompletion,
  type RecentModule as DBRecentModule
} from "@/lib/supabase";
import { getTimeBasedGreeting } from "@/lib/utils";
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
  const [englishStats, setEnglishStats] = useState({ completed: 0, total: 0 });
  const [mathStats, setMathStats] = useState({ completed: 0, total: 0 });
  const [recentModules, setRecentModules] = useState<RecentModule[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      // No user, stop loading
      if (!user) {
        if (mounted) setLoading(false);
        return;
      }

      // Wait for profile - Supabase will handle session validity
      if (!profile) {
        // Just keep loading, profile will come from auth state listener
        return;
      }

      // Profile loaded, fetch dashboard data
      console.log('Fetching dashboard data...');

      try {
        // Calculate subject completion using the new accurate method
        const englishCompletion = await getSubjectCompletion(user.id, 'english', profile.grade_level);
        const mathCompletion = await getSubjectCompletion(user.id, 'mathematics', profile.grade_level);

        if (!mounted) return;

        setEnglishProgress(englishCompletion.percentage);
        setMathProgress(mathCompletion.percentage);
        setEnglishStats({ completed: englishCompletion.completedModules, total: englishCompletion.totalModules });
        setMathStats({ completed: mathCompletion.completedModules, total: mathCompletion.totalModules });

        // Get recent modules using the new database view
        const dbRecentModules = await getRecentModules(user.id, 3);

        // Get user progress for module-level progress calculation
        const progress = await getUserProgressByUserId(user.id);

        if (!mounted) return;

        // Transform to local format with progress calculation
        const recentModulesWithProgress = dbRecentModules.map(module => {
          const moduleProgress = progress.filter(p => p.module_id === module.module_id);

          // Get unique completed topics for this module
          const completedTopicIds = new Set(
            moduleProgress
              .filter(p => p.topic_id && p.completed)
              .map(p => p.topic_id)
          );

          // Get unique total topics attempted for this module
          const totalTopicIds = new Set(
            moduleProgress
              .filter(p => p.topic_id)
              .map(p => p.topic_id)
          );

          const progressPercentage = totalTopicIds.size > 0
            ? Math.round((completedTopicIds.size / totalTopicIds.size) * 100)
            : 0;

          return {
            id: module.module_id,
            title: module.title,
            subject: module.subject,
            progress: progressPercentage,
            lastAccessed: module.last_accessed_at
          };
        });

        setRecentModules(recentModulesWithProgress);
      } catch (error: any) {
        console.error("Error fetching dashboard data:", error);
        // Just log errors, don't show error UI - let Supabase handle auth
        // If there's a real auth issue, Supabase will trigger auth state change
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    // Cleanup function
    return () => {
      mounted = false;
    };
  }, [user, profile?.id]); // Only re-run if user changes or profile ID changes

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
              <p className="text-sm text-muted-foreground">
                {englishStats.completed} of {englishStats.total} modules completed
              </p>
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
              <p className="text-sm text-muted-foreground">
                {mathStats.completed} of {mathStats.total} modules completed
              </p>
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