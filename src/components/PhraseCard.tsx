'use client';

import { useState } from 'react';
import type { Phrase } from '@/types';
import { speak, cancelSpeech, isTTSAvailable } from '@/lib/tts';

type Props = {
  phrase: Phrase;
};

export function PhraseCard({ phrase }: Props) {
  const ttsReady = isTTSAvailable();
  const [showTranslation, setShowTranslation] = useState(true);

  return (
    <article className="w-full rounded-[18px] bg-apple-gray text-apple-fg px-7 sm:px-10 py-10 sm:py-12 fade-up">
      <div className="t-eyebrow text-[var(--accent-strong)] mb-3">
        Phrase
      </div>
      <p className="t-section-title font-semibold text-apple-fg leading-snug mb-3">
        {phrase.phrase}
      </p>
      <p className="t-body-lg text-apple-fg-2 mb-6">{phrase.meaning_ja}</p>

      <div className="rounded-xl bg-white border border-apple-line p-5 mb-6">
        <div className="t-eyebrow text-apple-fg-2 mb-2">使い方</div>
        <p className="t-body text-apple-fg leading-relaxed">
          {phrase.usage_context}
        </p>
      </div>

      {phrase.examples.length > 0 && (
        <div className="space-y-3 mb-6">
          {phrase.examples.map((ex, i) => (
            <div key={i} className="rounded-xl bg-white border border-apple-line p-5">
              <p className="t-body text-apple-fg leading-relaxed">{ex.sentence}</p>
              {showTranslation && (
                <p className="t-small text-apple-fg-2 mt-2">{ex.translation}</p>
              )}
              <div className="flex items-center gap-3 mt-3">
                <button
                  type="button"
                  onClick={() => speak(ex.sentence, { rate: 0.95 })}
                  onMouseLeave={cancelSpeech}
                  disabled={!ttsReady}
                  className="link-chev t-small"
                >
                  🔊 再生
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => speak(phrase.phrase, { rate: 0.95 })}
          onMouseLeave={cancelSpeech}
          disabled={!ttsReady}
          className="btn btn-primary"
        >
          🔊 フレーズを聴く
        </button>
        <button
          type="button"
          onClick={() => setShowTranslation((v) => !v)}
          className="btn btn-ghost"
        >
          {showTranslation ? '訳を隠す' : '訳を表示'}
        </button>
      </div>
    </article>
  );
}
