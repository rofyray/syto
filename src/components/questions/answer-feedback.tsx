import { CheckCircle, XCircle, Sparkles } from "lucide-react";
import { useState } from "react";

interface AnswerFeedbackProps {
  isCorrect: boolean;
  correctAnswer: string;
  userAnswer: string;
  explanation: string;
  onNext?: () => void;
}

export function AnswerFeedback({
  isCorrect,
  correctAnswer,
  userAnswer,
  explanation,
  onNext,
}: AnswerFeedbackProps) {
  const [showNAANOHelper, setShowNAANOHelper] = useState(false);

  return (
    <div className="w-full max-w-5xl mx-auto p-6 space-y-6 animate-slide-up">
      {/* Result Badge */}
      <div className={`
        flex items-center gap-3 px-6 py-4 rounded-2xl backdrop-blur-xl border
        ${isCorrect
          ? 'bg-success-100/80 dark:bg-success-900/30 border-success-300 dark:border-success-700'
          : 'bg-error-100/80 dark:bg-error-900/30 border-error-300 dark:border-error-700'
        }
      `}>
        {isCorrect ? (
          <>
            <CheckCircle className="h-6 w-6 text-success-600 dark:text-success-400" />
            <div>
              <p className="font-bold text-success-800 dark:text-success-300 text-lg">Correct!</p>
              <p className="text-sm text-success-700 dark:text-success-400">Well done! You got it right.</p>
            </div>
          </>
        ) : (
          <>
            <XCircle className="h-6 w-6 text-error-600 dark:text-error-400" />
            <div className="flex-1">
              <p className="font-bold text-error-800 dark:text-error-300 text-lg">Incorrect</p>
              <p className="text-sm text-error-700 dark:text-error-400">
                Your answer: <span className="font-semibold">{userAnswer}</span>
              </p>
              <p className="text-sm text-error-700 dark:text-error-400">
                Correct answer: <span className="font-semibold text-success-600 dark:text-success-400">{correctAnswer}</span>
              </p>
            </div>
          </>
        )}
      </div>

      {/* Answer Description */}
      <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/20 dark:border-white/10 shadow-glass-lg">
        <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
          <span className="text-ghana-gold">💡</span>
          Answer Description
        </h3>
        <p className="text-base leading-relaxed text-foreground/90 dark:text-foreground/80">
          {explanation}
        </p>
      </div>

      {/* NAANO Helper Toggle */}
      <button
        onClick={() => setShowNAANOHelper(!showNAANOHelper)}
        className="w-full bg-gradient-to-r from-ghana-green/10 to-ghana-gold/10 dark:from-ghana-green-dark/20 dark:to-ghana-gold-dark/20 backdrop-blur-xl rounded-2xl p-4 border border-ghana-green/30 dark:border-ghana-green-dark/30 hover:border-ghana-gold/50 dark:hover:border-ghana-gold-dark/50 transition-all shadow-glass hover:shadow-glass-lg"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-ghana-green to-ghana-gold rounded-xl">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div className="text-left">
              <p className="font-bold text-foreground">Need more help?</p>
              <p className="text-sm text-muted-foreground">Ask NAANO for clarification</p>
            </div>
          </div>
          <span className={`text-sm font-medium text-ghana-green dark:text-ghana-green-light transition-transform ${showNAANOHelper ? 'rotate-180' : ''}`}>
            {showNAANOHelper ? '▲' : '▼'}
          </span>
        </div>
      </button>

      {/* NAANO Helper Panel */}
      {showNAANOHelper && (
        <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/20 dark:border-white/10 shadow-glass-xl animate-slide-up">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-ghana-green to-ghana-gold flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h4 className="font-bold text-lg">NAANO AI Assistant</h4>
              <p className="text-sm text-muted-foreground">Your friendly learning companion</p>
            </div>
          </div>

          {/* Chat Input */}
          <div className="space-y-3">
            <textarea
              className="w-full h-24 px-4 py-3 rounded-xl border border-white/20 dark:border-white/10 bg-white/50 dark:bg-white/5 backdrop-blur-sm resize-none focus:outline-none focus:ring-2 focus:ring-ghana-green dark:focus:ring-ghana-green-light focus:border-transparent transition-all"
              placeholder="Ask NAANO to explain this concept in a different way..."
            />
            <button className="w-full px-6 py-3 bg-gradient-to-r from-ghana-green to-ghana-gold hover:from-ghana-green-dark hover:to-ghana-gold-dark text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all">
              Ask NAANO
            </button>
          </div>

          {/* Quick Questions */}
          <div className="mt-4 pt-4 border-t border-white/10">
            <p className="text-sm font-medium mb-2 text-muted-foreground">Quick questions:</p>
            <div className="space-y-2">
              {[
                "Can you explain this in simpler terms?",
                "What is a real-world example?",
                "Why is this the correct answer?"
              ].map((question, index) => (
                <button
                  key={index}
                  className="w-full text-left px-3 py-2 text-sm rounded-lg bg-white/40 dark:bg-white/5 hover:bg-white/60 dark:hover:bg-white/10 border border-white/20 dark:border-white/10 transition-all"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Next Button */}
      {onNext && (
        <button
          onClick={onNext}
          className="w-full px-8 py-4 bg-gradient-to-r from-ghana-green to-ghana-green-light hover:from-ghana-green-dark hover:to-ghana-green text-white rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all"
        >
          Continue to Next Question
        </button>
      )}
    </div>
  );
}
