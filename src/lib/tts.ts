// Web Speech API wrapper. SSR-safe — every call guards on `typeof window`.

export type SpeakOptions = {
  rate?: number;
  pitch?: number;
  voiceURI?: string;
  lang?: string;
  onEnd?: () => void;
};

let cachedVoices: SpeechSynthesisVoice[] | null = null;

export function isTTSAvailable(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function getVoices(): SpeechSynthesisVoice[] {
  if (!isTTSAvailable()) return [];
  if (cachedVoices && cachedVoices.length > 0) return cachedVoices;
  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) cachedVoices = voices;
  return voices;
}

export function pickEnglishVoice(): SpeechSynthesisVoice | null {
  const voices = getVoices();
  if (voices.length === 0) return null;
  const preferred =
    voices.find((v) => /en[-_]US/i.test(v.lang) && /Google|Samantha|Daniel/i.test(v.name)) ??
    voices.find((v) => /en[-_]US/i.test(v.lang)) ??
    voices.find((v) => /^en/i.test(v.lang));
  return preferred ?? null;
}

export function speak(text: string, options: SpeakOptions = {}): void {
  if (!isTTSAvailable()) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = options.rate ?? 1.0;
  utterance.pitch = options.pitch ?? 1.0;
  utterance.lang = options.lang ?? 'en-US';
  const voice = pickEnglishVoice();
  if (voice) utterance.voice = voice;
  if (options.onEnd) utterance.onend = options.onEnd;
  window.speechSynthesis.speak(utterance);
}

export function cancelSpeech(): void {
  if (!isTTSAvailable()) return;
  window.speechSynthesis.cancel();
}

// Voices load asynchronously on most browsers. Trigger a warmup.
export function warmupVoices(): void {
  if (!isTTSAvailable()) return;
  if (window.speechSynthesis.getVoices().length > 0) return;
  window.speechSynthesis.onvoiceschanged = () => {
    cachedVoices = window.speechSynthesis.getVoices();
  };
}
