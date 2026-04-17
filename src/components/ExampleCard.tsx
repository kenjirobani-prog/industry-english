'use client';

import { useState } from 'react';
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
      <mark
        key={i}
        className="bg-amber-400/20 text-amber-200 px-1 rounded font-semibold"
      >
        {part}
      </mark>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

export function ExampleCard({ example, highlightTerm }: Props) {
  const [showTranslation, setShowTranslation] = useState(true);
  const ttsReady = isTTSAvailable();

  return (
    <article className="w-full max-w-xl mx-auto rounded-3xl border border-border-soft bg-surface-1/80 backdrop-blur p-6 sm:p-8">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-[10px] font-display tracking-widest uppercase text-gold border border-gold/40 rounded-full px-2 py-0.5">
          {example.scene}
        </span>
        <span className="text-[10px] text-amber-200/50 truncate">
          出典: {example.source}
        </span>
      </div>

      <p className="text-lg sm:text-xl leading-relaxed text-amber-50 font-light mb-4">
        {highlight(example.sentence, highlightTerm)}
      </p>

      {showTranslation && (
        <p className="text-sm text-amber-100/70 leading-relaxed border-l-2 border-amber-400/40 pl-3 mb-5">
          {example.translation}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => speak(example.sentence, { rate: 1.0 })}
          onMouseLeave={cancelSpeech}
          disabled={!ttsReady}
          className="flex items-center gap-2 rounded-full bg-amber-500/20 text-amber-200 border border-amber-500/40 px-4 py-2 text-xs font-semibold disabled:opacity-40 hover:bg-amber-500/30 transition"
        >
          <span aria-hidden>🔊</span> 通常スピード
        </button>
        <button
          type="button"
          onClick={() => speak(example.sentence, { rate: 0.7 })}
          onMouseLeave={cancelSpeech}
          disabled={!ttsReady}
          className="flex items-center gap-2 rounded-full bg-amber-500/10 text-amber-200/80 border border-amber-500/30 px-4 py-2 text-xs font-semibold disabled:opacity-40 hover:bg-amber-500/20 transition"
        >
          <span aria-hidden>🐢</span> 0.7x スロー
        </button>
        <button
          type="button"
          onClick={() => setShowTranslation((v) => !v)}
          className="flex items-center gap-2 rounded-full bg-surface-3 text-amber-100/70 border border-border-soft px-4 py-2 text-xs font-semibold hover:bg-surface-2 transition"
        >
          {showTranslation ? '訳を隠す' : '訳を表示'}
        </button>
      </div>
    </article>
  );
}
