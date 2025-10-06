import { useEffect, useState } from "react";
import { PartyPopper } from "lucide-react";

interface ScoreDisplayProps {
  score: number;
  totalQuestions: number;
  onContinue?: () => void;
}

export function ScoreDisplay({ score, totalQuestions, onContinue }: ScoreDisplayProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const percentage = Math.round((score / totalQuestions) * 100);

  // Animate score counting up
  useEffect(() => {
    let start = 0;
    const end = percentage;
    const duration = 2000;
    const increment = end / (duration / 16);

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setAnimatedScore(end);
        clearInterval(timer);
      } else {
        setAnimatedScore(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [percentage]);

  // Determine gradient colors based on score
  const getGradientColors = () => {
    if (percentage >= 80) {
      return {
        from: '#10b981', // green-500
        via: '#3b82f6',  // blue-500
        to: '#8b5cf6',   // purple-500
        text: 'text-success-600 dark:text-success-400'
      };
    } else if (percentage >= 60) {
      return {
        from: '#f59e0b', // amber-500
        via: '#3b82f6',  // blue-500
        to: '#8b5cf6',   // purple-500
        text: 'text-warning-600 dark:text-warning-400'
      };
    } else {
      return {
        from: '#ef4444', // red-500
        via: '#f59e0b',  // amber-500
        to: '#3b82f6',   // blue-500
        text: 'text-error-600 dark:text-error-400'
      };
    }
  };

  const colors = getGradientColors();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 animate-scale-in">
      {/* Exam Complete Badge */}
      <div className="mb-8 px-6 py-3 rounded-full bg-gradient-to-r from-success-400 to-success-600 text-white shadow-lg flex items-center gap-2 animate-slide-up">
        <PartyPopper className="h-5 w-5" />
        <span className="font-semibold text-lg">EXAM COMPLETE</span>
        <PartyPopper className="h-5 w-5" />
      </div>

      {/* Title */}
      <h1 className="text-5xl md:text-6xl font-bold text-center mb-12 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        You Scored
      </h1>

      {/* Circular Score Display */}
      <div className="relative mb-8 animate-scale-in" style={{ animationDelay: '0.2s' }}>
        {/* Outer glow effect */}
        <div className="absolute inset-0 rounded-full blur-2xl opacity-40"
          style={{
            background: `linear-gradient(135deg, ${colors.from}, ${colors.via}, ${colors.to})`
          }}
        />

        {/* Main circle */}
        <div className="relative w-72 h-72 md:w-80 md:h-80 rounded-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-8 flex items-center justify-center shadow-2xl"
          style={{
            borderImage: `linear-gradient(135deg, ${colors.from}, ${colors.via}, ${colors.to}) 1`,
            borderRadius: '50%'
          }}
        >
          {/* Inner content */}
          <div className="text-center">
            {/* Animated percentage with dots */}
            <div className="relative">
              <span className={`text-7xl md:text-8xl font-bold ${colors.text} tracking-tight`}>
                {animatedScore}
                <span className="inline-flex">
                  <span className="animate-pulse" style={{ animationDelay: '0s' }}>.</span>
                  <span className="animate-pulse" style={{ animationDelay: '0.2s' }}>.</span>
                  <span className="animate-pulse" style={{ animationDelay: '0.4s' }}>.</span>
                </span>
                %
              </span>
            </div>
            <p className="text-lg font-medium text-muted-foreground mt-4">YOUR SCORE</p>

            {/* Decorative dots */}
            <div className="absolute -top-4 -left-4 w-3 h-3 rounded-full bg-gradient-to-br from-success-400 to-success-600 animate-pulse" />
            <div className="absolute -bottom-4 -right-4 w-3 h-3 rounded-full bg-gradient-to-br from-success-400 to-success-600 animate-pulse" style={{ animationDelay: '0.5s' }} />
            <div className="absolute top-1/2 -right-6 w-2 h-2 rounded-full bg-gradient-to-br from-success-400 to-success-600 animate-pulse" style={{ animationDelay: '1s' }} />
            <div className="absolute top-1/4 -left-6 w-2 h-2 rounded-full bg-gradient-to-br from-success-400 to-success-600 animate-pulse" style={{ animationDelay: '1.5s' }} />
          </div>
        </div>
      </div>

      {/* Score Details */}
      <p className="text-xl text-muted-foreground animate-slide-up" style={{ animationDelay: '0.3s' }}>
        You got <span className="font-bold text-ghana-green dark:text-ghana-green-light">{score}</span> out of <span className="font-bold">{totalQuestions}</span> questions correct
      </p>

      {/* Continue Button */}
      {onContinue && (
        <button
          onClick={onContinue}
          className="mt-12 px-8 py-4 bg-gradient-to-r from-ghana-green to-ghana-green-light hover:from-ghana-green-dark hover:to-ghana-green text-white rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 animate-slide-up"
          style={{ animationDelay: '0.4s' }}
        >
          View Detailed Results
        </button>
      )}
    </div>
  );
}
