import { useState, useEffect } from "react";
import { BookText, Calculator, Star, PieChart } from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/auth-store";

// Mock module data (in production, this would come from Supabase)
const mockModules = [
  {
    id: "math-1",
    title: "Number Operations",
    description: "Master addition, subtraction, multiplication, and division with a Ghanaian context.",
    topics: ["Whole Numbers", "Decimals", "Fractions"],
    progress: 60,
    image: "https://images.pexels.com/photos/3808904/pexels-photo-3808904.jpeg?auto=compress&cs=tinysrgb&w=600",
  },
  {
    id: "math-2",
    title: "Basic Algebra",
    description: "Learn about patterns, sequences, and simple equations.",
    topics: ["Patterns and Sequences", "Simple Equations", "Word Problems"],
    progress: 30,
    image: "https://images.pexels.com/photos/3862130/pexels-photo-3862130.jpeg?auto=compress&cs=tinysrgb&w=600",
  },
  {
    id: "math-3",
    title: "Geometry and Measurement",
    description: "Explore shapes, angles, perimeter, area, and volume.",
    topics: ["2D Shapes", "3D Shapes", "Measurement"],
    progress: 15,
    image: "https://images.pexels.com/photos/4118017/pexels-photo-4118017.jpeg?auto=compress&cs=tinysrgb&w=600",
  },
  {
    id: "math-4",
    title: "Data Handling",
    description: "Learn to collect, represent, and interpret data using charts and graphs.",
    topics: ["Data Collection", "Charts and Graphs", "Data Interpretation"],
    progress: 0,
    image: "https://images.pexels.com/photos/669615/pexels-photo-669615.jpeg?auto=compress&cs=tinysrgb&w=600",
  },
];

export function MathematicsPage() {
  const { profile } = useAuthStore();
  const [modules, setModules] = useState(mockModules);
  const [overallProgress, setOverallProgress] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    // Calculate overall progress
    const completed = modules.reduce((sum, module) => sum + module.progress, 0);
    const total = modules.length * 100;
    setOverallProgress(Math.round((completed / total) * 100));
  }, [modules]);

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
          
          <div className="mt-4 md:mt-0">
            <Button
              variant="outline"
              onClick={() => navigate("/chale")}
              className="flex items-center"
            >
              <Star className="mr-2 h-4 w-4 text-ghana-gold" />
              Ask Chale for Help
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
          {modules.map((module) => (
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
                
                <div className="mb-4">
                  <h4 className="text-sm font-semibold mb-2">Topics:</h4>
                  <ul className="space-y-1">
                    {module.topics.map((topic, index) => (
                      <li key={index} className="text-sm flex items-center">
                        <PieChart className="mr-2 h-4 w-4 text-ghana-gold dark:text-ghana-gold-dark" />
                        {topic}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{module.progress}% Complete</span>
                  </div>
                  <Progress value={module.progress} variant="warning" />
                </div>
                
                <Button
                  variant="ghana"
                  className="w-full"
                  onClick={() => navigate(`/mathematics/${module.id}`)}
                >
                  {module.progress > 0 ? "Continue Learning" : "Start Learning"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}