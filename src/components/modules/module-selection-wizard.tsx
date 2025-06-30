import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getModulesByGradeAndSubject, getTopicsByModuleId, getExercisesByTopicId, type Module, type Topic, type Exercise } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth-store';
import { useNavigate } from 'react-router-dom';

interface ModuleSelectionWizardProps {
  subject: 'english' | 'mathematics';
  onClose: () => void;
}

export function ModuleSelectionWizard({ subject, onClose }: ModuleSelectionWizardProps) {
  const [step, setStep] = useState(1);
  const [modules, setModules] = useState<Module[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);

  const [loading, setLoading] = useState(true);

  const { profile } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchModules = async () => {
      if (!profile) return;
      setLoading(true);
      try {
        const fetchedModules = await getModulesByGradeAndSubject(profile.grade_level, subject);
        setModules(fetchedModules);
      } catch (error) {
        console.error(`Error fetching ${subject} modules:`, error);
      } finally {
        setLoading(false);
      }
    };
    fetchModules();
  }, [subject, profile]);

  useEffect(() => {
    const fetchTopics = async () => {
      if (!selectedModule) return;
      setLoading(true);
      try {
        const fetchedTopics = await getTopicsByModuleId(selectedModule.id);
        setTopics(fetchedTopics);
      } catch (error) {
        console.error(`Error fetching topics for module ${selectedModule.id}:`, error);
      } finally {
        setLoading(false);
      }
    };
    fetchTopics();
  }, [selectedModule]);

  useEffect(() => {
    const fetchExercises = async () => {
      if (!selectedTopic) return;
      setLoading(true);
      try {
        const fetchedExercises = await getExercisesByTopicId(selectedTopic.id);
        if (fetchedExercises.length === 0) {
          // If no exercises are found, navigate directly to the questions page for the topic
          navigate(`/questions?subject=${subject}&topic_name=${selectedTopic.title}&exercise_name=${selectedTopic.title}`);
          onClose();
        } else {
          setExercises(fetchedExercises);
          setStep(3); // Proceed to exercise selection
        }
      } catch (error) {
        console.error(`Error fetching exercises for topic ${selectedTopic.id}:`, error);
        // Optionally, handle the error in the UI
      } finally {
        setLoading(false);
      }
    };
    fetchExercises();
  }, [selectedTopic, navigate, onClose, subject]);

  const handleModuleSelect = (module: Module) => {
    setSelectedModule(module);
    setStep(2);
  };

  const handleTopicSelect = (topic: Topic) => {
    setSelectedTopic(topic);
    // The logic to advance the step or navigate is now handled by the useEffect hook
    // that triggers when selectedTopic changes.
  };

  const handleExerciseSelect = (exercise: Exercise) => {

    navigate(`/questions?subject=${subject}&topic_name=${selectedTopic?.title}&exercise_name=${exercise.title}`);
    onClose();
  };

  const renderStep = () => {
    if (loading) {
      return <div className="text-center">Loading...</div>;
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

