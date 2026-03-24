import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface GhanaianLanguage {
  code: string;   // Translation API code (e.g. "tw")
  ttsCode: string; // TTS API code (e.g. "twi")
  name: string;    // Display name (e.g. "Twi")
}

export const GHANAIAN_LANGUAGES: GhanaianLanguage[] = [
  { code: 'tw', ttsCode: 'twi', name: 'Twi' },
  { code: 'ee', ttsCode: 'ewe', name: 'Ewe' },
  { code: 'gaa', ttsCode: 'gaa', name: 'Ga' },
  { code: 'fat', ttsCode: 'fat', name: 'Fante' },
  { code: 'dag', ttsCode: 'dag', name: 'Dagbani' },
  { code: 'gur', ttsCode: 'gur', name: 'Gurune' },
  { code: 'kus', ttsCode: 'kus', name: 'Kusaal' },
];

export function getLanguageByCode(code: string): GhanaianLanguage | undefined {
  return GHANAIAN_LANGUAGES.find(l => l.code === code);
}

interface LanguageContext {
  subject: string;
  moduleId: string;
}

interface LanguageState {
  preferredLanguage: string | null; // null = English (no translation)
  lastLanguageContext: LanguageContext | null; // subject+module the preference was set for
  setPreferredLanguage: (lang: string | null, context: LanguageContext) => void;
  matchesContext: (subject: string, moduleId: string) => boolean;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set, get) => ({
      preferredLanguage: null,
      lastLanguageContext: null,
      setPreferredLanguage: (lang, context) => set({
        preferredLanguage: lang,
        lastLanguageContext: context,
      }),
      matchesContext: (subject, moduleId) => {
        const ctx = get().lastLanguageContext;
        return ctx !== null && ctx.subject === subject && ctx.moduleId === moduleId;
      },
    }),
    {
      name: 'syto-language',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        preferredLanguage: state.preferredLanguage,
        lastLanguageContext: state.lastLanguageContext,
      }),
    }
  )
);
