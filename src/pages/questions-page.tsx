import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { useAuthStore } from '@/stores/auth-store';
// Local type for AI-generated questions, as it includes the correct answer.
interface AIQuestion {
  question_text: string;
  options: string[];
  correct_answer: string;
}
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { AppLayout } from '@/components/layout/app-layout';
import { Loader2 } from 'lucide-react';

export function QuestionsPage() {
  const [searchParams] = useSearchParams();
  const topicName = searchParams.get('topic_name');
  const exerciseName = searchParams.get('exercise_name');
  const subject = searchParams.get('subject');
  const { profile } = useAuthStore();

  const [generatedQuestions, setGeneratedQuestions] = useState<AIQuestion[]>([]);
  const [score, setScore] = useState(0);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (topicName && exerciseName && subject && profile) {
      const fetchQuestions = async () => {
        try {
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

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();

          if (data.success && data.questions) {
            // Transform to match expected format
            const transformedQuestions = data.questions.map((q: any) => ({
              question_text: q.questionText || q.question_text,
              options: q.options,
              correct_answer: q.correctAnswer || q.correct_answer,
            }));
            setGeneratedQuestions(transformedQuestions);
          } else {
            console.error('Invalid response format:', data);
          }
        } catch (error) {
          console.error('Error fetching questions:', error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchQuestions();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicName, exerciseName, subject, profile]);

  const handleAnswerSelect = (questionIndex: number, answer: string) => {
    setSelectedAnswers(prev => ({ ...prev, [questionIndex]: answer }));
  };

  const handleCheckAnswer = () => {
    const selectedAnswer = selectedAnswers[currentQuestionIndex];
    const correctAnswer = generatedQuestions[currentQuestionIndex].correct_answer;
    if (selectedAnswer === correctAnswer) {
      setScore(prev => prev + 1);
    }
    setIsAnswerChecked(true);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < generatedQuestions.length - 1) {
      setCurrentQuestionIndex(prevIndex => prevIndex + 1);
      setIsAnswerChecked(false); // Reset for the next question
    } else {
      setQuizFinished(true); // End of the quiz
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-screen">
          <Loader2 className="h-12 w-12 animate-spin" />
          <p className="ml-4 text-lg">NAANO is preparing your questions...</p>
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

  return (
    <AppLayout>
      <div className="container mx-auto p-4 flex justify-center items-center min-h-screen">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle>Question {currentQuestionIndex + 1} of {generatedQuestions.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg mb-6">{currentQuestion.question_text}</p>

            <RadioGroup 
              value={selectedAnswers[currentQuestionIndex] || ''}
              onValueChange={(value: string) => handleAnswerSelect(currentQuestionIndex, value)}
              disabled={isAnswerChecked}
            >
              {currentQuestion.options?.map((option, index) => (
                <div key={index} className="flex items-center space-x-2 mb-2 p-2 rounded-md border border-input">
                  <RadioGroupItem value={option} id={`q${currentQuestionIndex}-option-${index}`} />
                  <Label htmlFor={`q${currentQuestionIndex}-option-${index}`} className="flex-1 cursor-pointer">{option}</Label>
                </div>
              ))}
            </RadioGroup>

            {isAnswerChecked && (
              <div className="mt-4 font-bold text-center">
                {selectedAnswers[currentQuestionIndex] === currentQuestion.correct_answer ? (
                  <p className="text-green-600">Correct!</p>
                ) : (
                  <p className="text-red-600">Incorrect. The correct answer is: {currentQuestion.correct_answer}</p>
                )}
              </div>
            )}

            <div className="mt-6 flex justify-between items-center">
              <p className="font-bold">Score: {score}</p>
              {!isAnswerChecked ? (
                <Button onClick={handleCheckAnswer} disabled={!selectedAnswers[currentQuestionIndex]}>
                  Check Answer
                </Button>
              ) : (
                <Button onClick={handleNextQuestion}>
                  {currentQuestionIndex < generatedQuestions.length - 1 ? 'Next Question' : 'Finish Quiz'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
