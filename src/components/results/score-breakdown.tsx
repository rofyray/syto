import { ChevronDown } from "lucide-react";
import { useState } from "react";

interface CategoryScore {
  name: string;
  score: number;
  total: number;
}

interface ScoreBreakdownProps {
  overallScore: number;
  categories: CategoryScore[];
  onShowDetails?: () => void;
}

export function ScoreBreakdown({ overallScore, categories, onShowDetails }: ScoreBreakdownProps) {
  const [selectedFilter, setSelectedFilter] = useState<string>("Show all");

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'from-success-400 to-success-600';
    if (percentage >= 60) return 'from-warning-400 to-warning-600';
    return 'from-error-400 to-error-600';
  };

  const getBarColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-gradient-to-r from-success-500 to-success-600';
    if (percentage >= 60) return 'bg-gradient-to-r from-warning-500 to-warning-600';
    return 'bg-gradient-to-r from-error-500 to-error-600';
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 animate-slide-up">
      {/* Overall Score Card */}
      <div className="mb-8 bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/20 dark:border-white/10 shadow-glass-xl">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-3xl font-bold mb-2">Your Score:</h2>
          <div className="flex items-baseline gap-2">
            <span className={`text-6xl font-bold bg-gradient-to-r ${getScoreColor(overallScore)} bg-clip-text text-transparent`}>
              {overallScore}%
            </span>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="space-y-4">
          {categories.map((category, index) => {
            const percentage = Math.round((category.score / category.total) * 100);

            return (
              <div
                key={category.name}
                className="animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{category.name}:</span>
                  <span className="font-bold">{percentage}%</span>
                </div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getBarColor(percentage)} transition-all duration-1000 ease-out rounded-full`}
                    style={{
                      width: `${percentage}%`,
                      animationDelay: `${index * 0.1}s`
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Overall Progress Bar */}
        <div className="mt-8 pt-6 border-t border-white/20 dark:border-white/10">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden relative">
            <div
              className="absolute inset-0 flex"
              style={{ width: '100%' }}
            >
              <div
                className="h-full bg-gradient-to-r from-success-500 to-success-400 transition-all duration-1000"
                style={{ width: `${overallScore}%` }}
              />
              <div
                className="h-full bg-gradient-to-r from-error-400 to-error-500 transition-all duration-1000"
                style={{ width: `${100 - overallScore}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="mb-6 bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/20 dark:border-white/10 shadow-glass">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Filters</h3>
          <div className="relative">
            <button
              onClick={() => {/* Toggle dropdown */}}
              className="flex items-center gap-2 px-4 py-2 bg-white/50 dark:bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 dark:border-white/10 hover:bg-white/70 dark:hover:bg-white/20 transition-all"
            >
              <span className="font-medium">{selectedFilter}</span>
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* View Details Message */}
      <div className="text-center mt-8">
        <p className="text-muted-foreground mb-4">Scroll down to see your responses and detailed results</p>
        {onShowDetails && (
          <button
            onClick={onShowDetails}
            className="text-ghana-green dark:text-ghana-green-light hover:text-ghana-gold dark:hover:text-ghana-gold font-medium transition-colors"
          >
            Jump to Detailed Results →
          </button>
        )}
      </div>
    </div>
  );
}
