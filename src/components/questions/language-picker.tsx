import { useState } from 'react';
import { Languages, Loader2 } from 'lucide-react';
import { GHANAIAN_LANGUAGES, useLanguageStore } from '@/stores/language-store';
import { Button } from '@/components/ui/button';

interface LanguagePickerProps {
  onSelect: (langCode: string | null) => void;
  isTranslating?: boolean;
  /** Render inline (no fixed overlay) for embedding in wizard or other containers */
  inline?: boolean;
}

export function LanguagePicker({ onSelect, isTranslating = false, inline = false }: LanguagePickerProps) {
  const { preferredLanguage } = useLanguageStore();
  const [selected, setSelected] = useState<string | null>(preferredLanguage);

  const handleStart = () => {
    onSelect(selected);
  };

  const content = (
    <div className={inline ? 'w-full' : 'w-full max-w-md liquid-glass rounded-2xl border border-white/20 shadow-2xl p-6'}>
      <div className="flex items-center justify-center gap-2 mb-4">
        <Languages className="h-6 w-6 text-ghana-gold" />
        <h2 className={`font-bold ${inline ? 'text-lg' : 'text-xl text-white'}`}>
          Choose Your Language
        </h2>
      </div>
      <p className={`text-sm text-center mb-6 ${inline ? 'text-muted-foreground' : 'text-gray-300'}`}>
        Select your language for the quiz
      </p>

      <div className="grid grid-cols-2 gap-2 mb-6">
        {/* English option */}
        <button
          onClick={() => setSelected(null)}
          disabled={isTranslating}
          className={`p-3 rounded-xl text-sm font-medium transition-all border ${
            selected === null
              ? 'bg-ghana-green/30 border-ghana-green text-white shadow-lg shadow-ghana-green/20'
              : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:border-white/20'
          } disabled:opacity-50`}
        >
          English
          {selected === null && <span className="ml-1 text-xs opacity-70">(Default)</span>}
        </button>

        {/* Ghanaian languages */}
        {GHANAIAN_LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            onClick={() => setSelected(lang.code)}
            disabled={isTranslating}
            className={`p-3 rounded-xl text-sm font-medium transition-all border ${
              selected === lang.code
                ? 'bg-ghana-gold/30 border-ghana-gold text-white shadow-lg shadow-ghana-gold/20'
                : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:border-white/20'
            } disabled:opacity-50`}
          >
            {lang.name}
          </button>
        ))}
      </div>

      <Button
        onClick={handleStart}
        disabled={isTranslating}
        className="w-full bg-ghana-green hover:bg-ghana-green/80 text-white font-semibold py-3 rounded-xl"
      >
        {isTranslating ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Translating...
          </>
        ) : (
          'Start Quiz'
        )}
      </Button>
    </div>
  );

  if (inline) {
    return content;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      {content}
    </div>
  );
}
