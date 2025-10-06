interface QuestionNumberGridProps {
  totalQuestions: number;
  currentQuestion: number;
  answeredQuestions: number[];
  onSelectQuestion: (questionNumber: number) => void;
}

export function QuestionNumberGrid({
  totalQuestions,
  currentQuestion,
  answeredQuestions,
  onSelectQuestion,
}: QuestionNumberGridProps) {
  return (
    <div className="w-full bg-gray-900/95 dark:bg-gray-950/95 backdrop-blur-sm border-b border-gray-800 dark:border-gray-900 py-4">
      <div className="container mx-auto px-4">
        {/* Grid of question numbers */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
          {Array.from({ length: totalQuestions }, (_, i) => i + 1).map((num) => {
            const isCurrent = num === currentQuestion;
            const isAnswered = answeredQuestions.includes(num);

            return (
              <button
                key={num}
                onClick={() => onSelectQuestion(num)}
                className={`
                  min-w-[40px] h-10 rounded-lg font-semibold transition-all duration-200
                  ${isCurrent
                    ? 'bg-ghana-green text-white shadow-lg scale-110'
                    : isAnswered
                    ? 'bg-gray-700 text-white hover:bg-gray-600'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }
                `}
              >
                {num}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
