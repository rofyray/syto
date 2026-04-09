import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/auth-store";
import { supabase } from "@/lib/supabase";
import { getModulesByGradeAndSubject, getTopicsByModuleId, getExercisesByTopicId } from "@/lib/supabase";
import { generateModule, generateTopic, generateExercise, generateQuestion } from "@/lib/naano-content-generators";
import { NAANOSupabaseService } from "@/lib/supabase-naano";
import { 
  transformToModuleResponse, 
  transformToTopicResponse, 
  transformToExerciseResponse, 
  transformToQuestionResponse,
  NAANOContentRequest
} from "@/types/naano";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import { BookOpen, Calculator, ArrowRight, ArrowLeft, Check } from "lucide-react";

interface ModuleSelectionProps {
  subject: 'english' | 'mathematics';
}

export function ModuleSelection({ subject }: ModuleSelectionProps) {
  // Add debug logging
  console.log(`ModuleSelection rendering with subject: ${subject}`);
  const { user, profile } = useAuthStore();
  const navigate = useNavigate();
  const [step, setStep] = useState<'module' | 'topic' | 'exercise'>('module');
  const [modules, setModules] = useState<any[]>([]);
  const [topics, setTopics] = useState<any[]>([]);
  const [exercises, setExercises] = useState<any[]>([]);
  
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const { showToast } = useToast();
  
  // Fetch modules based on subject and grade level
  useEffect(() => {
    const fetchModules = async () => {
      if (!profile) {
        console.log('ModuleSelection: No profile data available');
        return;
      }
      
      try {
        setLoading(true);
        console.log(`ModuleSelection: Fetching ${subject} modules for grade ${profile.grade_level}`);
        const moduleData = await getModulesByGradeAndSubject(
          profile.grade_level, 
          subject
        );
        console.log(`ModuleSelection: Received ${moduleData.length} modules:`, moduleData);
        setModules(moduleData);
      } catch (error) {
        console.error(`Error fetching ${subject} modules:`, error);
        // Show toast notification for error
        try {
          showToast(`Error loading modules: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
        } catch (toastError) {
          console.error('Toast error:', toastError);
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchModules();
  }, [profile, subject, showToast]);
  
  // Fetch topics when a module is selected
  useEffect(() => {
    const fetchTopics = async () => {
      if (!selectedModule) return;
      
      try {
        setLoading(true);
        const topicData = await getTopicsByModuleId(selectedModule);
        setTopics(topicData);
      } catch (error) {
        console.error('Error fetching topics:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (selectedModule) {
      fetchTopics();
    }
  }, [selectedModule]);
  
  // Fetch exercises when a topic is selected
  useEffect(() => {
    const fetchExercises = async () => {
      if (!selectedTopic) return;
      
      try {
        setLoading(true);
        const exerciseData = await getExercisesByTopicId(selectedTopic);
        setExercises(exerciseData);
      } catch (error) {
        console.error('Error fetching exercises:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (selectedTopic) {
      fetchExercises();
    }
  }, [selectedTopic]);
  
  // Handle module selection
  const handleModuleSelect = (moduleId: string) => {
    setSelectedModule(moduleId);
    setStep('topic');
  };
  
  // Handle topic selection
  const handleTopicSelect = (topicId: string) => {
    setSelectedTopic(topicId);
    setStep('exercise');
  };
  
  // Handle exercise selection and start learning
  const handleExerciseSelect = async (exerciseId: string) => {
    setSelectedExercise(exerciseId);
    setGenerating(true);
    
    try {
      // Find the selected module, topic and exercise objects
      const selectedModuleObj = modules.find(m => m.id === selectedModule);
      const selectedTopicObj = topics.find(t => t.id === selectedTopic);
      const selectedExerciseObj = exercises.find(e => e.id === exerciseId);
      
      if (!selectedModuleObj || !selectedTopicObj || !selectedExerciseObj || !user) {
        throw new Error("Missing required data for content generation");
      }
      
      showToast("Please wait while we create personalized content for you...", "info", 5000);
      
      // Generate topic content using individual arguments
      // We'll use the topic data from the database instead of generating new content
      await generateTopic(
        subject as 'english' | 'mathematics',
        (profile?.grade_level || 4) as 4 | 5 | 6,
        selectedModuleObj.title,
        selectedTopicObj.title,
        selectedModuleObj.title, // moduleContext
        "medium"
      );
      
      // Generate module content using individual arguments
      // We'll use the module data from the database instead of generating new content
      await generateModule(
        subject as 'english' | 'mathematics',
        (profile?.grade_level || 4) as 4 | 5 | 6,
        selectedModuleObj.title,
        "medium"
      );
      
      // Generate exercise content using individual arguments
      const exerciseContent = await generateExercise(
        subject as 'english' | 'mathematics',
        (profile?.grade_level || 4) as 4 | 5 | 6,
        selectedTopicObj.title,
        selectedExerciseObj.title,
        selectedTopicObj.description,
        "medium" // default difficulty
      );
      
      // Generate questions with varying difficulty using individual arguments
      const question1Content = await generateQuestion(
        subject as 'english' | 'mathematics',
        (profile?.grade_level || 4) as 4 | 5 | 6,
        selectedExerciseObj.title,
        `Question 1: ${selectedExerciseObj.title}`,
        exerciseContent.description,
        "easy"
      );
      
      const question2Content = await generateQuestion(
        subject as 'english' | 'mathematics',
        (profile?.grade_level || 4) as 4 | 5 | 6,
        selectedExerciseObj.title,
        `Question 2: ${selectedExerciseObj.title}`,
        exerciseContent.description,
        "medium"
      );
      
      const question3Content = await generateQuestion(
        subject as 'english' | 'mathematics',
        (profile?.grade_level || 4) as 4 | 5 | 6,
        selectedExerciseObj.title,
        `Question 3: ${selectedExerciseObj.title}`,
        exerciseContent.description,
        "hard"
      );
      
      // Save the generated content to Supabase
      // 1. Create module request for Supabase saving
      const moduleRequest: NAANOContentRequest = {
        type: 'module',
        subject: subject as 'english' | 'mathematics',
        grade: (profile?.grade_level || 4) as 4 | 5 | 6,
        title: selectedModuleObj.title,
        topic: selectedModuleObj.title,
        difficulty: "medium"
      };
      
      // Transform to proper module response type
      const moduleResponse = transformToModuleResponse({
        id: selectedModuleObj.id,
        type: 'module',
        title: selectedModuleObj.title,
        description: selectedModuleObj.description,
        grade: (profile?.grade_level || 4) as 4 | 5 | 6,
        subject: subject as 'english' | 'mathematics',
        content: {},
        metadata: {
          difficulty: 'medium',
          culturalContext: '',
          learningObjectives: [],
          estimatedDuration: '30 minutes',
          prerequisites: [],
          ghanaianContext: true
        }
      }, moduleRequest as any);
      
      // Save the module
      const studentModule = await NAANOSupabaseService.saveStudentModule(
        user.id,
        moduleResponse,
        moduleRequest as any, // Type cast to avoid TypeScript errors
        `Generate module for ${subject} grade ${profile?.grade_level || 4}`
      );
      
      // 2. Create topic request and transform to proper type
      const topicRequest: NAANOContentRequest = {
        type: 'topic',
        subject: subject as 'english' | 'mathematics',
        grade: (profile?.grade_level || 4) as 4 | 5 | 6,
        title: selectedTopicObj.title,
        topic: selectedTopicObj.title,
        context: `This topic is part of the module: ${selectedModuleObj.title}`,
        difficulty: "medium",
        orderIndex: 0
      };
      
      // Transform to proper topic response type
      const topicResponse = transformToTopicResponse({
        id: selectedTopicObj.id,
        type: 'topic',
        title: selectedTopicObj.title,
        description: selectedTopicObj.description,
        grade: (profile?.grade_level || 4) as 4 | 5 | 6,
        subject: subject as 'english' | 'mathematics',
        content: { text: selectedTopicObj.description },
        metadata: {
          difficulty: 'medium',
          culturalContext: '',
          learningObjectives: [],
          estimatedDuration: '30 minutes',
          prerequisites: [],
          ghanaianContext: true
        }
      }, topicRequest as any);
      
      // Save the topic
      const studentTopic = await NAANOSupabaseService.saveStudentTopic(
        user.id,
        studentModule.id,
        topicResponse,
        topicRequest as any, // Type cast to avoid TypeScript errors
        `Generate topic for ${selectedTopicObj.title}`,
        0
      );
      
      // 3. Create exercise request and transform to proper type
      const exerciseRequest: NAANOContentRequest = {
        type: 'exercise',
        subject: subject as 'english' | 'mathematics',
        grade: (profile?.grade_level || 4) as 4 | 5 | 6,
        title: selectedExerciseObj.title,
        topic: selectedTopicObj.title,
        context: `This exercise is part of the topic: ${selectedTopicObj.description}`,
        difficulty: "medium",
        orderIndex: 0
      };
      
      // Transform to proper exercise response type
      const exerciseResponse = transformToExerciseResponse(exerciseContent, exerciseRequest as any);
      
      // Save the exercise
      const studentExercise = await NAANOSupabaseService.saveStudentExercise(
        user.id,
        studentTopic.id,
        exerciseResponse,
        exerciseRequest as any, // Type cast to avoid TypeScript errors
        `Generate exercise for ${selectedExerciseObj.title}`,
        0
      );
      
      // 4. Save the questions with proper transformations
      // Question 1 (Easy)
      const question1Request: NAANOContentRequest = {
        type: 'question',
        subject: subject as 'english' | 'mathematics',
        grade: (profile?.grade_level || 4) as 4 | 5 | 6,
        title: `Question 1: ${selectedExerciseObj.title}`,
        topic: selectedExerciseObj.title,
        context: `This question is part of the exercise: ${exerciseContent.description}`,
        difficulty: "easy",
        orderIndex: 0
      };
      const question1Response = transformToQuestionResponse(question1Content, question1Request as any);
      await NAANOSupabaseService.saveStudentQuestion(
        user.id,
        studentExercise.id,
        question1Response,
        question1Request as any, // Type cast to avoid TypeScript errors
        `Generate easy question for ${selectedExerciseObj.title}`,
        0
      );
      
      // Question 2 (Medium)
      const question2Request: NAANOContentRequest = {
        type: 'question',
        subject: subject as 'english' | 'mathematics',
        grade: (profile?.grade_level || 4) as 4 | 5 | 6,
        title: `Question 2: ${selectedExerciseObj.title}`,
        topic: selectedExerciseObj.title,
        context: `This question is part of the exercise: ${exerciseContent.description}`,
        difficulty: "medium",
        orderIndex: 1
      };
      const question2Response = transformToQuestionResponse(question2Content, question2Request as any);
      await NAANOSupabaseService.saveStudentQuestion(
        user.id,
        studentExercise.id,
        question2Response,
        question2Request as any, // Type cast to avoid TypeScript errors
        `Generate medium question for ${selectedExerciseObj.title}`,
        1
      );
      
      // Question 3 (Hard)
      const question3Request: NAANOContentRequest = {
        type: 'question',
        subject: subject as 'english' | 'mathematics',
        grade: (profile?.grade_level || 4) as 4 | 5 | 6,
        title: `Question 3: ${selectedExerciseObj.title}`,
        topic: selectedExerciseObj.title,
        context: `This question is part of the exercise: ${exerciseContent.description}`,
        difficulty: "hard",
        orderIndex: 2
      };
      const question3Response = transformToQuestionResponse(question3Content, question3Request as any);
      await NAANOSupabaseService.saveStudentQuestion(
        user.id,
        studentExercise.id,
        question3Response,
        question3Request as any, // Type cast to avoid TypeScript errors
        `Generate hard question for ${selectedExerciseObj.title}`,
        2
      );
      
      // 5. Create initial progress records
      // Since we don't have direct access to the saveStudentProgress method,
      // we'll use the available methods to track progress
      
      // Track module progress
      try {
        await supabase
          .from('student_progress')
          .insert({
            student_id: user.id,
            student_module_id: studentModule.id,
            status: 'in_progress',
            attempts: 0,
            time_spent_seconds: 0,
            hints_used: 0,
            started_at: new Date().toISOString(),
            last_accessed_at: new Date().toISOString()
          });
      } catch (error) {
        console.error("Error creating module progress:", error);
      }
      
      // Track topic progress
      try {
        await supabase
          .from('student_progress')
          .insert({
            student_id: user.id,
            student_topic_id: studentTopic.id,
            status: 'in_progress',
            attempts: 0,
            time_spent_seconds: 0,
            hints_used: 0,
            started_at: new Date().toISOString(),
            last_accessed_at: new Date().toISOString()
          });
      } catch (error) {
        console.error("Error creating topic progress:", error);
      }
      
      // Track exercise progress
      try {
        await supabase
          .from('student_progress')
          .insert({
            student_id: user.id,
            student_exercise_id: studentExercise.id,
            status: 'in_progress',
            attempts: 0,
            time_spent_seconds: 0,
            hints_used: 0,
            started_at: new Date().toISOString(),
            last_accessed_at: new Date().toISOString()
          });
      } catch (error) {
        console.error("Error creating exercise progress:", error);
      }
      
      showToast("Your personalized learning content is ready.", "success");
      
      // Navigate to the subject page
      navigate(`/${subject}`);
      
    } catch (error) {
      showToast("Error generating content: " + error, "error");
      setGenerating(false);
    }
  };
  
  // Go back to previous step
  const handleBack = () => {
    if (step === 'topic') {
      setStep('module');
      setSelectedTopic(null);
    } else if (step === 'exercise') {
      setStep('topic');
      setSelectedExercise(null);
    }
  };
  
  // Get the current selection title
  const getCurrentSelectionTitle = () => {
    if (step === 'module') {
      return `Select a ${subject === 'english' ? 'English Language' : 'Mathematics'} Module`;
    } else if (step === 'topic') {
      const module = modules.find(m => m.id === selectedModule);
      return `Select a Topic from ${module?.title || ''}`;
    } else {
      const topic = topics.find(t => t.id === selectedTopic);
      return `Select an Exercise from ${topic?.title || ''}`;
    }
  };
  
  // Get the icon based on subject
  const SubjectIcon = subject === 'english' ? BookOpen : Calculator;
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center">
          <SubjectIcon className={`mr-2 h-8 w-8 ${subject === 'english' ? 'text-ghana-green' : 'text-ghana-gold'}`} />
          {subject === 'english' ? 'English Language' : 'Mathematics'} Learning Path
        </h1>
        <p className="text-muted-foreground">
          Primary {profile?.grade_level || 4} {subject === 'english' ? 'English Language' : 'Mathematics'} curriculum
        </p>
      </div>
      
      {/* Progress Indicator */}
      <div className="mb-8">
        <Tabs defaultValue={step} value={step} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger 
              value="module" 
              disabled={step !== 'module'}
              className={step === 'module' ? 'font-bold' : ''}
            >
              1. Module
            </TabsTrigger>
            <TabsTrigger 
              value="topic" 
              disabled={step !== 'topic'}
              className={step === 'topic' ? 'font-bold' : ''}
            >
              2. Topic
            </TabsTrigger>
            <TabsTrigger 
              value="exercise" 
              disabled={step !== 'exercise'}
              className={step === 'exercise' ? 'font-bold' : ''}
            >
              3. Exercise
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      {/* Selection Title */}
      <h2 className="text-2xl font-bold mb-6">{getCurrentSelectionTitle()}</h2>
      
      {/* Toast notifications are now handled by the ToastProvider */}
      
      {loading || generating ? (
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center">
        </div>
      ) : (
        <>
          {/* Module Selection */}
          {step === 'module' && (
            <>
              {modules.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[200px]">
                  <span className="text-lg text-muted-foreground">No modules available for your grade and subject.</span>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" role="list" aria-label="Module List">
                  {modules.map((module) => (
                    <Card
                      key={module.id}
                      className={`cursor-pointer hover:shadow-md transition-all ${selectedModule === module.id ? 'ring-2 ring-offset-2 ' + (subject === 'english' ? 'ring-ghana-green' : 'ring-ghana-gold') : ''}`}
                      onClick={() => handleModuleSelect(module.id)}
                      tabIndex={0}
                      aria-selected={selectedModule === module.id}
                      aria-label={`Select module ${module.title}`}
                      role="listitem"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') handleModuleSelect(module.id);
                      }}
                    >
                      <CardHeader className="pb-2">
                        <CardTitle>{module.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">{module.description}</p>
                        <Button
                          variant="ghost"
                          className={`w-full ${subject === 'english' ? 'bg-ghana-green hover:bg-ghana-green-dark' : 'bg-ghana-gold hover:bg-ghana-gold-dark'} text-white`}
                        >
                          Select <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
          {/* Topic Selection */}
          {step === 'topic' && (
            <>
              {topics.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[200px]">
                  <span className="text-lg text-muted-foreground">No topics available for this module.</span>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" role="list" aria-label="Topic List">
                  {topics.map((topic) => (
                    <Card
                      key={topic.id}
                      className={`cursor-pointer hover:shadow-md transition-all ${selectedTopic === topic.id ? 'ring-2 ring-offset-2 ' + (subject === 'english' ? 'ring-ghana-green' : 'ring-ghana-gold') : ''}`}
                      onClick={() => handleTopicSelect(topic.id)}
                      tabIndex={0}
                      aria-selected={selectedTopic === topic.id}
                      aria-label={`Select topic ${topic.title}`}
                      role="listitem"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') handleTopicSelect(topic.id);
                      }}
                    >
                      <CardHeader className="pb-2">
                        <CardTitle>{topic.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">{topic.description}</p>
                        <Button
                          variant="ghost"
                          className={`w-full ${subject === 'english' ? 'bg-ghana-green hover:bg-ghana-green-dark' : 'bg-ghana-gold hover:bg-ghana-gold-dark'} text-white`}
                        >
                          Select <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
              <div className="mt-6">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="flex items-center"
                  aria-label="Back to Modules"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back to Modules
                </Button>
              </div>
            </>
          )}
          {/* Exercise Selection */}
          {step === 'exercise' && (
            <>
              {exercises.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[200px]">
                  <span className="text-lg text-muted-foreground">No exercises available for this topic.</span>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" role="list" aria-label="Exercise List">
                  {exercises.map((exercise) => (
                    <Card
                      key={exercise.id}
                      className={`cursor-pointer hover:shadow-md transition-all ${selectedExercise === exercise.id ? 'ring-2 ring-offset-2 ' + (subject === 'english' ? 'ring-ghana-green' : 'ring-ghana-gold') : ''}`}
                      onClick={() => handleExerciseSelect(exercise.id)}
                      tabIndex={0}
                      aria-selected={selectedExercise === exercise.id}
                      aria-label={`Select exercise ${exercise.title}`}
                      role="listitem"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') handleExerciseSelect(exercise.id);

// Go back to previous step
const handleBack = () => {
  if (step === 'topic') {
    setStep('module');
    setSelectedTopic(null);
  } else if (step === 'exercise') {
    setStep('topic');
    setSelectedExercise(null);
  }
};

// Get the current selection title
const getCurrentSelectionTitle = () => {
  if (step === 'module') {
    return `Select a ${subject === 'english' ? 'English Language' : 'Mathematics'} Module`;
  } else if (step === 'topic') {
    const module = modules.find(m => m.id === selectedModule);
    return `Select a Topic from ${module?.title || ''}`;
  } else {
    const topic = topics.find(t => t.id === selectedTopic);
    return `Select an Exercise from ${topic?.title || ''}`;
  }
};

// Get the icon based on subject
const SubjectIcon = subject === 'english' ? BookOpen : Calculator;

return (
  <div className="container mx-auto px-4 py-8">
    <div className="mb-8">
      <h1 className="text-3xl font-bold mb-2 flex items-center">
        <SubjectIcon className={`mr-2 h-8 w-8 ${subject === 'english' ? 'text-ghana-green' : 'text-ghana-gold'}`} />
        {subject === 'english' ? 'English Language' : 'Mathematics'} Learning Path
      </h1>
      <p className="text-muted-foreground">
        Primary {profile?.grade_level || 4} {subject === 'english' ? 'English Language' : 'Mathematics'} curriculum
      </p>
    </div>
    
    {/* Progress Indicator */}
    <div className="mb-8">
      <Tabs defaultValue={step} value={step} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger 
            value="module" 
            disabled={step !== 'module'}
            className={step === 'module' ? 'font-bold' : ''}
          >
            1. Module
          </TabsTrigger>
          <TabsTrigger 
            value="topic" 
            disabled={step !== 'topic'}
            className={step === 'topic' ? 'font-bold' : ''}
          >
            2. Topic
          </TabsTrigger>
          <TabsTrigger 
            value="exercise" 
            disabled={step !== 'exercise'}
            className={step === 'exercise' ? 'font-bold' : ''}
          >
            3. Exercise
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
    
    {/* Selection Title */}
    <h2 className="text-2xl font-bold mb-6">{getCurrentSelectionTitle()}</h2>
    
    {/* Toast notifications are now handled by the ToastProvider */}
    
    {loading || generating ? (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center">
      </div>
    ) : (
      <>
        {/* Module Selection */}
        {step === 'module' && (
          <>
            {modules.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[200px]">
                <span className="text-lg text-muted-foreground">No modules available for your grade and subject.</span>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" role="list" aria-label="Module List">
                {modules.map((module) => (
                  <Card
                    key={module.id}
                    className={`cursor-pointer hover:shadow-md transition-all ${selectedModule === module.id ? 'ring-2 ring-offset-2 ' + (subject === 'english' ? 'ring-ghana-green' : 'ring-ghana-gold') : ''}`}
                    onClick={() => handleModuleSelect(module.id)}
                    tabIndex={0}
                    aria-selected={selectedModule === module.id}
                    aria-label={`Select module ${module.title}`}
                    role="listitem"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') handleModuleSelect(module.id);
                    }}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle>{module.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">{module.description}</p>
                      <Button
                        variant="ghost"
                        className={`w-full ${subject === 'english' ? 'bg-ghana-green hover:bg-ghana-green-dark' : 'bg-ghana-gold hover:bg-ghana-gold-dark'} text-white`}
                      >
                        Select <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
        {/* Topic Selection */}
        {step === 'topic' && (
          <>
            {topics.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[200px]">
                <span className="text-lg text-muted-foreground">No topics available for this module.</span>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" role="list" aria-label="Topic List">
                {topics.map((topic) => (
                  <Card
                    key={topic.id}
                    className={`cursor-pointer hover:shadow-md transition-all ${selectedTopic === topic.id ? 'ring-2 ring-offset-2 ' + (subject === 'english' ? 'ring-ghana-green' : 'ring-ghana-gold') : ''}`}
                    onClick={() => handleTopicSelect(topic.id)}
                    tabIndex={0}
                    aria-selected={selectedTopic === topic.id}
                    aria-label={`Select topic ${topic.title}`}
                    role="listitem"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') handleTopicSelect(topic.id);
                    }}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle>{topic.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">{topic.description}</p>
                      <Button
                        variant="ghost"
                        className={`w-full ${subject === 'english' ? 'bg-ghana-green hover:bg-ghana-green-dark' : 'bg-ghana-gold hover:bg-ghana-gold-dark'} text-white`}
                      >
                        Select <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            <div className="mt-6">
              <Button
                variant="outline"
                onClick={handleBack}
                className="flex items-center"
                aria-label="Back to Modules"
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Modules
              </Button>
            </div>
          </>
        )}
        {/* Exercise Selection */}
        {step === 'exercise' && (
          <>
            {exercises.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[200px]">
                <span className="text-lg text-muted-foreground">No exercises available for this topic.</span>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" role="list" aria-label="Exercise List">
                {exercises.map((exercise) => (
                  <Card
                    key={exercise.id}
                    className={`cursor-pointer hover:shadow-md transition-all ${selectedExercise === exercise.id ? 'ring-2 ring-offset-2 ' + (subject === 'english' ? 'ring-ghana-green' : 'ring-ghana-gold') : ''}`}
                    onClick={() => handleExerciseSelect(exercise.id)}
                    tabIndex={0}
                    aria-selected={selectedExercise === exercise.id}
                    aria-label={`Select exercise ${exercise.title}`}
                    role="listitem"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') handleExerciseSelect(exercise.id);
                    }}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle>{exercise.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">Type: {exercise.type}</p>
                      <Button
                        variant="ghost"
                        className={`w-full ${subject === 'english' ? 'bg-ghana-green hover:bg-ghana-green-dark' : 'bg-ghana-gold hover:bg-ghana-gold-dark'} text-white`}
                      >
                        Start Exercise <Check className="ml-2 h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            <div className="mt-6">
              <Button
                variant="outline"
                onClick={handleBack}
                className="flex items-center"
                aria-label="Back to Topics"
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Topics
              </Button>
            </div>
          </>
        )}
      </>
    )}
  </div>
);
}
