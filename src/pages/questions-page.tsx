import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

import { useAuthStore } from '@/stores/auth-store';
import {
  saveUserAnswers,
  completeExercise,
  startExercise,
  type UserAnswer
} from '@/lib/supabase';
// Local type for AI-generated questions, as it includes the correct answer.
interface AIQuestion {
  id?: string;
  question_text: string;
  options: string[];
  correct_answer: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { AppLayout } from '@/components/layout/app-layout';
import { Loader2, AlertCircle, ChevronLeft, ChevronRight, List, Trophy, CheckCircle2, XCircle, Sparkles } from 'lucide-react';
import { useToast } from '@/components/ui/toast';

export function QuestionsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const topicName = searchParams.get('topic_name');
  const exerciseName = searchParams.get('exercise_name');
  const subject = searchParams.get('subject');
  const moduleId = searchParams.get('module_id');
  const topicId = searchParams.get('topic_id');
  const exerciseId = searchParams.get('exercise_id');
  const { profile } = useAuthStore();
  const { showToast } = useToast();

  const [generatedQuestions, setGeneratedQuestions] = useState<AIQuestion[]>([]);
  const [score, setScore] = useState(0);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [sessionId] = useState<string>(() => crypto.randomUUID());
  const [startTime] = useState<number>(() => Date.now());
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const [isNavExpanded, setIsNavExpanded] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    if (topicName && exerciseName && subject && profile) {
      const fetchQuestions = async () => {
        try {
          // Start tracking exercise
          if (moduleId && topicId && exerciseId) {
            await startExercise(profile.id, moduleId, topicId, exerciseId);
          }

          const response = await fetch('/api/naano/generate-questions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              topic: topicName,
              subject: subject,
              grade: profile.grade_level,
              difficulty: 'medium',
              count: 5,
            }),
          });

          const data = await response.json();

          // Check for NAANO offline error
          if (!response.ok) {
            if (data.code === 'CURRICULUM_DATABASE_OFFLINE') {
              setHasError(true);
              showToast(
                'NAANO is currently offline. The curriculum database is unavailable. Please try again in a few minutes.',
                'error',
                6000
              );
              // Navigate back after showing error
              setTimeout(() => {
                navigate(-1);
              }, 3000);
              return;
            }
            throw new Error(data.error || `HTTP error! status: ${response.status}`);
          }

