import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';

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
  const [questionTries, setQuestionTries] = useState<Record<number, number>>({});
  const [showNaanoExplanation, setShowNaanoExplanation] = useState(false);
  const [naanoExplanation, setNaanoExplanation] = useState('');
  const [isLoadingExplanation, setIsLoadingExplanation] = useState(false);

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
              userId: profile.id,
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
            // Transform to match expected format, using real DB IDs from question bank
            const transformedQuestions = data.questions.map((q: any, index: number) => ({
              id: q.id || `gen-${sessionId}-${index}`,
              question_text: q.questionText || q.question_text,
              options: q.options,
              correct_answer: q.correctAnswer || q.correct_answer,
              difficulty: (q.difficulty || 'medium') as 'easy' | 'medium' | 'hard',
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
    const currentTries = questionTries[currentQuestionIndex] || 0;
    const attemptNumber = currentTries + 1;

    // Update tries count
    setQuestionTries(prev => ({ ...prev, [currentQuestionIndex]: attemptNumber }));

    if (isCorrect) {
      setScore(prev => prev + 1);
      setIsAnswerChecked(true);
      setShowFeedback(true);

      // Animate feedback out after 2 seconds for correct answer
      setTimeout(() => {
        setShowFeedback(false);
      }, 2000);
    } else {
      // Wrong answer
      if (attemptNumber === 1) {
        // First try - brief feedback, no correct answer shown
        setShowFeedback(true);
        setTimeout(() => {
          setShowFeedback(false);
        }, 2000);
      } else {
        // Second try - persistent feedback with correct answer
        setIsAnswerChecked(true);
        setShowFeedback(true);
        // Don't auto-hide feedback on second wrong try
      }
    }

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
        attempt_number: attemptNumber,
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
            <div className="text-center">
              <h2 className="text-xl font-bold mb-4 text-ghana-green dark:text-ghana-gold">
                NAANO is preparing your questions...
              </h2>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ghana-green dark:border-ghana-gold mx-auto"></div>
            </div>
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
    return (
      <AppLayout>
        <div className="flex flex-col justify-center items-center h-screen gap-4">
          <AlertCircle className="h-12 w-12 text-ghana-gold" />
          <h2 className="text-xl font-bold text-ghana-green dark:text-ghana-gold">
            Failed to load questions
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-center max-w-md">
            NAANO couldn't generate questions right now. Please try again.
          </p>
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            className="mt-2"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Go Back
          </Button>
        </div>
      </AppLayout>
    );
  }

  const currentQuestion = generatedQuestions[currentQuestionIndex];
  const isCorrect = selectedAnswers[currentQuestionIndex] === currentQuestion.correct_answer;

  // Determine theme colors based on subject
  const isMathematics = subject?.toLowerCase() === 'mathematics';
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
                disabled={isAnswerChecked || (questionTries[currentQuestionIndex] || 0) >= 2}
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
              {showFeedback && (
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
                          {(questionTries[currentQuestionIndex] || 0) === 1 ? (
                            <p className="text-sm mt-1 opacity-90">Try again!</p>
                          ) : (
                            <p className="text-sm mt-1 opacity-90">The correct answer is: <span className="font-bold">{currentQuestion.correct_answer}</span></p>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Answer Description Pane - Only shows after second wrong try */}
              {!isCorrect && (questionTries[currentQuestionIndex] || 0) === 2 && showFeedback && (
                <div className="mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="liquid-glass-option border border-white/20 rounded-xl p-6 shadow-xl">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <AlertCircle className="h-5 w-5 text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold mb-2 text-white">Answer Description</h3>
                        <p className="text-gray-300 text-sm leading-relaxed">
                          {currentQuestion.correct_answer} is the correct answer because it represents the most direct and efficient solution to this question. The other options don't fully address the requirements presented in the question.
                        </p>
                      </div>
                    </div>

                    {/* Ask NAANO Button */}
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <Button
                        onClick={async () => {
                          setShowNaanoExplanation(true);
                          setIsLoadingExplanation(true);
                          setNaanoExplanation('');

                          try {
                            const response = await fetch('/api/naano/explain-answer', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                              },
                              body: JSON.stringify({
                                question: currentQuestion.question_text,
                                correctAnswer: currentQuestion.correct_answer,
                                options: currentQuestion.options,
                                subject: subject,
                                grade: profile?.grade_level,
                              }),
                            });

                            if (!response.ok) {
                              throw new Error('Failed to get explanation');
                            }

                            const reader = response.body?.getReader();
                            const decoder = new TextDecoder();
                            let accumulatedText = '';

                            if (reader) {
                              while (true) {
                                const { done, value } = await reader.read();
                                if (done) break;

                                const chunk = decoder.decode(value, { stream: true });
                                const lines = chunk.split('\n');

                                for (const line of lines) {
                                  if (line.startsWith('data: ')) {
                                    const data = line.slice(6);
                                    if (data === '[DONE]') continue;

                                    try {
                                      const parsed = JSON.parse(data);
                                      if (parsed.type === 'error') {
                                        setNaanoExplanation(parsed.message || "Oops! NAANO ran into a small problem. Please try again in a moment!");
                                        return;
                                      }
                                      if (parsed.type === 'content' && parsed.text) {
                                        accumulatedText += parsed.text;
                                        setNaanoExplanation(accumulatedText);
                                      }
                                    } catch (e) {
                                      // Ignore parse errors
                                    }
                                  }
                                }
                              }
                            }
                          } catch (error) {
                            console.error('Error getting explanation:', error);
                            setNaanoExplanation('Sorry, I had trouble explaining this answer. Please try again later.');
                          } finally {
                            setIsLoadingExplanation(false);
                          }
                        }}
                        disabled={isLoadingExplanation}
                        className={`w-full ${primaryGlass} px-6 py-3 rounded-lg border ${
                          isMathematics
                            ? 'border-amber-300/30 hover:shadow-xl hover:shadow-amber-500/30'
                            : 'border-emerald-300/30 hover:shadow-xl hover:shadow-emerald-500/30'
                        } text-white font-semibold transition-all duration-200 hover:scale-[1.02] flex items-center justify-center gap-2`}
                      >
                        <Sparkles className="h-5 w-5" />
                        {isLoadingExplanation ? 'Loading...' : 'Ask NAANO to explain'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Check Answer Button */}
              <div className="mt-8 flex justify-center">
                <Button
                  onClick={handleCheckAnswer}
                  disabled={!selectedAnswers[currentQuestionIndex] || (questionTries[currentQuestionIndex] || 0) >= 2 || (isAnswerChecked && isCorrect)}
                  className={`px-8 py-6 text-lg font-bold rounded-xl shadow-lg transition-all duration-200 border ${
                    (!selectedAnswers[currentQuestionIndex] || (questionTries[currentQuestionIndex] || 0) >= 2 || (isAnswerChecked && isCorrect))
                      ? 'liquid-glass-disabled cursor-not-allowed border-white/10'
                      : `${primaryGlass} ${
                          isMathematics
                            ? 'border-amber-300/30 hover:shadow-2xl hover:shadow-amber-500/30'
                            : 'border-emerald-300/30 hover:shadow-2xl hover:shadow-emerald-500/30'
                        } hover:scale-105`
                  }`}
                >
                  {isAnswerChecked && isCorrect
                    ? 'Correct! ✓'
                    : (questionTries[currentQuestionIndex] || 0) >= 2
                    ? 'No More Tries'
                    : (questionTries[currentQuestionIndex] || 0) === 1 && !isCorrect
                    ? 'Try Again'
                    : 'Check Answer'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* NAANO Explanation Modal */}
        <Dialog open={showNaanoExplanation} onOpenChange={setShowNaanoExplanation}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto liquid-glass border border-white/20">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <Sparkles className={isMathematics ? 'text-amber-400' : 'text-emerald-400'} />
                NAANO's Explanation
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* Question Context */}
              <div className="liquid-glass-option border border-white/10 rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-2">Question:</p>
                <p className="text-white font-medium">{currentQuestion.question_text}</p>
                <p className="text-sm text-emerald-400 mt-3 font-semibold">
                  Correct Answer: {currentQuestion.correct_answer}
                </p>
              </div>

              {/* NAANO's Explanation */}
              <div className="liquid-glass-option border border-white/10 rounded-lg p-6">
                {isLoadingExplanation ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <Loader2 className="h-10 w-10 animate-spin text-blue-400 mb-3" />
                    <p className="text-gray-400">NAANO is thinking...</p>
                  </div>
                ) : naanoExplanation ? (
                  <div className="prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown
                      components={{
                        h1: ({node, ...props}) => <h1 className="text-2xl font-bold mb-4 text-white" {...props} />,
                        h2: ({node, ...props}) => <h2 className="text-xl font-bold mb-3 mt-6 text-white" {...props} />,
                        h3: ({node, ...props}) => <h3 className="text-lg font-semibold mb-2 mt-4 text-white" {...props} />,
                        p: ({node, ...props}) => <p className="text-gray-300 leading-relaxed mb-4" {...props} />,
                        ul: ({node, ...props}) => <ul className="list-disc list-inside mb-4 text-gray-300 space-y-2" {...props} />,
                        ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-4 text-gray-300 space-y-2" {...props} />,
                        li: ({node, ...props}) => <li className="text-gray-300" {...props} />,
                        strong: ({node, ...props}) => <strong className="font-bold text-white" {...props} />,
                        em: ({node, ...props}) => <em className="italic text-gray-200" {...props} />,
                        code: ({node, ...props}) => <code className="bg-gray-800/50 px-2 py-1 rounded text-emerald-400" {...props} />,
                        hr: ({node, ...props}) => <hr className="border-white/10 my-6" {...props} />,
                      }}
                    >
                      {naanoExplanation}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-gray-400 text-center py-4">Click the button below to get an explanation</p>
                )}
              </div>

              {/* Close Button */}
              <div className="flex justify-center">
                <Button
                  onClick={() => setShowNaanoExplanation(false)}
                  className={`${primaryGlass} px-6 py-3 rounded-lg border ${
                    isMathematics
                      ? 'border-amber-300/30 hover:shadow-xl hover:shadow-amber-500/30'
                      : 'border-emerald-300/30 hover:shadow-xl hover:shadow-emerald-500/30'
                  } text-white font-semibold`}
                >
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

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
