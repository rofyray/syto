import { useState, useEffect } from "react";
import { Calculator, Star, X } from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

export function MathematicsPage() {
  const { user, profile } = useAuthStore();
  const [modules, setModules] = useState<ModuleWithProgress[]>([]);
  const [overallProgress, setOverallProgress] = useState(0);
  const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMathematicsData = async () => {
      if (!user || !profile) return;
      
      try {
        const mathModules = await getModulesByGradeAndSubject(profile.grade_level, "mathematics");
        const userProgress = await getUserProgressByUserId(user.id);
        
        const modulesWithProgress = await Promise.all(
          mathModules.map(async (module) => {
            const topics = await getTopicsByModuleId(module.id);
            const moduleProgress = userProgress.filter(p => p.module_id === module.id);
            const completedTopics = moduleProgress.filter(p => p.completed).length;
            const totalTopics = topics.length || 1;
            const progressPercentage = Math.round((completedTopics / totalTopics) * 100);
            
            return {
              ...module,
              progress: progressPercentage,
              image: `https://images.pexels.com/photos/3808904/pexels-photo-3808904.jpeg?auto=compress&cs=tinysrgb&w=600`
            };
          })
        );
        
        setModules(modulesWithProgress);
        
        if (modulesWithProgress.length > 0) {
          const totalProgress = modulesWithProgress.reduce((sum, module) => sum + module.progress, 0);
          setOverallProgress(Math.round(totalProgress / modulesWithProgress.length));
        } else {
          setOverallProgress(0);
        }
      } catch (error) {
        console.error("Error fetching Mathematics data:", error);
      }
    };

    fetchMathematicsData();
  }, [user, profile]);

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center">
              <Calculator className="mr-2 h-8 w-8 text-ghana-gold dark:text-ghana-gold-dark" />
              Mathematics
            </h1>
            <p className="text-muted-foreground">
              Primary {profile?.grade_level || 4} Mathematics modules aligned with the Ghanaian curriculum
            </p>
          </div>
          
          <div className="mt-4 md:mt-0 flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={() => navigate("/chale")}
              className="flex items-center"
            >
              <Star className="mr-2 h-4 w-4 text-ghana-gold" />
              Ask Chale for Help
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-2 border-ghana-green text-ghana-green hover:bg-ghana-green hover:text-white transition-colors"
              onClick={() => setIsSelectionModalOpen(true)}
            >
              + Start a New Module
            </Button>
          </div>
        </div>

        {/* Overall Progress */}
        <Card className="mb-8">
          <CardHeader className="pb-2">
            <CardTitle>Your Progress</CardTitle>
            <CardDescription>
              Overall completion of Mathematics modules
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{overallProgress}% Complete</span>
              </div>
              <Progress value={overallProgress} variant="warning" />
            </div>
          </CardContent>
        </Card>

        {/* Modules Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {modules.filter((module) => module.progress > 0).length > 0 ? (
            modules.filter((module) => module.progress > 0).map((module) => (
              <Card 
                key={module.id}
                className="overflow-hidden hover:shadow-md transition-all"
              >
                <div className="aspect-video relative overflow-hidden">
                  <img
                    src={module.image}
                    alt={module.title}
                    className="w-full h-full object-cover transition-transform hover:scale-105"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                    <h2 className="text-white text-xl font-bold">{module.title}</h2>
                  </div>
                </div>
                <CardContent className="p-6">
                  <p className="mb-4">{module.description}</p>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{module.progress}% Complete</span>
                    </div>
                    <Progress value={module.progress} variant="warning" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-2 bg-card rounded-lg shadow-md p-8 text-center theme-transition">
              <h2 className="text-2xl font-bold mb-4">Start Your Learning Journey</h2>
              <p className="text-muted-foreground mb-6">Select a module to begin learning Mathematics.</p>
              <Button
                variant="ghana"
                size="lg"
                className="bg-ghana-gold hover:bg-ghana-gold-dark"
                onClick={() => setIsSelectionModalOpen(true)}
              >
                Choose a Module
              </Button>
            </div>
          )}
        </div>
      </div>

      {isSelectionModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center animate-fade-in">
          <div className="bg-background p-8 rounded-lg shadow-xl w-full max-w-4xl relative animate-slide-in-up">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4"
              onClick={() => setIsSelectionModalOpen(false)}
            >
              <X className="h-6 w-6" />
            </Button>
            <ModuleSelectionWizard subject="mathematics" onClose={() => setIsSelectionModalOpen(false)} />
          </div>
        </div>
      )}
    </AppLayout>
  );
}