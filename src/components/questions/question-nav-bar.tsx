import { ArrowLeft, ArrowRight, List, Send } from "lucide-react";

interface QuestionNavBarProps {
  currentQuestion: number;
  totalQuestions: number;
  onPrevious?: () => void;
  onNext?: () => void;
  onShowList?: () => void;
  onSubmit?: () => void;
  canGoBack?: boolean;
  canGoNext?: boolean;
  isLastQuestion?: boolean;
}

export function QuestionNavBar({
  currentQuestion,
  totalQuestions,
  onPrevious,
  onNext,
  onShowList,
  onSubmit,
  canGoBack = true,
  canGoNext = true,
  isLastQuestion = false,
}: QuestionNavBarProps) {
  return (
    <div className="w-full bg-gray-900/95 dark:bg-gray-950/95 backdrop-blur-sm border-b border-gray-800 dark:border-gray-900">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Back Button */}
          <button
            onClick={onPrevious}
            disabled={!canGoBack || currentQuestion === 1}
            className="flex items-center gap-2 px-4 py-2 text-white hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="hidden sm:inline">Back</span>
          </button>

          {/* Center - Question List Toggle */}
          <button
            onClick={onShowList}
            className="flex items-center gap-2 px-4 py-2 text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <List className="h-5 w-5" />
            <span className="hidden sm:inline">Toggle Navigation</span>
          </button>

          {/* Next/Submit Button */}
          {isLastQuestion ? (
            <button
              onClick={onSubmit}
              className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-ghana-green to-ghana-green-light hover:from-ghana-green-dark hover:to-ghana-green text-white rounded-lg transition-all shadow-lg hover:shadow-xl"
            >
              <Send className="h-5 w-5" />
              <span>Submit</span>
            </button>
          ) : (
            <button
              onClick={onNext}
              disabled={!canGoNext}
              className="flex items-center gap-2 px-4 py-2 text-white hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="hidden sm:inline">Next</span>
              <ArrowRight className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
