import { useEffect, useState } from "react";
import { BookOpen, BookText, Award } from "lucide-react";
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
      if (!user || !profile) return;

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
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            {getTimeBasedGreeting()}, {profile?.first_name || "Student"}!
          </h1>
          <p className="text-muted-foreground">
            Welcome to your learning dashboard. Here's your current progress.
          </p>
        </div>

        {/* Overall Progress */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center">
                <BookOpen className="mr-2 h-5 w-5 text-ghana-green dark:text-ghana-green" />
                English Language
              </CardTitle>
              <CardDescription>Your progress in English modules</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{englishProgress}% Complete</span>
                </div>
                <Progress value={englishProgress} variant="ghana" />
                <Button 
                  variant="outline" 
                  className="w-full mt-4 bg-ghana-gold hover:bg-ghana-gold-dark text-white"
                  onClick={() => navigate("/english")}
                >
                  {englishProgress === 0 ? "Start Learning" : "Continue Learning"}
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center">
                <BookText className="mr-2 h-5 w-5 text-ghana-gold dark:text-ghana-gold-dark" />
                Mathematics
              </CardTitle>
              <CardDescription>Your progress in Mathematics modules</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{mathProgress}% Complete</span>
                </div>
                <Progress value={mathProgress} variant="ghana" />
                <Button 
                  variant="outline" 
                  className="w-full mt-4 bg-ghana-gold hover:bg-ghana-gold-dark text-white"
                  onClick={() => navigate("/mathematics")}
                >
                  {mathProgress === 0 ? "Start Learning" : "Continue Learning"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Modules */}
        <h2 className="text-2xl font-bold mb-4">Recent Modules</h2>
        {recentModules.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-3 mb-8">
            {recentModules.map((module) => (
              <Card key={module.id} className="hover:shadow-md transition-all">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center text-lg">
                    {module.subject === "english" ? (
                      <BookOpen className="mr-2 h-4 w-4 text-ghana-green dark:text-ghana-green" />
                    ) : (
                      <BookText className="mr-2 h-4 w-4 text-ghana-gold dark:text-ghana-gold-dark" />
                    )}
                    {module.title}
                  </CardTitle>
                  <CardDescription>
                    {module.subject === "english" ? "English" : "Mathematics"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{module.progress}% Complete</span>
                    </div>
                    <Progress 
                      value={module.progress} 
                      variant={module.subject === "english" ? "success" : "ghana"} 
                    />
                    <Button 
                      variant="ghost" 
                      className="w-full mt-4 bg-ghana-gold hover:bg-ghana-gold-dark text-white"
                      onClick={() => navigate(`/${module.subject}/${module.id}`)}
                    >
                      Continue
                    </Button>
                  </div>
                </CardContent>
              </Card>
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
        <Card className="mb-8 bg-gradient-to-r from-ghana-green/10 to-ghana-gold/10 dark:from-ghana-green-dark/20 dark:to-ghana-gold-dark/20">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Award className="mr-2 h-5 w-5 text-ghana-gold dark:text-ghana-gold-dark" />
              Need Help? Ask Chale!
            </CardTitle>
            <CardDescription>
              Chale is your AI learning assistant that can help answer questions and guide your learning.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button 
              variant="ghana" 
              size="lg"
              onClick={() => navigate("/chale")}
            >
              Chat with Chale
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}