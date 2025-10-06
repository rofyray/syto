import { Clock } from "lucide-react";
import { useState } from "react";

interface QuestionCardProps {
  questionNumber: number;
  totalQuestions: number;
  questionText: string;
  options: string[];
  selectedAnswer?: string;
  onSelectAnswer: (answer: string) => void;
  timeRemaining?: string;
  darkMode?: boolean;
}

export function QuestionCard({
  questionNumber,
  totalQuestions,
  questionText,
  options,
  selectedAnswer,
  onSelectAnswer,
  timeRemaining,
  darkMode = true,
}: QuestionCardProps) {
  return (
    <div className="w-full max-w-5xl mx-auto p-6">
      {/* Header with Question Count and Time */}
      <div className={`
        ${darkMode ? 'bg-gray-900/95 dark:bg-gray-950/95' : 'bg-white/80 dark:bg-white/10'}
        backdrop-blur-xl rounded-2xl p-4 mb-6 border
        ${darkMode ? 'border-gray-800 dark:border-gray-900' : 'border-white/20 dark:border-white/10'}
        shadow-glass
      `}>
        <div className="flex items-center justify-between">
          <span className={`text-lg font-medium ${darkMode ? 'text-white' : ''}`}>
            Question {questionNumber} / {totalQuestions}
          </span>
          {timeRemaining && (
            <div className="flex items-center gap-2">
              <Clock className={`h-5 w-5 ${darkMode ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`} />
              <span className={`font-medium ${darkMode ? 'text-white' : ''}`}>{timeRemaining}</span>
            </div>
          )}
        </div>
      </div>

      {/* Question Text */}
      <div className={`
        ${darkMode ? 'bg-gray-800/90 dark:bg-gray-900/90' : 'bg-white/80 dark:bg-white/10'}
        backdrop-blur-xl rounded-3xl p-8 mb-6 border
        ${darkMode ? 'border-gray-700 dark:border-gray-800' : 'border-white/20 dark:border-white/10'}
        shadow-glass-lg
      `}>
        <p className={`text-xl leading-relaxed ${darkMode ? 'text-white' : 'text-foreground'}`}>
          {questionText}
        </p>
      </div>

      {/* Answer Options */}
      <div className="space-y-4">
        {options.map((option, index) => {
          const isSelected = selectedAnswer === option;

          return (
            <button
              key={index}
              onClick={() => onSelectAnswer(option)}
              className={`
                w-full text-left p-5 rounded-2xl border-2 transition-all duration-200
                ${darkMode
                  ? isSelected
                    ? 'bg-ghana-green/20 border-ghana-green text-white shadow-lg shadow-ghana-green/20'
                    : 'bg-gray-800/60 dark:bg-gray-900/60 border-gray-700 dark:border-gray-800 text-white hover:bg-gray-700/60 dark:hover:bg-gray-800/60 hover:border-gray-600 dark:hover:border-gray-700'
                  : isSelected
                    ? 'bg-primary-100/60 dark:bg-primary-900/30 border-primary-500 shadow-lg'
                    : 'bg-white/60 dark:bg-white/5 border-white/20 dark:border-white/10 hover:bg-white/80 dark:hover:bg-white/10 hover:border-primary-300 dark:hover:border-primary-700'
                }
                backdrop-blur-sm
              `}
            >
              <div className="flex items-center gap-4">
                {/* Radio Button */}
                <div className={`
                  w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0
                  ${darkMode
                    ? isSelected
                      ? 'border-ghana-green'
                      : 'border-gray-600 dark:border-gray-700'
                    : isSelected
                      ? 'border-primary-500'
                      : 'border-gray-300 dark:border-gray-600'
                  }
                `}>
                  {isSelected && (
                    <div className={`
                      w-3 h-3 rounded-full
                      ${darkMode ? 'bg-ghana-green' : 'bg-primary-500'}
                    `} />
                  )}
                </div>

                {/* Option Text */}
                <span className="text-base font-medium flex-1">
                  {option}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Navigation Buttons */}
      <div className="mt-8 flex justify-between gap-4">
        <button className={`
          px-8 py-3 rounded-xl font-semibold transition-all
          ${darkMode
            ? 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-700'
            : 'bg-white/60 dark:bg-white/10 hover:bg-white/80 dark:hover:bg-white/20 border border-white/20 dark:border-white/10'
          }
          backdrop-blur-sm shadow-lg hover:shadow-xl
        `}>
          Previous
        </button>

        <button className={`
          px-8 py-3 rounded-xl font-semibold text-white transition-all shadow-lg hover:shadow-xl
          ${darkMode
            ? 'bg-gradient-to-r from-ghana-green to-ghana-green-light hover:from-ghana-green-dark hover:to-ghana-green'
            : 'bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700'
          }
        `}>
          Next
        </button>
      </div>
    </div>
  );
}
