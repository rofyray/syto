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
import { Loader2, AlertCircle, ChevronLeft, ChevronRight, List, Trophy, CheckCircle2, XCircle, Sparkles, Star, Award, BarChart3, Home, X } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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
  const [showBreakdown, setShowBreakdown] = useState(false);

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
    const percentage = Math.round((score / generatedQuestions.length) * 100);
    const isMathematics = subject?.toLowerCase() === 'mathematics';
    const primaryGlass = isMathematics ? 'liquid-glass-primary-math' : 'liquid-glass-primary-english';

    // Determine performance message
    let performanceMessage = '';
    let celebrationEmoji = '';
    if (percentage >= 80) {
      performanceMessage = isMathematics ? 'Ayekoo! You are a Math Champion!' : 'Ayekoo! You are an English Master!';
      celebrationEmoji = '🎉';
    } else if (percentage >= 60) {
      performanceMessage = 'Well done! Keep practicing!';
      celebrationEmoji = '👏';
    } else {
      performanceMessage = 'Good effort! Practice makes perfect!';
      celebrationEmoji = '💪';
    }

    return (
      <AppLayout>
        <div className="container mx-auto p-4 flex justify-center items-center min-h-screen relative overflow-hidden">
          {/* Animated background bubbles */}
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className={`absolute rounded-full ${
                  isMathematics ? 'bg-amber-400/20' : 'bg-emerald-400/20'
                } blur-xl animate-float`}
                style={{
                  width: `${Math.random() * 150 + 50}px`,
                  height: `${Math.random() * 150 + 50}px`,
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${i * 0.5}s`,
                  animationDuration: `${Math.random() * 10 + 10}s`,
                }}
              />
            ))}
          </div>

          <div className="w-full max-w-3xl relative z-10">
            {/* Completion Badge */}
            <div className="flex justify-center mb-6 animate-bounce">
              <div className={`${primaryGlass} px-8 py-3 rounded-full border ${
                isMathematics ? 'border-amber-300/30 shadow-xl shadow-amber-500/30' : 'border-emerald-300/30 shadow-xl shadow-emerald-500/30'
              } flex items-center gap-3`}>
                <Award className="h-6 w-6 text-white" />
                <span className="text-white font-bold text-xl">QUIZ COMPLETE {celebrationEmoji}</span>
                <Award className="h-6 w-6 text-white" />
              </div>
            </div>

            {/* Main Score Card */}
            <Card className="liquid-glass shadow-2xl border border-white/20 overflow-hidden">
              <CardContent className="p-12">
                <h2 className="text-5xl font-bold text-center mb-8 love-ya-like-a-sister-regular">
                  You Scored
                </h2>

                {/* Score Circle with decorative bubbles */}
                <div className="flex justify-center mb-8 relative">
                  {/* Decorative bubbles around the circle */}
                  {[...Array(6)].map((_, i) => {
                    const angle = (i * 60 * Math.PI) / 180;
                    const radius = 160;
                    const x = Math.cos(angle) * radius;
                    const y = Math.sin(angle) * radius;
                    return (
                      <div
                        key={i}
                        className={`absolute w-3 h-3 rounded-full ${
                          isMathematics ? 'bg-amber-400' : 'bg-emerald-400'
                        } animate-pulse`}
                        style={{
                          left: '50%',
                          top: '50%',
                          transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                          animationDelay: `${i * 0.2}s`,
                        }}
                      />
                    );
                  })}

                  {/* Score Circle */}
                  <div className={`relative w-64 h-64 rounded-full border-8 ${
                    isMathematics
                      ? 'border-amber-400/50 shadow-2xl shadow-amber-500/40'
                      : 'border-emerald-400/50 shadow-2xl shadow-emerald-500/40'
                  } liquid-glass flex flex-col items-center justify-center`}>
                    <div className="text-center">
                      <div className={`text-7xl font-bold ${
                        isMathematics ? 'text-amber-400' : 'text-emerald-400'
                      } mb-2 love-ya-like-a-sister-regular animate-scale-in`}>
                        {percentage}%
                      </div>
                      <div className="text-gray-400 text-lg font-semibold">
                        YOUR SCORE
                      </div>
                      <div className="text-white/60 text-sm mt-2">
                        {score} out of {generatedQuestions.length}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Performance Message */}
                <div className="text-center mb-8">
                  <p className="text-2xl font-bold mb-2">{performanceMessage}</p>
                  <p className="text-gray-400">
                    {topicName && exerciseName && (
                      <>Topic: {topicName} • Exercise: {exerciseName}</>
                    )}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 justify-center flex-wrap">
                  <Button
                    onClick={() => setShowBreakdown(true)}
                    className={`${primaryGlass} px-8 py-6 text-lg font-bold rounded-xl shadow-lg transition-all duration-200 border ${
                      isMathematics
                        ? 'border-amber-300/30 hover:shadow-2xl hover:shadow-amber-500/30'
                        : 'border-emerald-300/30 hover:shadow-2xl hover:shadow-emerald-500/30'
                    } hover:scale-105 flex items-center gap-2`}
                  >
                    <BarChart3 className="h-5 w-5" />
                    See Breakdown
                  </Button>

                  <Button
                    onClick={() => navigate(`/${subject?.toLowerCase()}`)}
                    className="liquid-glass-nav-button px-8 py-6 text-lg font-bold rounded-xl shadow-lg transition-all duration-200 border border-white/10 hover:border-white/30 hover:shadow-2xl text-white flex items-center gap-2"
                  >
                    <Home className="h-5 w-5" />
                    Back to {subject}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Stars decoration */}
            <div className="flex justify-center gap-4 mt-6">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-8 w-8 ${
                    i < Math.ceil((percentage / 100) * 5)
                      ? isMathematics
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-emerald-400 fill-emerald-400'
                      : 'text-gray-600'
                  } animate-pulse`}
                  style={{ animationDelay: `${i * 0.1}s` }}
                />
              ))}
            </div>
          </div>

          {/* Breakdown Modal */}
          <Dialog open={showBreakdown} onOpenChange={setShowBreakdown}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto liquid-glass border border-white/20">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                  <BarChart3 className={isMathematics ? 'text-amber-400' : 'text-emerald-400'} />
                  Quiz Breakdown
                </DialogTitle>
              </DialogHeader>

              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="liquid-glass-option p-4 rounded-lg border border-white/10 text-center">
                  <div className="text-3xl font-bold text-emerald-400">{score}</div>
                  <div className="text-sm text-gray-400 mt-1">Correct</div>
                </div>
                <div className="liquid-glass-option p-4 rounded-lg border border-white/10 text-center">
                  <div className="text-3xl font-bold text-red-400">{generatedQuestions.length - score}</div>
                  <div className="text-sm text-gray-400 mt-1">Incorrect</div>
                </div>
                <div className="liquid-glass-option p-4 rounded-lg border border-white/10 text-center">
                  <div className={`text-3xl font-bold ${isMathematics ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {percentage}%
                  </div>
                  <div className="text-sm text-gray-400 mt-1">Score</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="h-6 rounded-full overflow-hidden liquid-glass-option border border-white/10">
                  <div
                    className={`h-full transition-all duration-1000 ${
                      isMathematics
                        ? 'bg-gradient-to-r from-amber-500 to-amber-600'
                        : 'bg-gradient-to-r from-emerald-500 to-emerald-600'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>

              {/* Question by Question Breakdown */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold mb-3">Question by Question Review</h3>
                {generatedQuestions.map((question, index) => {
                  const userAnswer = selectedAnswers[index];
                  const isCorrect = userAnswer === question.correct_answer;

                  return (
                    <div
                      key={index}
                      className={`liquid-glass-option p-4 rounded-lg border transition-all ${
                        isCorrect
                          ? 'border-emerald-400/50'
                          : 'border-red-400/50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                          isCorrect ? 'bg-emerald-500' : 'bg-red-500'
                        }`}>
                          {isCorrect ? (
                            <CheckCircle2 className="h-5 w-5 text-white" />
                          ) : (
                            <XCircle className="h-5 w-5 text-white" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold mb-2">
                            Question {index + 1}: {question.question_text}
                          </div>
                          <div className="text-sm space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-400">Your answer:</span>
                              <span className={isCorrect ? 'text-emerald-400 font-semibold' : 'text-red-400 font-semibold'}>
                                {userAnswer || 'Not answered'}
                              </span>
                            </div>
                            {!isCorrect && (
                              <div className="flex items-center gap-2">
                                <span className="text-gray-400">Correct answer:</span>
                                <span className="text-emerald-400 font-semibold">
                                  {question.correct_answer}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Close Button */}
              <div className="flex justify-center mt-6">
                <Button
                  onClick={() => setShowBreakdown(false)}
                  className={`${primaryGlass} px-6 py-3 rounded-lg border ${
                    isMathematics
                      ? 'border-amber-300/30 hover:shadow-xl hover:shadow-amber-500/30'
                      : 'border-emerald-300/30 hover:shadow-xl hover:shadow-emerald-500/30'
                  } text-white font-semibold`}
                >
                  Close Breakdown
                </Button>
              </div>
            </DialogContent>
          </Dialog>
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
                  disabled={currentQuestionIndex === generatedQuestions.length - 1 && !isAnswerChecked}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all border ${
                    currentQuestionIndex === generatedQuestions.length - 1 && !isAnswerChecked
                      ? 'text-gray-500 cursor-not-allowed border-white/5 liquid-glass-disabled'
                      : `text-white ${primaryGlass} ${
                          isMathematics
                            ? 'border-amber-300/30 hover:shadow-2xl hover:shadow-amber-500/30'
                            : 'border-emerald-300/30 hover:shadow-2xl hover:shadow-emerald-500/30'
                        }`
                  }`}
                >
                  {currentQuestionIndex === generatedQuestions.length - 1 ? 'Finish Quiz' : 'Next'}
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
                    disabled={currentQuestionIndex === generatedQuestions.length - 1 && !isAnswerChecked}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all border ${
                      currentQuestionIndex === generatedQuestions.length - 1 && !isAnswerChecked
                        ? 'text-gray-500 cursor-not-allowed border-white/5 liquid-glass-disabled'
                        : `text-white ${primaryGlass} ${
                            isMathematics
                              ? 'border-amber-300/30 hover:shadow-2xl hover:shadow-amber-500/30'
                              : 'border-emerald-300/30 hover:shadow-2xl hover:shadow-emerald-500/30'
                          }`
                    }`}
                  >
                    {currentQuestionIndex === generatedQuestions.length - 1 ? 'Finish Quiz' : 'Next'}
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
