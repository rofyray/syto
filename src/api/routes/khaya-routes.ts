import express, { Request, Response } from 'express';
import {
  getCachedTranslation,
  setCachedTranslation,
} from '../../lib/redis.js';

const router = express.Router();

const KHAYA_API_KEY = process.env.KHAYA_API_KEY || '';
const TRANSLATION_BASE_URL = 'https://translation-api.ghananlp.org/v1';
const TTS_BASE_URL = 'https://translation-api.ghananlp.org/tts/v2';

const CONCURRENCY_LIMIT = 5;

/**
 * Translate a single text via the Khaya API with 1 retry.
 */
async function translateSingleText(text: string, langPair: string, retries = 1): Promise<string> {
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
        await new Promise(r => setTimeout(r, 500));
        continue;
      }

      if (!response.ok) {
        const errText = await response.text().catch(() => 'Unknown error');
        throw new Error(`Translation API error (${response.status}): ${errText}`);
      }

      const translated = await response.text();
      return translated.trim();
    } catch (err) {
      if (attempt < retries) continue;
      throw err;
    }
  }
  throw new Error('Translation failed after retries');
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
  for (let i = 0; i < texts.length; i += CONCURRENCY_LIMIT) {
    const batch = texts.slice(i, i + CONCURRENCY_LIMIT);
    const batchResults = await Promise.all(
      batch.map(async ({ originalIndex, text }) => {
        try {
          const translation = await translateSingleText(text, langPair);
          setCachedTranslation(text, targetLang, translation);
          return { originalIndex, translation };
        } catch (err) {
          console.warn(`Translation failed for index ${originalIndex}, using original`);
          return { originalIndex, translation: text };
        }
      })
    );
    for (const { originalIndex, translation } of batchResults) {
      results[originalIndex] = translation;
    }
  }
}

/**
 * POST /api/khaya/translate
 * Batch-translates an array of texts to a target Ghanaian language.
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
    if (!KHAYA_API_KEY) {
      res.status(500).json({ error: 'Translation service not configured' });
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

    // Translate with concurrency control (max 5 at a time) to avoid API rate limits
    await translateWithConcurrency(uncachedTexts, langPair, targetLang, results);

    res.json({ translations: results });
  } catch (error: any) {
    console.error('Translation error:', error.message);

    if (error.message?.includes('429') || error.message?.includes('rate limit')) {
      res.status(429).json({ error: 'Translation service is busy. Please try again shortly.' });
      return;
    }

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
