/**
 * Frontend API client for Khaya AI translation and TTS services.
 * All calls go through our backend proxy to protect the API key.
 */

export async function translateTexts(
  texts: string[],
  targetLang: string
): Promise<string[]> {
  try {
    const response = await fetch('/api/khaya/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts, targetLang }),
    });

    if (!response.ok) {
      console.error('Translation request failed:', response.status);
      return texts; // Graceful fallback: return original texts
    }

    const data = await response.json();
    return data.translations || texts;
  } catch (error) {
    console.error('Translation error:', error);
    return texts; // Graceful fallback
  }
}

export async function synthesizeSpeech(
  text: string,
  language: string
): Promise<Blob> {
  const response = await fetch('/api/khaya/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, language }),
  });

  if (!response.ok) {
    throw new Error(`TTS request failed: ${response.status}`);
  }

  return response.blob();
}
