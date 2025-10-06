import { useState, useEffect } from "react";
import { BookOpen, BookText, MessageSquare, X } from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/auth-store";
import { getModulesByGradeAndSubject, getTopicsByModuleId, getUserProgressByUserId, type Module } from "@/lib/supabase";
import { ModuleSelectionWizard } from "@/components/modules/module-selection-wizard";

interface ModuleWithProgress extends Module {
  progress: number;
  image?: string;
}

export function EnglishPage() {
  const { user, profile } = useAuthStore();
  const [modules, setModules] = useState<ModuleWithProgress[]>([]);
  const [overallProgress, setOverallProgress] = useState(0);
  const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEnglishData = async () => {
      if (!user || !profile) return;
      
      try {
        // Fetch English modules for the user's grade level
        const englishModules = await getModulesByGradeAndSubject(profile.grade_level, "english");
        
        // Fetch user progress
        const userProgress = await getUserProgressByUserId(user.id);
        
        // Calculate progress for each module
        const modulesWithProgress = await Promise.all(
          englishModules.map(async (module) => {
            // Get topics for this module to calculate progress
            const topics = await getTopicsByModuleId(module.id);
            const moduleProgress = userProgress.filter(p => p.module_id === module.id);
            const completedTopics = moduleProgress.filter(p => p.completed).length;
            const totalTopics = topics.length || 1;
            const progressPercentage = Math.round((completedTopics / totalTopics) * 100);
            
            return {
              ...module,
              progress: progressPercentage,
              topics: topics,
              image: `https://images.pexels.com/photos/256546/pexels-photo-256546.jpeg?auto=compress&cs=tinysrgb&w=600` // Default image for now
            };
          })
        );
        
        setModules(modulesWithProgress);
        
        // Calculate overall progress
        if (modulesWithProgress.length > 0) {
          const completed = modulesWithProgress.reduce((sum, module) => sum + module.progress, 0);
          const total = modulesWithProgress.length * 100;
          setOverallProgress(Math.round((completed / total) * 100));
        } else {
          setOverallProgress(0);
        }
      } catch (error) {
        console.error("Error fetching English data:", error);
      }
    };

    fetchEnglishData();
  }, [user, profile]);

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8 bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/20 dark:border-white/10 shadow-glass-lg animate-slide-up">
          <div className="flex items-center mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-ghana-green/20 to-ghana-green-light/20 flex items-center justify-center mr-3">
              <BookOpen className="h-6 w-6 text-ghana-green" />
            </div>
            <div className="flex-1">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-ghana-green to-ghana-green-light bg-clip-text text-transparent">
                English Language
              </h1>
              <p className="text-muted-foreground">
                Primary {profile?.grade_level || 4} English modules aligned with the Ghanaian curriculum
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mt-4">
            <Button
              className="h-11 px-6 bg-ghana-green hover:bg-ghana-green-dark text-white rounded-xl shadow-lg hover:shadow-xl transition-all"
              onClick={() => setIsSelectionModalOpen(true)}
            >
              + Start a New Module
            </Button>
            <Button
              className="h-11 px-6 bg-ghana-green-light/20 hover:bg-ghana-green-light/40 text-ghana-green dark:text-ghana-green-light border-2 border-ghana-green/30 hover:border-ghana-green rounded-xl shadow-md hover:shadow-lg transition-all"
              onClick={() => navigate("/naano")}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Ask NAANO for Help
            </Button>
          </div>
        </div>

        {/* Overall Progress */}
        <div className="mb-8 bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/20 dark:border-white/10 shadow-glass-lg hover:shadow-glass-xl transition-all animate-slide-up" style={{animationDelay: '0.1s'}}>
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-ghana-green/20 to-ghana-green-light/20 flex items-center justify-center mr-3">
              <BookOpen className="h-5 w-5 text-ghana-green" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Your Progress</h3>
              <p className="text-sm text-muted-foreground">Overall completion of English Language modules</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="bg-ghana-green/10 dark:bg-ghana-green/20 border-2 border-ghana-green/30 rounded-xl p-4 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wide text-ghana-green">Overall Completion</span>
              <span className="text-2xl font-bold text-ghana-green">{overallProgress}%</span>
            </div>
            <Progress value={overallProgress} variant="success" className="h-3" />
          </div>
        </div>

        {/* Modules Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {modules.filter((module) => module.progress > 0).length > 0 ? (
            modules.filter((module) => module.progress > 0).map((module, index) => (
              <div
                key={module.id}
                className="bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-white/10 shadow-glass hover:shadow-glass-xl transition-all overflow-hidden animate-slide-up"
                style={{animationDelay: `${(index + 2) * 0.1}s`}}
              >
                <div className="aspect-video relative overflow-hidden">
                  <img
                    src={module.image}
                    alt={module.title}
                    className="w-full h-full object-cover transition-transform hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <div className="flex items-center mb-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-ghana-green/80 to-ghana-green-light/80 backdrop-blur-sm flex items-center justify-center mr-2">
                        <BookOpen className="h-4 w-4 text-white" />
                      </div>
                      <h2 className="text-white text-xl font-bold">{module.title}</h2>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <p className="mb-4 text-muted-foreground">{module.description}</p>
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold mb-2">Topics:</h4>
                    <ul className="space-y-1">
                      {module.topics.map((topic, index) => (
                        <li key={index} className="text-sm flex items-center">
                          <BookText className="mr-2 h-4 w-4 text-ghana-green" />
                          {topic.title}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="bg-ghana-green/10 dark:bg-ghana-green/20 border-2 border-ghana-green/30 rounded-lg p-3 flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wide text-ghana-green">Progress</span>
                      <span className="text-xl font-bold text-ghana-green">{module.progress}%</span>
                    </div>
                    <Progress value={module.progress} variant="success" className="h-2" />
                  </div>
                  <Button
                    className="w-full h-12 bg-gradient-to-r from-ghana-green to-ghana-green-light hover:from-ghana-green-dark hover:to-ghana-green text-white rounded-xl shadow-lg hover:shadow-xl transition-all"
                    onClick={() => navigate(`/english/${module.id}`)}
                  >
                    <BookOpen className="mr-2 h-5 w-5" />
                    Continue Learning
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-2 bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/20 dark:border-white/10 shadow-glass-lg text-center animate-slide-up" style={{animationDelay: '0.2s'}}>
              <h2 className="text-2xl font-bold mb-4">Start Your Learning Journey</h2>
              <p className="text-muted-foreground mb-6">Select a module to begin learning English Language.</p>
              <Button
                size="lg"
                className="h-14 px-8 bg-gradient-to-r from-ghana-green to-ghana-green-light hover:from-ghana-green-dark hover:to-ghana-green text-white rounded-xl shadow-lg hover:shadow-xl transition-all"
                onClick={() => setIsSelectionModalOpen(true)}
              >
                <BookOpen className="mr-2 h-5 w-5" />
                Choose a Module
              </Button>
            </div>
          )}
        </div>
      </div>
      {isSelectionModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center animate-fade-in">
          <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/20 dark:border-white/10 shadow-glass-xl w-full max-w-4xl mx-4 relative animate-scale-in">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 hover:bg-white/20 dark:hover:bg-white/10 rounded-xl"
              onClick={() => setIsSelectionModalOpen(false)}
            >
              <X className="h-6 w-6" />
            </Button>
            <ModuleSelectionWizard subject="english" onClose={() => setIsSelectionModalOpen(false)} />
          </div>
        </div>
      )}
    </AppLayout>
  );
}