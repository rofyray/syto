import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getModulesWithChildren, type Module, type Topic, type Exercise } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth-store';
import { useLanguageStore } from '@/stores/language-store';
import { useNavigate } from 'react-router-dom';
import { LanguagePicker } from '@/components/questions/language-picker';

interface ModuleSelectionWizardProps {
  subject: 'english' | 'mathematics';
  onClose: () => void;
}

export function ModuleSelectionWizard({ subject, onClose }: ModuleSelectionWizardProps) {
  const [step, setStep] = useState(1);
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  // Store navigation params for the language step to use
  const [pendingNavParams, setPendingNavParams] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);

  const { profile } = useAuthStore();
  const { preferredLanguage, matchesContext, setPreferredLanguage } = useLanguageStore();
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

  const buildNavUrl = (params: {
    topicName?: string;
    exerciseName?: string;
    moduleId?: string;
    topicId?: string;
    exerciseId?: string;
  }) => {
    const parts = [`/questions?subject=${subject}`];
    if (params.topicName) parts.push(`&topic_name=${params.topicName}`);
    if (params.exerciseName) parts.push(`&exercise_name=${params.exerciseName}`);
    if (params.moduleId) parts.push(`&module_id=${params.moduleId}`);
    if (params.topicId) parts.push(`&topic_id=${params.topicId}`);
    if (params.exerciseId) parts.push(`&exercise_id=${params.exerciseId}`);
    return parts.join('');
  };

  const navigateWithLang = (baseUrl: string, langCode: string | null) => {
    const langParam = langCode ? `&lang=${langCode}` : '';
    navigate(baseUrl + langParam);
    onClose();
  };

  const goToLanguageStepOrNavigate = (navUrl: string) => {
    if (selectedModule && matchesContext(subject, selectedModule.id)) {
      // Same subject+module: auto-advance with saved preference
      navigateWithLang(navUrl, preferredLanguage);
    } else {
      // New module or subject: show language picker
      setPendingNavParams(navUrl);
      setStep(100); // Language step
    }
  };

  const handleModuleSelect = (module: Module) => {
    setSelectedModule(module);
    setStep(2);
  };

  const handleTopicSelect = (topic: Topic) => {
    setSelectedTopic(topic);
    const exercises = topic.exercises || [];
    if (exercises.length === 0) {
      const navUrl = buildNavUrl({
        topicName: topic.title,
        exerciseName: topic.title,
        moduleId: selectedModule?.id,
        topicId: topic.id,
      });
      goToLanguageStepOrNavigate(navUrl);
    } else {
      setStep(3);
    }
  };

  const handleExerciseSelect = (exercise: Exercise) => {
    const navUrl = buildNavUrl({
      topicName: selectedTopic?.title,
      exerciseName: exercise.title,
      moduleId: selectedModule?.id,
      topicId: selectedTopic?.id,
      exerciseId: exercise.id,
    });
    goToLanguageStepOrNavigate(navUrl);
  };

  const handleLanguageSelect = (langCode: string | null) => {
    // Save language with subject+module context so it auto-applies for this module only
    if (selectedModule) {
      setPreferredLanguage(langCode, { subject, moduleId: selectedModule.id });
    }
    if (pendingNavParams) {
      navigateWithLang(pendingNavParams, langCode);
    }
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
                    const navUrl = buildNavUrl({
                      topicName: selectedModule?.title,
                      exerciseName: selectedModule?.title,
                      moduleId: selectedModule?.id,
                    });
                    goToLanguageStepOrNavigate(navUrl);
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
      case 100: // Language selection step
        return (
          <div>
            <h3 className="text-xl font-semibold mb-4">Choose Quiz Language</h3>
            <LanguagePicker
              onSelect={handleLanguageSelect}
              inline
            />
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
          <Button variant="outline" onClick={() => {
            if (step === 100) {
              // Go back from language step to the previous content step
              const exercises = selectedTopic?.exercises || [];
              setStep(exercises.length > 0 ? 3 : 2);
            } else {
              setStep(step - 1);
            }
          }}>
            Back
          </Button>
        )}
      </div>
      {renderStep()}
    </div>
  );
}
