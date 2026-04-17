'use client';

import { useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import type { Example } from '@/types';
import { speak, cancelSpeech, isTTSAvailable } from '@/lib/tts';

type Props = {
  example: Example;
  highlightTerm: string;
};

function highlight(sentence: string, term: string) {
  if (!term) return sentence;
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = sentence.split(new RegExp(`(${escaped})`, 'gi'));
  return parts.map((part, i) =>
    part.toLowerCase() === term.toLowerCase() ? (
      <span
        key={i}
        className="text-[var(--accent-strong)] font-medium underline decoration-[var(--accent)]/40 decoration-1 underline-offset-4"
      >
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

export function ExampleCard({ example, highlightTerm }: Props) {
  const [showTranslation, setShowTranslation] = useState(true);
  const ttsReady = isTTSAvailable();

  return (
    <article className="w-full rounded-[18px] bg-apple-gray text-apple-fg px-7 sm:px-10 py-10 sm:py-12 fade-up">
      <div className="flex items-center gap-3 mb-6 t-caption text-apple-fg-2">
        <span className="t-eyebrow text-[var(--accent-strong)]">Example</span>
        <span aria-hidden>·</span>
        <span className="truncate">出典: {example.source}</span>
      </div>

      <p className="t-subtitle leading-snug text-apple-fg mb-5 font-normal">
        {highlight(example.sentence, highlightTerm)}
      </p>

      {showTranslation && (
        <p className="t-body text-apple-fg-2 border-l border-apple-line pl-4 mb-7">
          {example.translation}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => speak(example.sentence, { rate: 1.0 })}
          onMouseLeave={cancelSpeech}
          disabled={!ttsReady}
          className="btn btn-primary"
        >
          <Volume2 size={16} strokeWidth={1.6} aria-hidden="true" />
          通常スピード
        </button>
        <button
          type="button"
          onClick={() => speak(example.sentence, { rate: 0.7 })}
          onMouseLeave={cancelSpeech}
          disabled={!ttsReady}
          className="btn btn-secondary"
        >
          <VolumeX size={16} strokeWidth={1.6} aria-hidden="true" />
          0.7x
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
