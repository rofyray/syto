import { useState, useRef, useCallback } from 'react';
import { Volume2, Loader2 } from 'lucide-react';
import { synthesizeSpeech } from '@/lib/khaya';

// Module-level cache for audio blobs — persists for the browser tab lifetime
const audioCache = new Map<string, Blob>();

interface TTSButtonProps {
  text: string;
  language: string; // TTS language code (e.g. "twi", "ewe")
  size?: 'sm' | 'md';
}

export function TTSButton({ text, language, size = 'sm' }: TTSButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleClick = useCallback(async () => {
    // Stop if already playing
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      return;
    }

    setIsLoading(true);
    try {
      const cacheKey = `${text}|${language}`;
      let blob = audioCache.get(cacheKey);

      if (!blob) {
        blob = await synthesizeSpeech(text, language);
        audioCache.set(cacheKey, blob);
      }

      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(url);
      };
      audio.onerror = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(url);
      };

      setIsPlaying(true);
      await audio.play();
    } catch (error) {
      console.error('TTS playback error:', error);
      setIsPlaying(false);
    } finally {
      setIsLoading(false);
    }
  }, [text, language, isPlaying]);

  const iconSize = size === 'sm' ? 14 : 18;
  const btnSize = size === 'sm' ? 'h-6 w-6' : 'h-8 w-8';

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={`${btnSize} inline-flex items-center justify-center rounded-full transition-all
        ${isPlaying
          ? 'bg-ghana-green/20 text-ghana-green animate-pulse'
          : 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white'
        }
        disabled:opacity-50 disabled:cursor-not-allowed`}
      title="Listen"
    >
      {isLoading ? (
        <Loader2 size={iconSize} className="animate-spin" />
      ) : (
        <Volume2 size={iconSize} />
      )}
    </button>
  );
}