          if (data.success && data.questions) {
            // Transform to match expected format
            const transformedQuestions = data.questions.map((q: any, index: number) => ({
              id: `gen-${sessionId}-${index}`,
              question_text: q.questionText || q.question_text,
              options: q.options,
              correct_answer: q.correctAnswer || q.correct_answer,
              difficulty: 'medium' as const,
            }));
            setGeneratedQuestions(transformedQuestions);
          } else {
            console.error('Invalid response format:', data);
            setHasError(true);
            showToast('Failed to generate questions. Please try again.', 'error', 5000);
          }
        } catch (error) {
          console.error('Error fetching questions:', error);
          setHasError(true);
          showToast('An error occurred while generating questions. Please try again.', 'error', 5000);
          // Navigate back after showing error
          setTimeout(() => {
            navigate(-1);
          }, 3000);
        } finally {
          setIsLoading(false);
        }
      };

      fetchQuestions();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicName, exerciseName, subject, profile, moduleId, topicId, exerciseId, sessionId]);

  const handleAnswerSelect = (questionIndex: number, answer: string) => {
    setSelectedAnswers(prev => ({ ...prev, [questionIndex]: answer }));
  };

  const handleCheckAnswer = async () => {
    const selectedAnswer = selectedAnswers[currentQuestionIndex];
    const currentQ = generatedQuestions[currentQuestionIndex];
    const correctAnswer = currentQ.correct_answer;
    const isCorrect = selectedAnswer === correctAnswer;

    if (isCorrect) {
      setScore(prev => prev + 1);
    }
    setIsAnswerChecked(true);
    setShowFeedback(true);

    // Animate feedback out after 2 seconds
    setTimeout(() => {
      setShowFeedback(false);
    }, 2000);

    // Save user answer to database
    if (profile && moduleId && topicId && exerciseId && currentQ.id) {
      const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);

      const userAnswer: Omit<UserAnswer, 'id' | 'created_at'> = {
        user_id: profile.id,
        question_id: currentQ.id,
        user_answer: selectedAnswer || '',
        correct_answer: correctAnswer,
        is_correct: isCorrect,
        exercise_id: exerciseId,
        topic_id: topicId,
        module_id: moduleId,
        difficulty: currentQ.difficulty,
        question_type: 'multiple-choice',
        time_spent_seconds: timeSpent,
        session_id: sessionId,
        attempt_number: 1,
      };

      try {
        await saveUserAnswers([userAnswer]);
      } catch (error) {
        console.error('Error saving user answer:', error);
      }
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < generatedQuestions.length - 1) {
      setCurrentQuestionIndex(prevIndex => prevIndex + 1);
      setIsAnswerChecked(false);
      setShowFeedback(false);
      setQuestionStartTime(Date.now());
      setIsNavExpanded(false); // Collapse nav when moving to next question
    } else {
      setQuizFinished(true);
      handleQuizComplete();
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prevIndex => prevIndex - 1);
      setIsAnswerChecked(false);
      setShowFeedback(false);
      setQuestionStartTime(Date.now());
      setIsNavExpanded(false); // Collapse nav when moving to previous question
    }
  };

  const goToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
    setIsAnswerChecked(false);
    setShowFeedback(false);
    setQuestionStartTime(Date.now());
    setIsNavExpanded(false);
  };

  const handleQuizComplete = async () => {
    if (!profile || !moduleId || !topicId || !exerciseId) return;

    const totalTimeSpent = Math.floor((Date.now() - startTime) / 1000);
    const finalScore = Math.round((score / generatedQuestions.length) * 100);

    try {
      await completeExercise(
        profile.id,
        moduleId,
        topicId,
        exerciseId,
        finalScore,
        totalTimeSpent
      );
    } catch (error) {
      console.error('Error completing exercise:', error);
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex flex-col justify-center items-center h-screen">
          {hasError ? (
            <>
              <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
              <p className="text-xl font-semibold text-red-600 mb-2">NAANO is currently offline</p>
              <p className="text-gray-600 mb-4">Redirecting you back...</p>
            </>
          ) : (
            <>
              <Loader2 className="h-12 w-12 animate-spin mb-4" />
              <p className="text-lg">NAANO is preparing your questions...</p>
            </>
          )}
        </div>
      </AppLayout>
    );
  }



  if (quizFinished) {
    return (
      <AppLayout>
        <div className="container mx-auto p-4 flex justify-center items-center min-h-screen">
          <Card className="w-full max-w-2xl text-center">
            <CardHeader>
              <CardTitle>Quiz Complete!</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">Your final score is:</p>
              <p className="text-4xl font-bold my-4">{score} / {generatedQuestions.length}</p>
              <Button onClick={() => window.history.back()}>Try Another Topic</Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  if (generatedQuestions.length === 0) {
    // This can be a placeholder or a message indicating no questions were loaded
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-screen">
          <p className="text-lg">Waiting for questions...</p>
        </div>
      </AppLayout>
    );
  }

  const currentQuestion = generatedQuestions[currentQuestionIndex];
  const isCorrect = selectedAnswers[currentQuestionIndex] === currentQuestion.correct_answer;

  // Determine theme colors based on subject
  const isMathematics = subject?.toLowerCase() === 'mathematics';
  const themeColor = isMathematics ? 'amber' : 'emerald';
  const primaryGlass = isMathematics ? 'liquid-glass-primary-math' : 'liquid-glass-primary-english';

  return (
    <AppLayout>
      <div className="container mx-auto p-4 flex flex-col justify-center items-center min-h-screen relative">
        {/* Main Quiz Card */}
        <div className="w-full max-w-3xl mb-4">
          <Card className="liquid-glass shadow-2xl border border-white/20">
            <CardHeader className="liquid-glass-header border-b border-white/10">
              <CardTitle className="text-2xl flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Sparkles className={`h-6 w-6 ${isMathematics ? 'text-amber-400' : 'text-emerald-400'}`} />
                  Question {currentQuestionIndex + 1} of {generatedQuestions.length}
                </span>
                {/* Score Badge */}
                <div className="flex items-center gap-2 liquid-glass-accent px-4 py-2 rounded-full shadow-lg border border-amber-300/30 shadow-amber-500/30">
                  <Trophy className="h-5 w-5 text-amber-200" />
                  <span className="font-bold text-lg text-white">{score}</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 relative">
              {/* Question Text */}
              <p className="text-xl mb-8 font-medium leading-relaxed">{currentQuestion.question_text}</p>

              {/* Answer Options */}
              <RadioGroup
                value={selectedAnswers[currentQuestionIndex] || ''}
                onValueChange={(value: string) => handleAnswerSelect(currentQuestionIndex, value)}
                disabled={isAnswerChecked}
                className="space-y-3"
              >
                {currentQuestion.options?.map((option, index) => (
                  <div
                    key={index}
                    className={`flex items-center space-x-3 p-4 rounded-lg border transition-all duration-200 ${
                      isAnswerChecked && option === currentQuestion.correct_answer
                        ? 'liquid-glass-success border-green-400/50 shadow-lg shadow-green-500/20'
                        : isAnswerChecked && option === selectedAnswers[currentQuestionIndex] && !isCorrect
                        ? 'liquid-glass-error border-red-400/50 shadow-lg shadow-red-500/20'
                        : `liquid-glass-option border-white/20 ${
                            isMathematics
                              ? 'hover:border-amber-400/50 hover:shadow-lg hover:shadow-amber-500/20'
                              : 'hover:border-emerald-400/50 hover:shadow-lg hover:shadow-emerald-500/20'
                          }`
                    }`}
                  >
                    <RadioGroupItem value={option} id={`q${currentQuestionIndex}-option-${index}`} />
                    <Label
                      htmlFor={`q${currentQuestionIndex}-option-${index}`}
                      className="flex-1 cursor-pointer text-base font-medium"
                    >
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>

              {/* Animated Feedback */}
              {isAnswerChecked && showFeedback && (
                <div className={`mt-6 p-6 rounded-xl transform transition-all duration-500 ease-out ${
                  showFeedback ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
                } ${
                  isCorrect
                    ? 'liquid-glass-success border border-green-300/30 shadow-2xl shadow-green-500/30'
                    : 'liquid-glass-error border border-red-300/30 shadow-2xl shadow-red-500/30'
                } text-white`}>
                  <div className="flex items-center justify-center gap-3">
                    {isCorrect ? (
                      <>
                        <CheckCircle2 className="h-10 w-10 animate-bounce" />
                        <div className="text-center">
                          <p className="text-3xl font-bold">Correct! 🎉</p>
                          <p className="text-sm mt-1 opacity-90">Great job! Keep it up!</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-10 w-10 animate-pulse" />
                        <div className="text-center">
                          <p className="text-3xl font-bold">Not quite! 💭</p>
                          <p className="text-sm mt-1 opacity-90">The correct answer is: <span className="font-bold">{currentQuestion.correct_answer}</span></p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Check Answer Button */}
              <div className="mt-8 flex justify-center">
                <Button
                  onClick={handleCheckAnswer}
                  disabled={!selectedAnswers[currentQuestionIndex] || isAnswerChecked}
                  className={`px-8 py-6 text-lg font-bold rounded-xl shadow-lg transition-all duration-200 border ${
                    isAnswerChecked
                      ? 'liquid-glass-disabled cursor-not-allowed border-white/10'
                      : `${primaryGlass} ${
                          isMathematics
                            ? 'border-amber-300/30 hover:shadow-2xl hover:shadow-amber-500/30'
                            : 'border-emerald-300/30 hover:shadow-2xl hover:shadow-emerald-500/30'
                        } hover:scale-105`
                  }`}
                >
                  {isAnswerChecked ? 'Answer Checked ✓' : 'Check Answer'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Navigation Bar */}
        <div className="w-full max-w-3xl">
          <div className="liquid-glass-nav rounded-xl shadow-2xl border border-white/10 overflow-hidden">
            {/* Collapsed State */}
            {!isNavExpanded && (
              <div className="flex items-center justify-between px-6 py-4">
                <button
                  onClick={handlePreviousQuestion}
                  disabled={currentQuestionIndex === 0}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all border ${
                    currentQuestionIndex === 0
                      ? 'text-gray-500 cursor-not-allowed border-white/5 liquid-glass-disabled'
                      : 'text-white liquid-glass-nav-button border-white/10 hover:border-white/30 hover:shadow-lg'
                  }`}
                >
                  <ChevronLeft className="h-5 w-5" />
                  Previous
                </button>

                <button
                  onClick={() => setIsNavExpanded(!isNavExpanded)}
                  className="flex items-center gap-2 px-6 py-3 rounded-lg liquid-glass-nav-button border border-white/10 hover:border-white/30 text-white font-semibold transition-all hover:shadow-lg"
                >
                  <List className="h-5 w-5" />
                  <span className="hidden sm:inline">All Questions</span>
                </button>

                <button
                  onClick={handleNextQuestion}
                  disabled={currentQuestionIndex === generatedQuestions.length - 1}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all border ${
                    currentQuestionIndex === generatedQuestions.length - 1
                      ? 'text-gray-500 cursor-not-allowed border-white/5 liquid-glass-disabled'
                      : `text-white ${primaryGlass} ${
                          isMathematics
                            ? 'border-amber-300/30 hover:shadow-2xl hover:shadow-amber-500/30'
                            : 'border-emerald-300/30 hover:shadow-2xl hover:shadow-emerald-500/30'
                        }`
                  }`}
                >
                  Next
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            )}

            {/* Expanded State */}
            {isNavExpanded && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={handlePreviousQuestion}
                    disabled={currentQuestionIndex === 0}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all border ${
                      currentQuestionIndex === 0
                        ? 'text-gray-500 cursor-not-allowed border-white/5 liquid-glass-disabled'
                        : 'text-white liquid-glass-nav-button border-white/10 hover:border-white/30 hover:shadow-lg'
                    }`}
                  >
                    <ChevronLeft className="h-5 w-5" />
                    Previous
                  </button>

                  <button
                    onClick={() => setIsNavExpanded(!isNavExpanded)}
                    className="flex items-center gap-2 px-6 py-3 rounded-lg liquid-glass-nav-button border border-white/10 hover:border-white/30 text-white font-semibold transition-all hover:shadow-lg"
                  >
                    <List className="h-5 w-5" />
                    Hide
                  </button>

                  <button
                    onClick={handleNextQuestion}
                    disabled={currentQuestionIndex === generatedQuestions.length - 1}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all border ${
                      currentQuestionIndex === generatedQuestions.length - 1
                        ? 'text-gray-500 cursor-not-allowed border-white/5 liquid-glass-disabled'
                        : `text-white ${primaryGlass} ${
                            isMathematics
                              ? 'border-amber-300/30 hover:shadow-2xl hover:shadow-amber-500/30'
                              : 'border-emerald-300/30 hover:shadow-2xl hover:shadow-emerald-500/30'
                          }`
                    }`}
                  >
                    Next
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>

                {/* Question Numbers Grid */}
                <div className="flex justify-center items-center mt-4">
                  <div className="grid grid-cols-5 gap-3 w-auto">
                    {generatedQuestions.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => goToQuestion(index)}
                        className={`w-12 h-12 flex items-center justify-center rounded-lg font-bold text-base transition-all border ${
                          index === currentQuestionIndex
                            ? `${primaryGlass} text-white ring-2 ${
                                isMathematics
                                  ? 'ring-amber-400/50 border-amber-300/30 shadow-lg shadow-amber-500/30'
                                  : 'ring-emerald-400/50 border-emerald-300/30 shadow-lg shadow-emerald-500/30'
                              } ring-offset-2 ring-offset-gray-900/50 scale-110`
                            : selectedAnswers[index]
                            ? 'liquid-glass-nav-button text-white hover:shadow-lg border-white/10 hover:border-white/30'
                            : 'liquid-glass-option text-gray-400 hover:text-white hover:shadow-lg border-white/5 hover:border-white/20'
                        }`}
                      >
                        {index + 1}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
