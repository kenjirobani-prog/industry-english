'use client';

import { useEffect, useState } from 'react';
import type { Keyword } from '@/types';
import { speak, cancelSpeech, isTTSAvailable } from '@/lib/tts';
import { isBookmarked, toggleBookmark } from '@/lib/storage';

type Props = {
  keyword: Keyword;
};

function FrequencyStars({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`使用頻度 ${value}/5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={`text-sm ${i <= value ? 'text-amber-400' : 'text-surface-3'}`}
        >
          ★
        </span>
      ))}
    </div>
  );
}

export function KeywordCard({ keyword }: Props) {
  const [bookmarked, setBookmarked] = useState(false);
  const [ttsReady, setTtsReady] = useState(false);

  useEffect(() => {
    setBookmarked(isBookmarked(keyword.id));
    setTtsReady(isTTSAvailable());
  }, [keyword.id]);

  const handleSpeak = () => speak(keyword.term, { rate: 0.95 });
  const handleBookmark = () => setBookmarked(toggleBookmark(keyword.id));

  return (
    <article className="relative w-full max-w-xl mx-auto rounded-3xl border border-border-soft bg-surface-1/80 backdrop-blur p-6 sm:p-8 shadow-[0_20px_60px_-30px_rgba(217,142,31,0.4)]">
      <div className="flex items-start justify-between gap-4 mb-4">
        <FrequencyStars value={keyword.frequency} />
        <button
          type="button"
          onClick={handleBookmark}
          aria-pressed={bookmarked}
          aria-label={bookmarked ? 'ブックマーク解除' : 'ブックマーク'}
          className="text-2xl leading-none transition-transform hover:scale-110"
        >
          <span className={bookmarked ? 'text-gold' : 'text-amber-200/40'}>
            {bookmarked ? '★' : '☆'}
          </span>
        </button>
      </div>

      <h2 className="font-display text-3xl sm:text-4xl text-amber-200 tracking-wide mb-1">
        {keyword.term}
      </h2>
      <p className="text-amber-100/80 text-sm sm:text-base mb-6">
        {keyword.meaning_ja}
      </p>

      <div className="space-y-3 mb-6">
        <div className="rounded-2xl bg-surface-2/80 border border-border-soft p-4">
          <div className="text-[10px] font-display tracking-widest uppercase text-gold mb-1">
            業界での意味
          </div>
          <p className="text-sm leading-relaxed text-amber-50/90">
            {keyword.meaning_industry}
          </p>
        </div>
        {keyword.meaning_general && (
          <div className="rounded-2xl bg-surface-2/40 border border-border-soft/60 p-4">
            <div className="text-[10px] font-display tracking-widest uppercase text-amber-200/60 mb-1">
              他業界では…
            </div>
            <p className="text-sm leading-relaxed text-amber-100/70">
              {keyword.meaning_general}
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSpeak}
          onMouseLeave={cancelSpeech}
          disabled={!ttsReady}
          className="flex-1 flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-amber-400 text-black font-semibold py-3 px-5 disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 transition"
        >
          <span aria-hidden>🔊</span>
          <span className="font-display tracking-wider uppercase text-sm">
            発音を聴く
          </span>
        </button>
      </div>
    </article>
  );
}
