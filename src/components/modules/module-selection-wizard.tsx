import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getModulesWithChildren, type Module, type Topic, type Exercise } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth-store';
import { useNavigate } from 'react-router-dom';

interface ModuleSelectionWizardProps {
  subject: 'english' | 'mathematics';
  onClose: () => void;
}

export function ModuleSelectionWizard({ subject, onClose }: ModuleSelectionWizardProps) {
  const [step, setStep] = useState(1);
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);

  const [loading, setLoading] = useState(true);

  const { profile } = useAuthStore();
  const navigate = useNavigate();

  // Single fetch: load all modules with their topics and exercises
  useEffect(() => {
    const fetchAll = async () => {
      if (!profile) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const fetchedModules = await getModulesWithChildren(profile.grade_level, subject);
        setModules(fetchedModules);
      } catch (error) {
        console.error(`Error fetching ${subject} modules:`, error);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [subject, profile]);

  const handleModuleSelect = (module: Module) => {
    setSelectedModule(module);
    setStep(2);
  };

  const handleTopicSelect = (topic: Topic) => {
    setSelectedTopic(topic);
    const exercises = topic.exercises || [];
    if (exercises.length === 0) {
      navigate(`/questions?subject=${subject}&topic_name=${topic.title}&exercise_name=${topic.title}&module_id=${selectedModule?.id}&topic_id=${topic.id}`);
      onClose();
    } else {
      setStep(3);
    }
  };

  const handleExerciseSelect = (exercise: Exercise) => {
    navigate(`/questions?subject=${subject}&topic_name=${selectedTopic?.title}&exercise_name=${exercise.title}&module_id=${selectedModule?.id}&topic_id=${selectedTopic?.id}&exercise_id=${exercise.id}`);
    onClose();
  };

  const topics = selectedModule?.topics || [];
  const exercises = selectedTopic?.exercises || [];

  const renderStep = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <h2 className="text-xl font-bold mb-4 text-ghana-green dark:text-ghana-gold">
              Loading modules...
            </h2>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ghana-green dark:border-ghana-gold mx-auto"></div>
          </div>
        </div>
      );
    }

    switch (step) {
      case 1:
        return (
          <div>
            <h3 className="text-xl font-semibold mb-4">1. Select a Module</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {modules.map((module) => (
                <Card key={module.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleModuleSelect(module)}>
                  <CardContent className="p-6">
                    <h4 className="font-bold">{module.title}</h4>
                    <p className="text-sm text-muted-foreground mt-2">{module.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      case 2:
        return (
          <div>
            <h3 className="text-xl font-semibold mb-4">2. Select a Topic</h3>
            {topics.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {topics.map((topic) => (
                  <Card key={topic.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleTopicSelect(topic)}>
                    <CardContent className="p-6">
                      <h4 className="font-bold">{topic.title}</h4>
                      <p className="text-sm text-muted-foreground mt-2">{topic.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  No specific topics are available for this module yet.
                </p>
                <Button
                  onClick={() => {
                    navigate(`/questions?subject=${subject}&topic_name=${selectedModule?.title}&exercise_name=${selectedModule?.title}&module_id=${selectedModule?.id}`);
                    onClose();
                  }}
                >
                  Start Learning
                </Button>
              </div>
            )}
          </div>
        );
      case 3:
        return (
          <div>
            <h3 className="text-xl font-semibold mb-4">3. Select an Exercise</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {exercises.map((exercise) => (
                <Card key={exercise.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleExerciseSelect(exercise)}>
                  <CardContent className="p-6">
                    <h4 className="font-bold">{exercise.title}</h4>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      default:
        return <div>Selection Complete</div>;
    }
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Start a New Session</h2>
        {step > 1 && (
          <Button variant="outline" onClick={() => setStep(step - 1)}>
            Back
          </Button>
        )}
      </div>
      {renderStep()}
    </div>
  );
}
