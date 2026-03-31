import express, { Request, Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import {
  getCachedTranslation,
  setCachedTranslation,
} from '../../lib/redis.js';

const router = express.Router();

const KHAYA_API_KEY = process.env.KHAYA_API_KEY || '';
const TRANSLATION_BASE_URL = 'https://translation-api.ghananlp.org/v1';
const TTS_BASE_URL = 'https://translation-api.ghananlp.org/tts/v2';

const CONCURRENCY_LIMIT = 2;

const LANG_NAMES: Record<string, string> = {
  'tw': 'Twi', 'ee': 'Ewe', 'gaa': 'Ga',
  'fat': 'Fante', 'dag': 'Dagbani', 'gur': 'Gurune', 'kus': 'Kusaal',
};

/**
 * Translate a single text via the Khaya API with 1 retry.
 */
export async function translateSingleText(text: string, langPair: string, retries = 2): Promise<string> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(`${TRANSLATION_BASE_URL}/translate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Ocp-Apim-Subscription-Key': KHAYA_API_KEY,
        },
        body: JSON.stringify({ in: text, lang: langPair }),
      });

      if (response.status === 429 && attempt < retries) {
        // Rate limited — wait briefly and retry
        await new Promise(r => setTimeout(r, 1500));
        continue;
      }

      if (!response.ok) {
        const errText = await response.text().catch(() => 'Unknown error');
        throw new Error(`Translation API error (${response.status}): ${errText}`);
      }

      let translated = await response.text();
      translated = translated.trim();
      // Khaya API returns JSON-encoded strings with surrounding quotes
      if (translated.startsWith('"') && translated.endsWith('"')) {
        translated = translated.slice(1, -1);
      }
      return translated;
    } catch (err) {
      if (attempt < retries) continue;
      throw err;
    }
  }
  throw new Error('Translation failed after retries');
}

/**
 * Fallback: translate a batch of texts using Claude Haiku.
 * Single API call for all texts — much faster than per-text Khaya calls.
 */
export async function translateBatchWithHaiku(
  texts: string[],
  targetLangCode: string
): Promise<string[]> {
  const langName = LANG_NAMES[targetLangCode] || targetLangCode;

  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY!,
    timeout: 20_000,
  });

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4096,
    messages: [{
      role: 'user',
      content: `Translate these ${texts.length} English texts to ${langName} (a Ghanaian language). Return ONLY a JSON array of translated strings in the same order. Keep option labels like "A.", "B.", "C.", "D." unchanged at the start of each option.

${JSON.stringify(texts)}`,
    }],
  });

  const textBlock = response.content.find(b => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text in Haiku response');
  }

  // Extract JSON array from response (may have markdown fences)
  const jsonMatch = textBlock.text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error('Could not parse Haiku translation response');
  }

  const translated: string[] = JSON.parse(jsonMatch[0]);
  if (translated.length !== texts.length) {
    throw new Error(`Haiku returned ${translated.length} translations for ${texts.length} texts`);
  }

  return translated;
}

/**
 * Process translations with concurrency control to avoid overwhelming the Khaya API.
 */
async function translateWithConcurrency(
  texts: { originalIndex: number; text: string }[],
  langPair: string,
  targetLang: string,
  results: string[]
): Promise<void> {
  let lastError: Error | null = null;

  for (let i = 0; i < texts.length; i += CONCURRENCY_LIMIT) {
    // Delay between batches to avoid API rate limiting
    if (i > 0) {
      await new Promise(r => setTimeout(r, 800));
    }
    const batch = texts.slice(i, i + CONCURRENCY_LIMIT);
    const batchResults = await Promise.all(
      batch.map(async ({ originalIndex, text }) => {
        try {
          const translation = await translateSingleText(text, langPair);
          setCachedTranslation(text, targetLang, translation);
          return { originalIndex, translation, failed: false };
        } catch (err: any) {
          lastError = err;
          console.warn(`Khaya failed for index ${originalIndex}:`, err?.message);
          return { originalIndex, translation: text, failed: true };
        }
      })
    );
    for (const { originalIndex, translation } of batchResults) {
      results[originalIndex] = translation;
    }

    // If all translations in the first batch failed, stop early (likely auth/quota issue)
    if (i === 0 && batchResults.every(r => r.failed)) {
      throw lastError || new Error('Khaya translation service unavailable');
    }
  }
}

/**
 * POST /api/khaya/translate
 * Batch-translates an array of texts to a target Ghanaian language.
 * Primary: Khaya API. Fallback: Claude Haiku.
 * Body: { texts: string[], targetLang: string }
 * Returns: { translations: string[] }
 */
router.post('/translate', async (req: Request, res: Response): Promise<void> => {
  try {
    const { texts, targetLang } = req.body;

    if (!texts || !Array.isArray(texts) || texts.length === 0) {
      res.status(400).json({ error: 'texts must be a non-empty array of strings' });
      return;
    }
    if (!targetLang || typeof targetLang !== 'string') {
      res.status(400).json({ error: 'targetLang is required' });
      return;
    }

    const langPair = `en-${targetLang}`;
    const results: string[] = new Array(texts.length);
    const uncachedTexts: { originalIndex: number; text: string }[] = [];

    // Check Redis cache first (parallel lookups)
    const cacheResults = await Promise.all(
      texts.map(text => getCachedTranslation(text, targetLang))
    );
    for (let i = 0; i < texts.length; i++) {
      if (cacheResults[i] !== null) {
        results[i] = cacheResults[i]!;
      } else {
        uncachedTexts.push({ originalIndex: i, text: texts[i] });
      }
    }

    // If everything was cached, return immediately
    if (uncachedTexts.length === 0) {
      res.json({ translations: results });
      return;
    }

    // Try Khaya API first (only if API key is configured)
    if (KHAYA_API_KEY) {
      try {
        await translateWithConcurrency(uncachedTexts, langPair, targetLang, results);
        res.json({ translations: results });
        return;
      } catch (khayaError: any) {
        console.warn('Khaya API failed, falling back to Haiku:', khayaError?.message);
      }
    }

    // Fallback: translate uncached texts with Haiku (single fast API call)
    try {
      const uncachedStrings = uncachedTexts.map(t => t.text);
      const haikuTranslations = await translateBatchWithHaiku(uncachedStrings, targetLang);

      // Populate results and cache each translation
      for (let i = 0; i < uncachedTexts.length; i++) {
        const { originalIndex, text } = uncachedTexts[i];
        results[originalIndex] = haikuTranslations[i];
        setCachedTranslation(text, targetLang, haikuTranslations[i]);
      }

      res.json({ translations: results });
    } catch (haikuError: any) {
      console.error('Haiku fallback also failed:', haikuError?.message);
      res.status(502).json({ error: 'Translation service temporarily unavailable.' });
    }
  } catch (error: any) {
    console.error('Translation error:', error.message);
    res.status(502).json({ error: 'Translation service temporarily unavailable.' });
  }
});

/**
 * POST /api/khaya/tts
 * Synthesizes speech from text in a Ghanaian language.
 * Body: { text: string, language: string }
 * Returns: audio/mpeg blob
 */
router.post('/tts', async (req: Request, res: Response): Promise<void> => {
  try {
    const { text, language } = req.body;

    if (!text || typeof text !== 'string') {
      res.status(400).json({ error: 'text is required' });
      return;
    }
    if (!language || typeof language !== 'string') {
      res.status(400).json({ error: 'language is required' });
      return;
    }
    if (!KHAYA_API_KEY) {
      res.status(500).json({ error: 'TTS service not configured' });
      return;
    }

    const response = await fetch(`${TTS_BASE_URL}/synthesize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Ocp-Apim-Subscription-Key': KHAYA_API_KEY,
      },
      body: JSON.stringify({
        text,
        language,
        speaker_id: 'female',
        stream: true,
        format: 'mp3',
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => 'Unknown error');
      console.error(`TTS API error (${response.status}):`, errText);
      res.status(response.status === 429 ? 429 : 502).json({
        error: response.status === 429
          ? 'TTS service is busy. Please try again shortly.'
          : 'TTS service temporarily unavailable.',
      });
      return;
    }

    // Pipe audio response to client
    res.set('Content-Type', 'audio/mpeg');
    res.set('Cache-Control', 'public, max-age=86400'); // 24h browser cache

    const arrayBuffer = await response.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));
  } catch (error: any) {
    console.error('TTS error:', error.message);
    res.status(502).json({ error: 'TTS service temporarily unavailable.' });
  }
});

export default router;
